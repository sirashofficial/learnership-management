---
name: edu-platform-document-rag-skill
description: >
  Use this skill when implementing document ingestion, indexing, and 
  retrieval-augmented generation (RAG) for the education platform.
  Covers: PDF/Word upload pipeline, document indexing via 
  /api/ai/index-documents, semantic search wiring, lesson generator 
  document enrichment, bulk upload script, and AI assessment generation.
  Use AFTER Phase 1 and Phase 2 core features are implemented.
---

# Document Intelligence Skill
## Education Platform — RAG Pipeline for Lesson Generation

---

## What This Skill Is For

The education platform has ~30 PDFs and Word documents containing:
- Unit standards (specific outcomes, assessment criteria, range statements)
- Facilitator/learning guides
- Learner workbooks
- Assessment tools and rubrics

The goal: when a facilitator generates a lesson plan, the AI uses content
from THESE SPECIFIC DOCUMENTS rather than generic training knowledge.

This is called RAG — Retrieval-Augmented Generation. In plain terms:
1. Documents are uploaded and stored as searchable text chunks
2. When generating a lesson, the system searches for relevant chunks
3. Those chunks are included in the AI prompt as context
4. The AI writes the lesson based on the actual curriculum content

---

## Existing Backend Infrastructure

The backend already has these endpoints — we are WIRING them up, not
building new backend logic from scratch (unless the existing logic is
incomplete):

```
GET/POST /api/ai/index-documents   Upload + process documents
GET/POST /api/ai/semantic-search   Search indexed document content
POST     /api/ai/chat              Chat with context injection
POST     /api/groups/{id}/lessons/generate  Lesson generation
POST     /api/ai/generate-assessment        Assessment generation
```

---

## Key Libraries to Check For

Before implementing anything, check what's installed:

```bash
cat package.json | grep -E "pdf|mammoth|openai|anthropic|pinecone|weaviate|qdrant|chroma|embed"
```

Common document processing libraries:
- `pdf-parse` or `pdfjs-dist` — PDF text extraction
- `mammoth` — Word (.docx) to text/HTML conversion
- `langchain` — Document chunking and embedding pipeline
- `openai` — Embeddings (text-embedding-ada-002) and chat
- `@anthropic-ai/sdk` — Claude API
- Vector DB: `pinecone`, `qdrant-client`, `@zilliz/milvus2-sdk-node`, 
  `chromadb`, or Postgres with pgvector extension

The implementation approach depends entirely on what's installed.
Read the package.json first and adapt accordingly.

---

## Architecture Understanding

### How /api/ai/index-documents should work:

```
User uploads PDF/Word
       ↓
Extract text from file
  (pdf-parse for PDF, mammoth for .docx)
       ↓
Split into chunks
  (~500 tokens each, with 50-token overlap)
       ↓
Generate embeddings for each chunk
  (OpenAI text-embedding-ada-002 or similar)
       ↓
Store chunks + embeddings in vector DB
  (Pinecone, Qdrant, pgvector, etc.)
       ↓
Store document metadata in main DB
  (filename, category, chunk count, status)
       ↓
Return { success: true, chunksCreated: N, documentId }
```

### How /api/ai/semantic-search should work:

```
User submits query string
       ↓
Generate embedding for the query
  (same model as used for chunks)
       ↓
Search vector DB for nearest chunks
  (cosine similarity, top K results)
       ↓
Return chunks with: content, filename, page, similarity score
```

### How lesson generation should work WITH documents:

```
User submits: unitStandardId + duration + outcomes
       ↓
Load unit standard from database
       ↓
Build search query from unit standard details
       ↓
Search documents → get top 5 relevant chunks
       ↓
Build prompt: [unit standard info] + [document chunks] + [generation instructions]
       ↓
Send to AI (Claude/GPT)
       ↓
Parse response → return structured lesson plan JSON
```

---

## File Reading Order

When the agent starts, read these files in order:

1. `package.json` — what libraries are available
2. `src/app/api/ai/index-documents/route.ts` — how indexing works now
3. `src/app/api/ai/semantic-search/route.ts` — how search works now
4. `src/app/api/groups/[id]/lessons/generate/route.ts` — the generator
5. Any `.env` or `.env.local` — what AI keys/vector DB is configured

This reading order tells you everything you need to know before writing
a single line of code.

---

## The Three States of the Backend

After reading the files, you'll find one of these situations:

