
const { CohereClient } = require('cohere-ai');
const fs = require('fs');

const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY || 'plSwcLogGdpMGBstpusri2NdddalxTII13rOxtOa',
});

async function main() {
    console.log("Listing Cohere models...");
    try {
        const response = await cohere.models.list();
        const models = response.models.map(m => m.name);
        fs.writeFileSync('cohere_models.txt', models.join('\n'));
        console.log('Saved models to cohere_models.txt');
    } catch (e) {
        console.error('Error:', e.message);
    }
}

main();
