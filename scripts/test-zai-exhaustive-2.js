
const OpenAI = require('openai');
const fs = require('fs');

const apiKey = 'c99b0e51e73847649f18e159c44952b6.kA11zAESKdMXPrjL';

const zai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
});

function log(msg) {
    console.log(msg);
    fs.appendFileSync('zai_output.txt', msg + '\n');
}

async function main() {
    log("Listing models...");
    try {
        const list = await zai.models.list();
        const models = list.data.map(m => m.id);
        log('Available Models: ' + models.join(', '));

        for (const model of models) {
            log(`Testing model: ${model}...`);
            try {
                const response = await zai.chat.completions.create({
                    model: model,
                    messages: [{ role: 'user', content: 'Hi' }],
                });
                log(`SUCCESS with ${model}: ${response.choices[0].message.content}`);
                // return; // Don't stop, try to find the "cheapest" functional one or just verify all
            } catch (e) {
                log(`Failed ${model}: ${e.error ? e.error.message : e.message}`);
            }
        }
    } catch (e) {
        log('List Error: ' + e.message);
    }
}

main();
