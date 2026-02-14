
const { CohereClient } = require('cohere-ai');

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY || 'plSwcLogGdpMGBstpusri2NdddalxTII13rOxtOa',
});

async function main() {
    console.log("Testing Cohere Embedding...");
    try {
        const response = await cohere.embed({
            texts: ['Hello world'],
            model: 'embed-english-v3.0',
            inputType: 'search_query',
        });
        console.log('Success:', response.embeddings ? 'Embeddings received' : 'No embeddings');
    } catch (e) {
        console.error('Error:', e.message);
        if (e.body) console.error('Body:', JSON.stringify(e.body));
    }
}

main();
