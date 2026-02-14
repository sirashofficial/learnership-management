import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY || 'plSwcLogGdpMGBstpusri2NdddalxTII13rOxtOa',
});

async function main() {
    try {
        console.log("Testing Cohere Embed...");
        const response = await cohere.embed({
            model: 'embed-english-v3.0',
            texts: ["This is a test document."],
            inputType: 'search_document',
        });

        console.log("Response:", JSON.stringify(response, null, 2));

        if (Array.isArray(response.embeddings) && response.embeddings.length > 0) {
            console.log("Success! Embedding length:", response.embeddings[0].length);
        } else {
            console.log("No embeddings returned.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
