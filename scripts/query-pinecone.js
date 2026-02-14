require('dotenv').config({ path: '.env.local' });
const { Pinecone } = require('@pinecone-database/pinecone');
const { CohereClient } = require('cohere-ai');

const INDEX_NAME = 'learnership-docs';

async function queryPinecone(queryText, topK = 5) {
    try {
        if (!process.env.PINECONE_API_KEY) {
            throw new Error('PINECONE_API_KEY not found in .env.local');
        }
        if (!process.env.COHERE_API_KEY) {
            throw new Error('COHERE_API_KEY not found in .env.local');
        }

        const query = queryText || process.argv[2] || 'What are the module requirements?';

        console.log('🔧 Initializing clients...');
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        const cohere = new CohereClient({
            token: process.env.COHERE_API_KEY,
        });

        console.log(`🔍 Query: "${query}"\n`);

        console.log('⚡ Generating query embedding...');
        const response = await cohere.embed({
            texts: [query],
            model: 'embed-english-v3.0',
            inputType: 'search_query',
        });

        const queryEmbedding = response.embeddings[0];

        console.log('🔎 Searching Pinecone index...\n');
        const index = pinecone.index(INDEX_NAME);
        const searchResults = await index.query({
            vector: queryEmbedding,
            topK,
            includeMetadata: true,
        });

        // Display results
        console.log('='.repeat(80));
        console.log(`📊 TOP ${topK} RESULTS`);
        console.log('='.repeat(80));

        searchResults.matches.forEach((match, idx) => {
            console.log(`\n${idx + 1}. Score: ${match.score.toFixed(4)}`);
            console.log(`   File: ${match.metadata.filename || 'Unknown'}`);
            console.log(`   Category: ${match.metadata.category || 'N/A'}`);
            if (match.metadata.module) {
                console.log(`   Module: ${match.metadata.module}`);
            }
            if (match.metadata.tags && match.metadata.tags.length > 0) {
                console.log(`   Tags: ${match.metadata.tags.join(', ')}`);
            }
            console.log(`   Chunk: ${match.metadata.chunkIndex + 1}/${match.metadata.totalChunks}`);
            console.log(`\n   Preview:`);
            const preview = match.metadata.text || 'No preview available';
            console.log(`   ${preview.substring(0, 200)}...`);
            console.log('-'.repeat(80));
        });

        console.log('\n✅ Query completed successfully!');

    } catch (error) {
        console.error('❌ Error querying Pinecone:', error.message);

        if (error.message.includes('API_KEY')) {
            console.log('\n⚠️  Please ensure both API keys are set in .env.local:');
            console.log('   PINECONE_API_KEY=your-pinecone-key');
            console.log('   COHERE_API_KEY=your-cohere-key');
        }

        process.exit(1);
    }
}

queryPinecone();