### State A — Fully Implemented (Just Wire the Frontend)
The index-documents and semantic-search endpoints work correctly.
The generate endpoint already calls semantic-search before the AI.
Action: Just build the upload UI and verify the pipeline works.

### State B — Partially Implemented (Complete the Backend)
The endpoints exist but have placeholder logic (e.g., they accept files
but don't actually extract/embed/store).
Action: Complete the missing parts using the architecture above.
Most likely missing step: actually storing embeddings in a vector DB.

### State C — Stub Only (Build the Pipeline)
The endpoints return mock data or { message: "not implemented" }.
Action: Implement the full pipeline. Start by deciding which vector DB
to use based on what's in package.json or .env.

---

## Vector DB Decision Guide

Choose based on what's available:

| If package.json has | Use this |
|--------------------|---------|
| `pinecone` | Pinecone cloud vector DB |
| `qdrant-client` | Qdrant (self-hosted or cloud) |
| `chromadb` | ChromaDB (local, great for dev) |
| `langchain` | LangChain's vectorstore abstraction |
| PostgreSQL + `pgvector` | pgvector extension (same DB) |
| None of the above | Recommend: chromadb for dev, Pinecone for prod |

The simplest option for getting started quickly:
```bash
npm install chromadb @xenova/transformers
```
ChromaDB runs locally with no external account needed — ideal for
getting the 30 documents indexed quickly during development.

---

## Document Processing Patterns

### PDF Extraction
```typescript
import pdfParse from 'pdf-parse'

async function extractPDFText(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer)
  return data.text
}
```

### Word Document Extraction
```typescript
import mammoth from 'mammoth'

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}
```

### Text Chunking
```typescript
function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim().length > 50) { // skip tiny chunks
      chunks.push(chunk)
    }
  }
  return chunks
}
```

### Determining file type from upload
```typescript
function getFileProcessor(filename: string) {
  const ext = filename.toLowerCase().split('.').pop()
  switch(ext) {
    case 'pdf': return extractPDFText
    case 'doc':
    case 'docx': return extractDocxText
    case 'txt': return (buf: Buffer) => buf.toString('utf-8')
    default: throw new Error(`Unsupported file type: ${ext}`)
  }
}
```

---

## Frontend Patterns

### File Upload with Progress
```typescript
const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

const uploadWithProgress = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('files', file)
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100)
        setUploadProgress(prev => ({ ...prev, [file.name]: pct }))
      }
    }
    
    xhr.onload = () => {
      if (xhr.status === 200) resolve()
      else reject(new Error(xhr.responseText))
    }
    
    xhr.open('POST', '/api/ai/index-documents')
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
  })
}
```

### Polling for Indexing Status
Documents may take time to index. Poll until complete:
```typescript
const pollIndexingStatus = async (documentId: string) => {
  const maxAttempts = 30  // 30 * 3s = 90 second timeout
  let attempts = 0
  
  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 3000)) // wait 3 seconds
    const res = await api.get(`/api/ai/index-documents?id=${documentId}`)
    
    if (res.status === 'indexed') return 'indexed'
    if (res.status === 'failed') return 'failed'
    
    attempts++
  }
  return 'timeout'
}
```

### Document Status Indicator
```typescript
const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    indexed:    { color: 'green', label: 'Indexed', icon: '✓' },
    processing: { color: 'yellow', label: 'Processing...', icon: '⟳', animate: true },
    failed:     { color: 'red', label: 'Failed', icon: '✗' },
    pending:    { color: 'gray', label: 'Pending', icon: '○' },
  }
  const c = config[status] || config.pending
  return (
    <span className={`text-${c.color}-600 bg-${c.color}-50 px-2 py-1 rounded text-xs`}>
      {c.icon} {c.label}
    </span>
  )
}
```

---

## Enriched Lesson Generation Prompt Template

This is the prompt structure to use when calling the AI for lesson generation.
Adapt to whatever AI provider is being used (OpenAI, Anthropic, etc.):

```typescript
const buildLessonPrompt = (
  unitStandard: UnitStandard,
  duration: number,
  documentChunks: DocumentChunk[],
  facilitatorNotes?: string
) => {
  const context = documentChunks.length > 0
    ? documentChunks.map(c => `[${c.filename}]\n${c.content}`).join('\n\n---\n\n')
    : 'No specific curriculum documents available — use general knowledge.'

  return `You are creating a lesson plan for a South African learnership programme.

UNIT STANDARD DETAILS:
Title: ${unitStandard.title}
Code: ${unitStandard.code}
NQF Level: ${unitStandard.nqfLevel}
Credits: ${unitStandard.credits}
Specific Outcomes: ${unitStandard.specificOutcomes?.join(', ')}

SESSION DURATION: ${duration} minutes

CURRICULUM CONTENT FROM UPLOADED DOCUMENTS:
${context}

FACILITATOR NOTES: ${facilitatorNotes || 'None'}

INSTRUCTIONS:
- Base the lesson PRIMARILY on the curriculum content provided above
- Use the exact terminology and outcomes from the documents
- If documents reference specific activities or examples, include them
- Structure timing proportionally: intro 15%, main content 45%, 
  activity 25%, assessment 10%, wrap-up 5%
- Return ONLY valid JSON — no markdown, no extra text

Required JSON format:
{
  "title": "string",
  "unitStandardCode": "string",
  "duration": number,
  "nqfLevel": number,
  "learningOutcomes": ["string"],
  "introduction": {
    "duration": number,
    "content": "string",
    "icebreaker": "string"
  },
  "mainContent": {
    "duration": number,
    "content": "string",
    "keyPoints": ["string"],
    "examples": ["string"]
  },
  "activity": {
    "duration": number,
    "title": "string",
    "instructions": "string",
    "isGroupWork": boolean,
    "materials": ["string"]
  },
  "assessment": {
    "duration": number,
    "method": "string",
    "questions": ["string"],
    "successCriteria": "string"
  },
  "wrapUp": {
    "duration": number,
    "summary": "string",
    "nextSteps": "string"
  },
  "resources": ["string"],
  "differentiationNotes": "string",
  "sourceDocuments": ["string"]
}`
}
```

---

## Bulk Upload Script Requirements

The script at `scripts/bulk-upload-documents.js` needs these to run:

```bash
npm install node-fetch form-data --save-dev
```

Or if using Node 18+, `node-fetch` isn't needed (use native fetch).
Check Node version: `node --version`

For Node 18+, replace `require('node-fetch')` with the built-in fetch.

The script must handle:
- Files that don't exist (log warning, skip)
- Network errors (retry once, then mark as failed)
- Rate limiting from the server (add delay between files)
- Files larger than the server's upload limit (log warning with file size)

---

## Common Issues in This Codebase

### Issue: Scanned PDFs (images not text)
Some PDF files are actually scanned images. pdf-parse will return an
empty string for these. Detection:
```typescript
const text = await extractPDFText(buffer)
if (text.trim().length < 100) {
  // Likely a scanned image PDF — can't extract text without OCR
  throw new Error(`${filename} appears to be a scanned image PDF. 
    Please re-export it as a text-based PDF from Word or a PDF editor.`)
}
```
Flag these files to the user — they need to be recreated as text PDFs.

### Issue: Documents indexed but search returns empty
Check that the embedding model used for search queries MATCHES the model
used for document indexing. Using different models = incompatible vectors.

### Issue: Generated lesson is generic despite indexed documents
The semantic search query isn't finding relevant chunks. Debug:
```typescript
// Add logging to the generate endpoint:
console.log('Search query:', searchQuery)
console.log('Chunks found:', relevantDocs.length)
if (relevantDocs.length > 0) {
  console.log('Top chunk preview:', relevantDocs[0].content.slice(0, 200))
}
```

### Issue: Large Word docs fail to upload
mammoth can struggle with complex .docx files (tables, images, etc).
Use: `mammoth.extractRawText({ buffer })` (not convertToHtml) for plain text.
For very complex files, try stripping the formatting first by opening in
Word and saving as "Plain Text (.txt)" then uploading that instead.

---

## Verification Steps

- [ ] Single PDF uploads successfully through the admin UI
- [ ] Document appears with "Indexed" status after ~30 seconds
- [ ] Word .docx file uploads and indexes correctly
- [ ] Bulk script runs without crashing and shows progress
- [ ] All 30 documents show "Indexed" in the admin panel
- [ ] Semantic search returns relevant text when searching for a unit standard title
- [ ] Generated lesson plan includes terminology from the actual documents
- [ ] Generated plan shows "sourceDocuments" list with actual filenames
- [ ] If 0 documents indexed, lesson generator shows a clear warning
- [ ] Document category filter works in search results
