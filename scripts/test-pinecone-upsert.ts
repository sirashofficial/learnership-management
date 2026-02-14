import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || 'pcsk_5TGCtk_6GDnYTuYsVBWqTHSAsdzj88waQAvwodYLi22GQkeFg5sc8H9RdZZNxahtCCJYKf',
});

const INDEX_NAME = 'learnership-docs';
const NAMESPACE = 'curriculum';

async function main() {
    try {
        console.log("Testing Pinecone Upsert...");
        const index = pinecone.index(INDEX_NAME);

        // Dummy vector
        const vector = {
            id: 'test-upsert-1',
            values: new Array(1024).fill(0.1),
            metadata: { test: 'true' }
        };

        console.log("Attempt 1: Upsert array");
        try {
            // @ts-ignore
            await index.namespace(NAMESPACE).upsert({ records: [vector] });
            console.log("Success with ARRAY!");
        } catch (e) {
            console.error("Failed with ARRAY:", (e as Error).message);
        }

        console.log("Attempt 2: Upsert object { records: ... }");
        try {
            // @ts-ignore
            await index.namespace(NAMESPACE).upsert(vector); // Wait, this is single record? No.
            // @ts-ignore
            await index.namespace(NAMESPACE).upsert({ records: [vector] }); // Object with records
            // or maybe just vector object? No upsert takes list.
            // @ts-ignore
            await index.namespace(NAMESPACE).upsert([vector]); // Wait, I just tested this.

            // @ts-ignore
            await index.namespace(NAMESPACE).upsert([{ ...vector, id: 'test-upsert-2' }], { namespace: NAMESPACE }); // Old signature?
        } catch (e) {
            // Ignoring Attempt 2 for now, let's focus on records object
        }

        console.log("Attempt 3: Upsert object { upsertRequest: { vectors: ... } } (v2 style)");
        try {
            // @ts-ignore
            await index.namespace(NAMESPACE).upsert({ upsertRequest: { vectors: [vector] } });
            console.log("Success with v2 style!");
        } catch (e) {
            console.log("Failed with v2 style");
        }

    } catch (error) {
        console.error("Error:", (error as Error).message);
    }
}

main();
