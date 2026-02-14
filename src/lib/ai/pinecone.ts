import { Pinecone } from '@pinecone-database/pinecone';
import { generateEmbedding } from './cohere';

// Initialize Pinecone client
const pinecone = new Pinecone({
    apiKey: (process.env.PINECONE_API_KEY || '').trim(),
});

export const PINECONE_INDEX_NAME = 'learnership-docs';
export const PINECONE_NAMESPACE = 'curriculum';

export function getPineconeIndex() {
    return pinecone.index(PINECONE_INDEX_NAME);
}

export interface DocumentMetadata {
    id: string;
    filename: string;
    category: string;
    moduleNumber?: number;
    moduleName?: string;
    unitStandardCode?: string;
    tags: string[];
    content: string;
    chunkIndex: number;
    totalChunks: number;
    createdAt: string;
}

export interface SearchResult {
    id: string;
    score: number;
    content: string;
    metadata: DocumentMetadata;
}

export async function searchDocuments(
    query: string,
    topK: number = 5,
    filter?: Record<string, string | number | string[]>
): Promise<SearchResult[]> {
    const index = getPineconeIndex();

    try {
        // Generate embedding for the query using Z.AI
        const queryEmbedding = await generateEmbedding(query);

        const results = await index.namespace(PINECONE_NAMESPACE).query({
            vector: queryEmbedding,
            topK,
            filter: filter || undefined,
            includeMetadata: true,
            includeValues: false,
        });

        return results.matches.map((hit) => ({
            id: hit.id,
            score: hit.score || 0,
            content: (hit.metadata?.content as string) || '',
            metadata: {
                id: hit.id,
                filename: (hit.metadata?.filename as string) || '',
                category: (hit.metadata?.category as string) || '',
                moduleNumber: hit.metadata?.moduleNumber as number | undefined,
                moduleName: (hit.metadata?.moduleName as string) || '',
                unitStandardCode: (hit.metadata?.unitStandardCode as string) || '',
                tags: ((hit.metadata?.tags as string) || '').split(',').filter(Boolean),
                content: (hit.metadata?.content as string) || '',
                chunkIndex: (hit.metadata?.chunkIndex as number) || 0,
                totalChunks: (hit.metadata?.totalChunks as number) || 1,
                createdAt: (hit.metadata?.createdAt as string) || '',
            },
        }));
    } catch (error) {
        console.error('Pinecone search error:', error);
        throw error;
    }
}

export async function upsertDocuments(
    records: Array<{
        id: string;
        text: string;
        metadata: Omit<DocumentMetadata, 'id' | 'content'>;
    }>
): Promise<void> {
    const index = getPineconeIndex();
    const batchSize = 50;

    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        // Generate embeddings for the batch
        // Note: Ideally parallelize this or use batch embedding API if available
        const vectors = await Promise.all(
            batch.map(async (record) => {
                const embedding = await generateEmbedding(record.text);
                return {
                    id: record.id,
                    values: embedding,
                    metadata: {
                        ...record.metadata,
                        content: record.text, // Store text in metadata for retrieval
                        tags: record.metadata.tags.join(','),
                    },
                };
            })
        );

        // @ts-ignore
        await index.namespace(PINECONE_NAMESPACE).upsert({ records: vectors } as any);
    }
}

export async function deleteDocuments(ids: string[]): Promise<void> {
    const index = getPineconeIndex();
    await index.namespace(PINECONE_NAMESPACE).deleteMany(ids);
}

export async function getIndexStats() {
    const index = getPineconeIndex();
    return await index.describeIndexStats();
}

export { pinecone };
