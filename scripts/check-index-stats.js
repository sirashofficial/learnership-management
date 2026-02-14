require('dotenv').config({ path: '.env.local' });
const { Pinecone } = require('@pinecone-database/pinecone');

async function checkIndexStats() {
    try {
        console.log('🔧 Initializing Pinecone client...');
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });

        const indexName = 'learnership-docs';
        console.log(`📊 Fetching stats for index "${indexName}"...\n`);

        const index = pinecone.index(indexName);
        const stats = await index.describeIndexStats();

        console.log('='.repeat(60));
        console.log('INDEX STATISTICS');
        console.log('='.repeat(60));
        console.log(`Total vectors: ${stats.totalRecordCount || 0}`);
        console.log(`Dimensions: ${stats.dimension || 'N/A'}`);
        console.log(`Index fullness: ${stats.indexFullness || 0}`);

        if (stats.namespaces) {
            console.log('\nNamespaces:');
            Object.entries(stats.namespaces).forEach(([ns, data]) => {
                console.log(`  - ${ns || '(default)'}: ${data.recordCount || 0} vectors`);
            });
        }
        console.log('='.repeat(60));

        if (stats.totalRecordCount === 0) {
            console.log('\n⚠️  Index is empty. Upload documents first using:');
            console.log('   node scripts/upload-docs-to-pinecone.js');
        } else {
            console.log('\n✅ Index contains data and is ready for queries!');
        }

    } catch (error) {
        console.error('❌ Error checking index stats:', error.message);
        process.exit(1);
    }
}

checkIndexStats();
