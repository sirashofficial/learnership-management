# ðŸ“š LESSON GENERATOR â€” DOCUMENT INTELLIGENCE PROMPT
# Education Platform â€” PDF/Word Document Ingestion + AI Lesson Generation
# ========================================================================
# This prompt handles getting your 30 PDFs and Word documents INTO the
# system so the AI can read them when generating lesson plans.
#
# YOUR BACKEND ALREADY HAS THESE ENDPOINTS â€” we just need to wire them up:
#   POST /api/ai/index-documents   â† Upload + process documents
#   GET/POST /api/ai/semantic-search â† Search inside documents
#   POST /api/groups/{id}/lessons/generate â† Generate using doc content
#
# Paste this into Cursor AI or Claude Code in your VS Code project.
# =========================================================================

---

You are a senior full-stack developer implementing a document-powered AI
lesson generator. The user has ~30 PDF and Word documents containing
curriculum content (unit standards, learning guides, assessments, etc).
The goal is to let the AI read these documents and use their actual content
when generating lesson plans â€” not generic AI output.

The backend already has document indexing infrastructure. We are wiring
up the frontend and ensuring the full pipeline works end to end.

## WHAT "DOCUMENT-POWERED" MEANS (explain this to the user too)

Here is how this works in plain terms:

1. UPLOAD PHASE: You upload your PDFs and Word docs into the system once.
   The system reads them, breaks them into searchable chunks, and stores them.
   This is called "indexing" â€” it happens once per document.

2. SEARCH PHASE: When you ask for a lesson plan on "Unit Standard 3 - Health
   and Safety", the system searches through your uploaded documents and finds
   the relevant sections â€” learning outcomes, activities, assessment criteria.

3. GENERATE PHASE: Those relevant sections are sent to the AI along with
   your request. The AI writes the lesson plan using YOUR actual content,
   not generic information it was trained on.

This means lesson plans will reference your specific unit standards, use
your exact terminology, and align with your actual curriculum framework.

---

## NON-NEGOTIABLE RULES
1. Read every file before changing it. State what you found first.
2. Match existing code style exactly.
3. Every API call: auth headers + try/catch + loading state.
4. Never break what works. Surgical edits only.
5. Explain changes in plain language after each task.

---

## â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
## TASK 1 â€” DOCUMENT UPLOAD & MANAGEMENT PAGE
## â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

