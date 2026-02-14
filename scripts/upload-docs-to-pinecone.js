require('dotenv').config({ path: '.env.local' });
const { Pinecone } = require('@pinecone-database/pinecone');
const { CohereClient } = require('cohere-ai');
const path = require('path');
const {
    extractText,
    chunkText,
    generateMetadata,
    findDocuments,
} = require('../lib/document-processor');

const BATCH_SIZE = 100;
const INDEX_NAME = 'learnership-docs';

async function uploadDocumentsToPinecone() {
    try {
        // Validate environment variables
        if (!process.env.PINECONE_API_KEY) {
            throw new Error('PINECONE_API_KEY not found in .env.local');
        }
        if (!process.env.COHERE_API_KEY) {
            throw new Error('COHERE_API_KEY not found in .env.local');
        }

        console.log('🔧 Initializing clients...');
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        const cohere = new CohereClient({
            token: process.env.COHERE_API_KEY,
        });

        console.log(`📋 Connecting to index "${INDEX_NAME}"...`);
        const index = pinecone.index(INDEX_NAME);

        const docsDir = path.join(__dirname, '..', 'docs', 'Curriculumn and data process');
        console.log(`🔍 Scanning for documents in: ${docsDir}`);
        const documentPaths = await findDocuments(docsDir);
        console.log(`📚 Found ${documentPaths.length} documents to process`);

        let totalChunks = 0;
        let processedFiles = 0;
        const allVectors = [];

        // Process each document
        for (const filePath of documentPaths) {
            try {
                const fileName = path.basename(filePath);
                console.log(`\n📄 Processing: ${fileName}`);

                const text = await extractText(filePath);
                if (!text || text.length < 100) {
                    console.log(`  ⚠️  Skipped (insufficient content)`);
                    continue;
                }

                const chunks = chunkText(text, 500);
                console.log(`  ✂️  Split into ${chunks.length} chunks`);

                const metadata = generateMetadata(filePath, docsDir);

                // Generate embeddings for all chunks at once (Cohere batch API)
                console.log(`  ⚡ Generating embeddings...`);
                const response = await cohere.embed({
                    texts: chunks,
                    model: 'embed-english-v3.0',
                    inputType: 'search_document',
                });

                // Create vectors
                for (let i = 0; i < chunks.length; i++) {
                    const vectorId = `${path.basename(filePath, path.extname(filePath))}_chunk_${i}`;

                    allVectors.push({
                        id: vectorId,
                        values: response.embeddings[i],
                        metadata: {
                            ...metadata,
                            chunkIndex: i,
                            totalChunks: chunks.length,
                            text: chunks[i].substring(0, 1000),
                        },
                    });

                    totalChunks++;
                }

                console.log(`  ✅ Completed (${chunks.length} chunks)`);
                processedFiles++;

                // Upload in batches
                if (allVectors.length >= BATCH_SIZE) {
                    console.log(`\n📤 Uploading batch of ${allVectors.length} vectors...`);
                    await index.upsert(allVectors);
                    console.log(`  ✅ Batch uploaded`);
                    allVectors.length = 0;
                }

            } catch (error) {
                console.error(`\n  ❌ Error processing file: ${error.message}`);
            }
        }

        // Upload remaining vectors
        if (allVectors.length > 0) {
            console.log(`\n📤 Uploading final batch of ${allVectors.length} vectors...`);
            await index.upsert(allVectors);
            console.log(`  ✅ Final batch uploaded`);
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 UPLOAD SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successfully processed: ${processedFiles} files`);
        console.log(`📦 Total chunks created: ${totalChunks}`);
        console.log(`🚀 All vectors uploaded to index: ${INDEX_NAME}`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Error uploading documents:', error.message);

        if (error.message.includes('API_KEY')) {
            console.log('\n⚠️  Please ensure both API keys are set in .env.local:');
            console.log('   PINECONE_API_KEY=your-pinecone-key');
            console.log('   COHERE_API_KEY=your-cohere-key');
        }

        process.exit(1);
    }
}

uploadDocumentsToPinecone();
