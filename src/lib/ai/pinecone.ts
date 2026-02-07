import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Pinecone client
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || '',
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
        // Use Pinecone's integrated inference for search
        // @ts-ignore
        const results = await index.namespace(PINECONE_NAMESPACE).searchRecords({
            query: {
                topK,
                inputs: { text: query },
                filter: filter || undefined,
            },
        });

        return results.result.hits.map((hit) => ({
            id: hit._id,
            score: hit._score || 0,
            content: ((hit.fields as any)?.text as string) || '',
            metadata: {
                id: hit._id,
                filename: ((hit.fields as any)?.filename as string) || '',
                category: ((hit.fields as any)?.category as string) || '',
                moduleNumber: (hit.fields as any)?.moduleNumber as number | undefined,
                moduleName: ((hit.fields as any)?.moduleName as string) || '',
                unitStandardCode: ((hit.fields as any)?.unitStandardCode as string) || '',
                tags: (((hit.fields as any)?.tags as string) || '').split(',').filter(Boolean),
                content: ((hit.fields as any)?.text as string) || '',
                chunkIndex: ((hit.fields as any)?.chunkIndex as number) || 0,
                totalChunks: ((hit.fields as any)?.totalChunks as number) || 1,
                createdAt: ((hit.fields as any)?.createdAt as string) || '',
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

    const formattedRecords = records.map((record) => ({
        _id: record.id,
        text: record.text,
        ...record.metadata,
        tags: record.metadata.tags.join(','),
    }));

    // Upsert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < formattedRecords.length; i += batchSize) {
        const batch = formattedRecords.slice(i, i + batchSize);
        // @ts-ignore
        await index.namespace(PINECONE_NAMESPACE).upsertRecords({ records: batch });
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
