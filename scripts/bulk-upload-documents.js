/**
 * Bulk Document Upload Script
 * ============================
 * Run this ONCE to upload all your existing PDFs and Word docs.
 * 
 * HOW TO USE:
 * 1. Put all your PDF/Word files in a folder (e.g., ./docs/curriculum/)
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

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// =============================================
// CONFIGURE THESE:
const DOCS_FOLDER = './docs/curriculum';        // ← change this to your folder
const API_BASE_URL = 'http://localhost:3000';   // ← change if different
const CATEGORY = 'unit-standards';              // ← change per batch if needed
// =============================================

const token = process.argv[2];
if (!token) {
  console.error('❌ Please provide your auth token:');
  console.error('   node scripts/bulk-upload-documents.js YOUR_TOKEN_HERE');
  console.error('');
  console.error('To get your token:');
  console.error('1. Log in to the app in your browser');
  console.error('2. Press F12 to open DevTools');
  console.error('3. Go to Application tab > Local Storage');
  console.error('4. Find "token" and copy its value');
  process.exit(1);
}

const SUPPORTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];

async function uploadFile(filePath, filename) {
  const form = new FormData();
  form.append('files', fs.createReadStream(filePath), filename);
  form.append('category', CATEGORY);

  const response = await fetch(`${API_BASE_URL}/api/ai/index-documents/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders()
    },
    body: form
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response.json();
}

async function main() {
  // Check if docs folder exists
  if (!fs.existsSync(DOCS_FOLDER)) {
    console.error(`❌ Folder not found: ${DOCS_FOLDER}`);
    console.error(`   Please create the folder and add your documents, or update DOCS_FOLDER in the script.`);
    process.exit(1);
  }

  // Find all supported files
  const files = fs.readdirSync(DOCS_FOLDER)
    .filter(f => SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .map(f => ({ name: f, path: path.join(DOCS_FOLDER, f) }));

  if (files.length === 0) {
    console.log(`❌ No supported files found in ${DOCS_FOLDER}`);
    console.log(`   Supported types: ${SUPPORTED_EXTENSIONS.join(', ')}`);
    process.exit(1);
  }

  console.log(`\n📚 Found ${files.length} documents to upload\n`);
  console.log(`   Folder: ${DOCS_FOLDER}`);
  console.log(`   Category: ${CATEGORY}`);
  console.log(`   API: ${API_BASE_URL}\n`);

  let succeeded = 0;
  let failed = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const num = `[${i + 1}/${files.length}]`;
    process.stdout.write(`${num} Uploading ${file.name}...`);

    try {
      await uploadFile(file.path, file.name);
      console.log(' ✅ Indexed');
      succeeded++;
    } catch (err) {
      console.log(` ❌ Failed: ${err.message}`);
      failed.push({ name: file.name, error: err.message });
    }

    // Small delay between files to not overwhelm server
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n═══════════════════════════════════');
  console.log(`✅ Successfully indexed: ${succeeded}/${files.length}`);
  if (failed.length > 0) {
    console.log(`❌ Failed (${failed.length}):`);
    failed.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
  }
  console.log('═══════════════════════════════════\n');
  
  if (succeeded > 0) {
    console.log('✨ Upload complete! Go to Admin > Document Management to view your documents.\n');
  }
}

main().catch(err => {
  console.error('\n❌ Script error:', err);
  process.exit(1);
});
