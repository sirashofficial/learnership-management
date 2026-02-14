import OpenAI from 'openai';

const zai = new OpenAI({
    apiKey: process.env.ZAI_API_KEY || 'c99b0e51e73847649f18e159c44952b6.kA11zAESKdMXPrjL',
    baseURL: 'https://api.z.ai/api/paas/v4/',
});

async function main() {
    try {
        console.log("Fetching models...");
        const list = await zai.models.list();
        console.log("Available Models:");
        for await (const model of list) {
            console.log(model);
        }
    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

main();
