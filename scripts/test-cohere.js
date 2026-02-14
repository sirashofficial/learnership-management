
const { CohereClient } = require('cohere-ai');

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY || 'plSwcLogGdpMGBstpusri2NdddalxTII13rOxtOa',
});

async function main() {
    console.log("Testing Cohere...");
    try {
        const response = await cohere.chat({
            model: 'command-r-08-2024',
            message: 'Hello, are you working?',
            preamble: 'You are a helpful assistant.',
        });
        console.log('Success:', response.text);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

main();
