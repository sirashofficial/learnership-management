import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || 'pcsk_5TGCtk_6GDnYTuYsVBWqTHSAsdzj88waQAvwodYLi22GQkeFg5sc8H9RdZZNxahtCCJYKf',
});

const INDEX_NAME = 'learnership-docs';

async function main() {
    try {
        console.log(`Checking index: ${INDEX_NAME}...`);
        const indexDescription = await pinecone.describeIndex(INDEX_NAME);
        console.log("Index Description:", JSON.stringify(indexDescription, null, 2));
    } catch (error) {
        console.error("Error describing index:", error);
    }
}

main();
