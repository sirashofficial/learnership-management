
const { Pinecone } = require('@pinecone-database/pinecone');

const pinecone = new Pinecone({
    apiKey: (process.env.PINECONE_API_KEY || 'pcsk_5TGCtk_6GDnYTuYsVBWqTHSAsdzj88waQAvwodYLi22GQkeFg5sc8H9RdZZNxahtCCJYKf').trim(),
});

async function main() {
    console.log("Testing Pinecone from Env...");
    try {
        const index = pinecone.index('learnership-docs');
        const stats = await index.describeIndexStats();
        console.log('Success:', JSON.stringify(stats));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

main();
