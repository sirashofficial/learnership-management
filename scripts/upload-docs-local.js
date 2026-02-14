const Database = require('better-sqlite3');
const path = require('path');
const {
    extractText,
    chunkText,
    generateMetadata,
    findDocuments,
} = require('../lib/document-processor');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath);
const BATCH_SIZE = 50;

async function uploadDocumentsLocal() {
    try {
        console.log('🔧 Initializing local upload to SQLite (using better-sqlite3)...');
        console.log(`💾 Database: ${dbPath}`);

        // Find all documents
        const docsDir = path.join(__dirname, '..', 'docs', 'Curriculumn and data process');
        console.log(`🔍 Scanning for documents in: ${docsDir}`);
        const documentPaths = await findDocuments(docsDir);
        console.log(`📚 Found ${documentPaths.length} documents to process`);

        let totalChunks = 0;
        let processedFiles = 0;

        // Prepare statement for insertion
        const insertStmt = db.prepare(`
            INSERT INTO DocumentChunk (id, content, filename, filePath, category, tags, chunkIndex, createdAt)
            VALUES (@id, @content, @filename, @filePath, @category, @tags, @chunkIndex, @createdAt)
        `);

        // Transaction for batch insert
        const insertMany = db.transaction((chunks) => {
            for (const chunk of chunks) insertStmt.run(chunk);
        });

        const allChunks = [];

        // Process each document
        for (const filePath of documentPaths) {
            try {
                const fileName = path.basename(filePath);
                console.log(`\n📄 Processing: ${fileName}`);

                // Extract text
                const text = await extractText(filePath);
                if (!text || text.length < 100) {
                    console.log(`  ⚠️  Skipped (insufficient content or empty)`);
                    continue;
                }

                // Chunk the text
                const chunks = chunkText(text, 1000); // Larger chunks for local keyword search
                console.log(`  ✂️  Split into ${chunks.length} chunks`);

                // Generate metadata
                const metadata = generateMetadata(filePath, docsDir);

                // Prepare chunks for database
                for (let i = 0; i < chunks.length; i++) {
                    allChunks.push({
                        id: crypto.randomUUID(), // Generate CUID/UUID
                        content: chunks[i],
                        filename: metadata.filename,
                        filePath: metadata.filepath,
                        category: metadata.category || 'general',
                        tags: (metadata.tags || []).join(','),
                        chunkIndex: i,
                        createdAt: new Date().toISOString(),
                    });
                    totalChunks++;
                }

                process.stdout.write(`  ✅ Queued chunks`);
                processedFiles++;

                // Upload in batches
                if (allChunks.length >= BATCH_SIZE) {
                    console.log(`\n📤 Saving batch of ${allChunks.length} chunks to database...`);
                    insertMany(allChunks);
                    console.log(`  ✅ Batch saved`);
                    allChunks.length = 0;
                }

            } catch (error) {
                console.error(`\n  ❌ Error processing file: ${fileName}`, error.message);
            }
        }

        // Upload remaining chunks
        if (allChunks.length > 0) {
            console.log(`\n📤 Saving final batch of ${allChunks.length} chunks...`);
            insertMany(allChunks);
            console.log(`  ✅ Final batch saved`);
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 UPLOAD SUMMARY (LOCAL DB)');
        console.log('='.repeat(60));
        console.log(`✅ Successfully processed: ${processedFiles} files`);
        console.log(`📦 Total chunks saved: ${totalChunks}`);
        console.log(`💾 Scanned directory: ${docsDir}`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Error uploading documents:', error.message);
    } finally {
        db.close();
    }
}

// Run the script
uploadDocumentsLocal();