Create or enhance: src/app/admin/documents/page.tsx
(Or put it under Settings if Admin section doesn't exist yet)

### A) Document Library View

On page load, fetch indexed documents: GET /api/ai/index-documents

Display as a table/list:
| Document Name | Type | Size | Indexed Date | Status | Actions |
|--------------|------|------|-------------|--------|---------|

Status values:
- "Indexed" (green) â€” processed and searchable
- "Processing" (yellow, animated) â€” currently being indexed
- "Failed" (red) â€” indexing failed, show retry button
- "Pending" (grey) â€” queued

### B) Upload New Documents

"Upload Documents" button opens a file upload area:

```typescript
// Accept these file types only:
accept=".pdf,.doc,.docx,.txt"
// Allow multiple files at once:
multiple={true}
// Max file size: 50MB per file
```

Upload flow:
1. User drags files in OR clicks to browse
2. Files appear in a staging list BEFORE upload
3. Each staged file shows: name, size, type icon, remove button
4. "Upload & Index All" button sends all staged files
5. Call POST /api/ai/index-documents with FormData:

```typescript
const formData = new FormData()
stagedFiles.forEach(file => formData.append('files', file))
formData.append('category', selectedCategory) // e.g. "unit-standards", "learning-guide"
formData.append('description', optionalDescription)

const response = await fetch('/api/ai/index-documents', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  // DO NOT set Content-Type â€” browser sets it with boundary for FormData
  body: formData
})
```

6. Show per-file progress bars during upload
7. On complete, update status to "Processing" then poll for "Indexed"

### C) Document Categories

When uploading, user selects a category:
- Unit Standards
- Learning Guide / Facilitator Guide  
- Assessment Tools
- Learner Workbook
- Policy Documents
- Other

This category is stored with the document and used to filter search results
when generating specific types of content.

### D) Delete Document

Delete button with confirmation:
- Confirm: "Remove [filename] from the knowledge base? Lessons generated
  after this point won't use its content."
- Call DELETE /api/ai/index-documents with { documentId }
- Remove from list immediately (optimistic update)

### E) Re-index Button

If a document shows "Failed" status:
- "Retry" button â†’ calls POST /api/ai/index-documents with just that file's id
- Useful if the first indexing attempt failed

### F) Bulk Upload Helper Script (IMPORTANT)

The user has 30 documents already. Instead of uploading one by one through
the UI, create a one-time script they can run in the terminal.

Create: scripts/bulk-upload-documents.js

```javascript
/**
 * Bulk Document Upload Script
 * ============================
 * Run this ONCE to upload all your existing PDFs and Word docs.
 * 
 * HOW TO USE:
 * 1. Put all your PDF/Word files in a folder (e.g., /docs/curriculum/)
 * 2. Update DOCS_FOLDER path below to point to that folder
 * 3. Update API_BASE_URL to your app's URL
 * 4. Get your auth token (log in to the app, open DevTools > Application 
 *    > Local Storage > copy the 'token' value)
 * 5. Run: node scripts/bulk-upload-documents.js YOUR_TOKEN_HERE
 * 
 * The script will:
 * - Find all .pdf, .doc, .docx files in the folder
 * - Upload them one by one (to avoid overwhelming the server)
 * - Show progress for each file
 * - Report success/failure at the end
 */

const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const fetch = require('node-fetch')

// =============================================
// CONFIGURE THESE:
const DOCS_FOLDER = './docs/curriculum'        // â† change this to your folder
const API_BASE_URL = 'http://localhost:3000'   // â† change if different
const CATEGORY = 'unit-standards'              // â† change per batch if needed
// =============================================

const token = process.argv[2]
if (!token) {
  console.error('âŒ Please provide your auth token:')
  console.error('   node scripts/bulk-upload-documents.js YOUR_TOKEN_HERE')
  process.exit(1)
}

const SUPPORTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt']

async function uploadFile(filePath, filename) {
  const form = new FormData()
  form.append('files', fs.createReadStream(filePath), filename)
  form.append('category', CATEGORY)

  const response = await fetch(`${API_BASE_URL}/api/ai/index-documents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders()
    },
    body: form
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }
  return response.json()
}

