require('dotenv').config({ path: '.env.local' });
const { Pinecone } = require('@pinecone-database/pinecone');

async function recreatePineconeIndex() {
    try {
        if (!process.env.PINECONE_API_KEY) {
            throw new Error('PINECONE_API_KEY not found in .env.local');
        }

        console.log('🔧 Initializing Pinecone client...');
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });

        const indexName = 'learnership-docs';

        console.log(`📋 Checking if index "${indexName}" exists...`);
        const existingIndexes = await pinecone.listIndexes();
        const indexExists = existingIndexes.indexes?.some(idx => idx.name === indexName);

        if (indexExists) {
            console.log(`🗑️  Deleting existing index "${indexName}"...`);
            await pinecone.deleteIndex(indexName);
            console.log('   ✅ Old index deleted');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`🚀 Creating index "${indexName}" with Cohere dimensions...`);
        await pinecone.createIndex({
            name: indexName,
            dimension: 1024, // Cohere embed-english-v3.0 dimension
            metric: 'cosine',
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1',
                },
            },
        });

        console.log(`✅ Index "${indexName}" created successfully!`);
        console.log('📊 Index Configuration:');
        console.log('   - Dimension: 1024 (Cohere embed-english-v3.0)');
        console.log('   - Metric: cosine');
        console.log('   - Type: Serverless (AWS us-east-1)');
        console.log('');
        console.log('⏳ Note: Index may take a few moments to be ready.');

    } catch (error) {
        console.error('❌ Error creating Pinecone index:', error.message);
        process.exit(1);
    }
}

recreatePineconeIndex();
