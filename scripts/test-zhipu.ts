import OpenAI from 'openai';

const zai = new OpenAI({
    apiKey: process.env.ZAI_API_KEY || 'c99b0e51e73847649f18e159c44952b6.kA11zAESKdMXPrjL',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
});

async function main() {
    try {
        console.log("Testing Embeddings on open.bigmodel.cn...");
        const response = await zai.embeddings.create({
            model: 'embedding-2',
            input: "Test embedding",
        });
        console.log("Success! Dimension:", response.data[0].embedding.length);
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
