# Pinecone Knowledge Base Scripts

This directory contains scripts for setting up and managing the Pinecone knowledge base for the Learnership Management System.

## Prerequisites

Before running these scripts, you need to add the following API keys to your `.env.local` file:

```bash
# Pinecone Configuration
PINECONE_API_KEY="your-pinecone-api-key-here"

# OpenAI Configuration  
OPENAI_API_KEY="your-openai-api-key-here"
```

### Getting API Keys

1. **Pinecone API Key**:
   - Sign up at https://www.pinecone.io/
   - Go to API Keys section
   - Create a new API key
   - Copy the key to `.env.local`

2. **OpenAI API Key**:
   - Sign up at https://platform.openai.com/
   - Go to API Keys section
   - Create a new secret key
   - Copy the key to `.env.local`

## Scripts

### 1. Setup Pinecone Index

```bash
node scripts/pinecone-setup.js
```

Creates the `learnership-docs` index in Pinecone with the following configuration:
- Dimension: 1536 (OpenAI text-embedding-ada-002)
- Metric: cosine similarity
- Type: Serverless (AWS us-east-1)

**Note**: Only needs to be run once. Will skip if index already exists.

### 2. Upload Documents

```bash
node scripts/upload-docs-to-pinecone.js
```

Processes and uploads all documents from `docs/Curriculumn and data process`:
- Extracts text from PDF, DOCX, and Markdown files
- Chunks documents into manageable sizes
- Generates embeddings using OpenAI
- Uploads vectors to Pinecone with metadata

**Processing**:
- ~50+ documents will be processed
- Each document is chunked into 500-token segments
- Metadata includes: filename, category, module, tags, dates
- Progress is displayed for each file

**Cost Estimate**: ~$0.10-0.50 for OpenAI embeddings

### 3. Query Pinecone (Test)

```bash
node scripts/query-pinecone.js "What are the Module 1 requirements?"
```

Test semantic search in the Pinecone knowledge base:
- Accepts a query string as argument
- Generates embedding for the query
- Searches Pinecone index
- Displays top 5 results with scores and previews

**Example queries**:
```bash
node scripts/query-pinecone.js "HIV education assessment"
node scripts/query-pinecone.js "daily report template"
node scripts/query-pinecone.js "numeracy formative assessment"
```

## Document Categories

Documents are automatically categorized and tagged:

- `daily-reports` - Daily training reports
- `module-1` through `module-6` - Module-specific materials
- `learner-guides` - Learner work-through materials
- `training-materials` - YEHA training content
- `planning` - Roll-out plans and group information
- `documentation` - System documentation

## Troubleshooting

**Error: API_KEY not found**
- Make sure you've added both `PINECONE_API_KEY` and `OPENAI_API_KEY` to `.env.local`

**Error: Index not found**
- Run `pinecone-setup.js` first to create the index

**Error: Rate limit exceeded**
- OpenAI has rate limits. The script automatically handles this with batching.
- If errors persist, wait a few minutes and try again.

**Error: PDF parsing failed**
- Some PDFs may be image-based or corrupted
- The script will skip these and continue with other files