async function main() {
  // Find all supported files
  const files = fs.readdirSync(DOCS_FOLDER)
    .filter(f => SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .map(f => ({ name: f, path: path.join(DOCS_FOLDER, f) }))

  if (files.length === 0) {
    console.log(`âŒ No supported files found in ${DOCS_FOLDER}`)
    console.log(`   Supported types: ${SUPPORTED_EXTENSIONS.join(', ')}`)
    process.exit(1)
  }

  console.log(`\nðŸ“š Found ${files.length} documents to upload\n`)

  let succeeded = 0
  let failed = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const num = `[${i + 1}/${files.length}]`
    process.stdout.write(`${num} Uploading ${file.name}...`)

    try {
      await uploadFile(file.path, file.name)
      console.log(' âœ… Indexed')
      succeeded++
    } catch (err) {
      console.log(` âŒ Failed: ${err.message}`)
      failed.push({ name: file.name, error: err.message })
    }

    // Small delay between files to not overwhelm server
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  console.log('\nâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•')
  console.log(`âœ… Successfully indexed: ${succeeded}/${files.length}`)
  if (failed.length > 0) {
    console.log(`âŒ Failed (${failed.length}):`)
    failed.forEach(f => console.log(`   - ${f.name}: ${f.error}`))
  }
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n')
}

main().catch(console.error)
```

Also add to package.json scripts:
```json
"upload-docs": "node scripts/bulk-upload-documents.js"
```

---

## â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
## TASK 2 â€” WIRE LESSON GENERATOR TO USE DOCUMENTS
## â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

File: src/app/lessons/page.tsx (or wherever the generator lives)

The lesson generator currently calls:
  POST /api/groups/{id}/lessons/generate

We need to check what that endpoint sends to the AI.
Look at: src/app/api/groups/[id]/lessons/generate/route.ts

### A) Read the generate endpoint first

Find and read src/app/api/groups/[id]/lessons/generate/route.ts

Look for:
- Does it call the AI with just the unit standard title? â†’ WEAK (no document content)
- Does it call /api/ai/semantic-search first? â†’ GOOD (using documents)
- Does it pass document chunks to the AI? â†’ BEST

### B) If the endpoint does NOT use documents yet, update it:

The pattern to implement in the backend route:

```typescript
// In: src/app/api/groups/[id]/lessons/generate/route.ts

export async function POST(req: Request, { params }) {
  const { unitStandardId, duration, learningOutcomes, notes, groupId } = await req.json()

  // Step 1: Load the unit standard details
  const unitStandard = await getUnitStandard(unitStandardId)

  // Step 2: Search documents for relevant content
  // This is the KEY step â€” find relevant sections from the uploaded PDFs
  const searchQuery = `${unitStandard.title} ${unitStandard.credits} learning outcomes activities`
  const relevantDocs = await searchDocuments(searchQuery, {
    category: ['unit-standards', 'learning-guide', 'learner-workbook'],
    limit: 5  // top 5 most relevant chunks
  })

  // Step 3: Build a rich prompt using document content
  const documentContext = relevantDocs.map(doc => 
    `--- From: ${doc.filename} ---\n${doc.content}\n`
  ).join('\n')

  const prompt = `
You are creating a lesson plan for a South African learnership programme.
Use the curriculum content below to create an accurate, specific lesson plan.
Do NOT invent content â€” base everything on the provided documents.

UNIT STANDARD: ${unitStandard.title}
UNIT STANDARD ID: ${unitStandard.code}
NQF LEVEL: ${unitStandard.nqfLevel}
CREDITS: ${unitStandard.credits}
GROUP: ${groupId}
DURATION: ${duration} minutes
SPECIFIC OUTCOMES: ${learningOutcomes}
FACILITATOR NOTES: ${notes || 'None'}

CURRICULUM CONTENT FROM YOUR DOCUMENTS:
${documentContext}

Generate a detailed lesson plan with these sections:
1. Lesson Overview (title, duration, outcomes)
2. Introduction / Warm-up (${Math.round(parseInt(duration) * 0.15)} minutes)
3. Main Content / Instruction (${Math.round(parseInt(duration) * 0.45)} minutes)  
4. Activity / Practice (${Math.round(parseInt(duration) * 0.25)} minutes)
5. Assessment / Check for Understanding (${Math.round(parseInt(duration) * 0.10)} minutes)
6. Wrap-up / Closing (${Math.round(parseInt(duration) * 0.05)} minutes)
7. Resources Needed
8. Differentiation Notes (for learners who need extra support)

Format as JSON with these exact keys:
{
  "title": "",
  "overview": "",
  "duration": ${duration},
  "learningOutcomes": [],
  "introduction": { "duration": 0, "content": "", "activities": [] },
  "mainContent": { "duration": 0, "content": "", "activities": [] },
  "activity": { "duration": 0, "instructions": "", "groupWork": false },
  "assessment": { "duration": 0, "method": "", "questions": [] },
  "wrapUp": { "duration": 0, "content": "" },
  "resources": [],
  "differentiationNotes": "",
  "sourceDocuments": []  // list the filenames you used
}
`

  // Step 4: Call AI with document-enriched prompt
  const aiResponse = await callAI(prompt)
  
  // Step 5: Parse and return
  return Response.json(JSON.parse(aiResponse))
}
```

### C) Frontend changes for the generator

In the lesson generator form, add a "Document Sources" indicator:

Before generating, call GET /api/ai/index-documents to check how many
documents are indexed. Show one of:

- ðŸŸ¢ "X documents indexed â€” lesson will use your curriculum content"
- ðŸŸ¡ "No documents indexed â€” lesson will use general AI knowledge only"
  (with a link to the document management page)

After generating, show which documents were used as sources:
```typescript
// If the generated plan includes sourceDocuments:
{generatedPlan.sourceDocuments?.length > 0 && (
  <div className="text-sm text-gray-500 mt-4">
    <p>ðŸ“š Generated using content from:</p>
    <ul>
      {generatedPlan.sourceDocuments.map(doc => (
        <li key={doc}>â€¢ {doc}</li>
      ))}
    </ul>
  </div>
)}
```

---

## â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
## TASK 3 â€” DOCUMENT SEARCH PAGE (Curriculum Search)
## â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

File: Enhance src/app/ai/page.tsx OR create src/app/curriculum/search/page.tsx

Add a "Search Curriculum Documents" feature:

### A) Search Interface

Simple search bar with filters:
- Text search input
- Category filter (All / Unit Standards / Learning Guides / etc.)
- "Search" button

On search, call:
```typescript
GET /api/ai/semantic-search?q={query}&category={category}&limit=10
```

### B) Results Display

Each result shows:
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ðŸ“„ Unit Standard 12433 â€” Health and Safety       â”‚
â”‚ Source: US_12433_Health_Safety.pdf               â”‚
â”‚ Relevance: â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘ 82%                        â”‚
â”‚                                                  â”‚
â”‚ "...the learner will be able to identify         â”‚
â”‚  hazards in the workplace and apply              â”‚
â”‚  appropriate safety procedures..."               â”‚
â”‚                                                  â”‚
â”‚ [Use in Lesson] [View Full Document]             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### C) "Use in Lesson" Action

Clicking "Use in Lesson" on a search result:
- Navigates to /lessons with the unit standard pre-selected
- Passes the document content as additional context
- Pre-fills the learning outcomes from the search result

---

## â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
## TASK 4 â€” AI ASSESSMENT GENERATOR (Uses Documents)
## â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

File: Enhance src/app/assessments/page.tsx
OR create: src/app/assessments/generate/page.tsx

Your backend has: GET/POST /api/ai/generate-assessment

### A) Assessment Generator Form

Fields:
- Unit Standard selector (GET /api/unit-standards)
- Assessment type: Formative / Summative / Practical
- Number of questions (5 / 10 / 15 / 20)
- Difficulty: Foundation / Intermediate / Advanced
- Format: Multiple Choice / Short Answer / Essay / Mixed

On submit, call:
```typescript
POST /api/ai/generate-assessment
{
  unitStandardId,
  type,          // formative | summative | practical
  questionCount,
  difficulty,
  format
}
```

The backend should already search your indexed documents before generating.
If it doesn't, apply the same document-search pattern from Task 2.

### B) Display Generated Assessment

Show questions in a formatted list:
- For MCQ: question + 4 options (A, B, C, D) with correct answer marked
- For short answer: question + model answer + marks allocation
- For practical: task description + evidence requirements + marking rubric

### C) Save as Assessment Template

"Save as Template" â†’ POST /api/assessments/templates
"Create Assessment from This" â†’ POST /api/assessments (creates actual assessment)

---

## â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
## TASK 5 â€” ADD DOCUMENT UPLOAD TO SETTINGS/ADMIN
## â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

File: src/app/settings/page.tsx OR src/app/admin/page.tsx

Add a "Knowledge Base" section/tab to the admin or settings area:

Show:
- Total documents indexed
- Total size of knowledge base
- Last indexed date
- Quick link to "Manage Documents" â†’ goes to Task 1 page
- "Re-index All" button (rebuilds all document indexes from scratch)
  â†’ POST /api/ai/index-documents with { reindexAll: true }

This gives admins a quick health check on the document system.

---

## â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
## HOW TO GET STARTED WITH YOUR 30 DOCUMENTS
## (Plain language instructions for the developer)
## â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

After all code tasks are complete, the developer should do this:

### Option A â€” Bulk Script (Recommended for 30 files)

1. Create a folder in your project: mkdir docs/curriculum
2. Copy all 30 PDFs and Word docs into that folder
3. Install the required npm packages:
   npm install node-fetch form-data --save-dev
4. Get your auth token:
   - Open the app in Chrome
   - Press F12 (DevTools) â†’ Application tab â†’ Local Storage
   - Find the entry called 'token' and copy the value
5. Run the script:
   node scripts/bulk-upload-documents.js PASTE_YOUR_TOKEN_HERE
6. Watch the terminal â€” it will show each file uploading
7. When done, go to Admin â†’ Knowledge Base to see all documents indexed

### Option B â€” Manual Upload Through UI

1. Go to Admin â†’ Document Management (built in Task 1)
2. Click "Upload Documents"
3. Drag all 30 files at once into the upload area
4. Select category for each batch (Unit Standards, Learning Guide, etc.)
5. Click "Upload & Index All"
6. Wait for all files to show "Indexed" status (may take a few minutes)

### Option C â€” Put Files in Public Folder (Development Only)

During development, you can put documents in /public/curriculum/ and
update the index-documents endpoint to read from the filesystem directly.
This avoids needing to upload through the UI during testing.

### How Long Does Indexing Take?

- Small PDF (< 5MB): ~10-30 seconds
- Large PDF (> 20MB): 1-2 minutes
- Word doc: ~15-45 seconds
- 30 documents total: expect 15-30 minutes for the full batch

The bulk script does them one at a time with a 500ms gap so the server
isn't overwhelmed. You can leave it running in the background.

---

## WHAT TO CHECK BEFORE CALLING THIS DONE

- [ ] Can upload a single PDF through the UI
- [ ] File appears in document library with "Indexed" status
- [ ] Bulk script successfully uploads all 30 documents
- [ ] All 30 show as "Indexed" in the admin panel
- [ ] Generating a lesson plan for a specific unit standard returns content
      that references actual terminology from your documents (not generic)
- [ ] The generated lesson plan shows which document(s) it used as sources
- [ ] Curriculum search finds relevant content when you type a unit standard title
- [ ] If the document store is empty, the generator shows a warning
      instead of silently generating generic content

---

## COMMON PROBLEMS & FIXES

**Problem**: Upload succeeds but status stays "Processing" forever
**Fix**: Check the backend indexing process â€” it may have crashed silently.
Look in server logs for errors from the PDF parsing library.
The most common issue is a missing library: `npm install pdf-parse mammoth`

**Problem**: Generated lessons don't reference document content
**Fix**: The generate endpoint isn't calling semantic-search first.
Apply the document-enriched prompt pattern from Task 2B.

**Problem**: "Failed to parse PDF" error
**Fix**: Some PDFs are scanned images (not real text). These need OCR.
For now, re-export them as proper text PDFs from Word or a PDF editor.
Flag these files to the user â€” they need to be re-created as text PDFs.

**Problem**: Word .docx files fail to index
**Fix**: Install mammoth: `npm install mammoth`
mammoth converts .docx to HTML/text which can then be indexed.

**Problem**: Very large PDFs (100+ pages) time out during indexing
**Fix**: The indexing should chunk the document â€” check if there's a
chunk_size setting in the index-documents route. Split large files
into smaller ones if needed (e.g., one per unit standard).

**Problem**: Semantic search returns irrelevant results
**Fix**: The search query needs to be more specific. Instead of just the
unit standard title, include key terms from the outcomes.
Also check if the embedding model is configured correctly in the backend.

