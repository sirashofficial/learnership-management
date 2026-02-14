import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { upsertDocuments } from '@/lib/ai/pinecone';

export const dynamic = 'force-dynamic';

// POST: Retry indexing a failed document
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { documentId } = body;

        if (!documentId) {
            return Response.json(
                { success: false, error: 'Document ID is required' },
                { status: 400 }
            );
        }

        // Get chunks for this document
        const chunks = await prisma.documentChunk.findMany({
            where: {
                id: {
                    startsWith: documentId,
                },
            },
        });

        if (chunks.length === 0) {
            return Response.json(
                { success: false, error: 'Document not found' },
                { status: 404 }
            );
        }

        // Re-index in Pinecone
        const records = chunks.map((chunk) => ({
            id: chunk.id,
            text: chunk.content,
            metadata: {
                filename: chunk.filename,
                category: chunk.category,
                tags: chunk.tags.split(',').filter(Boolean),
                chunkIndex: chunk.chunkIndex,
                totalChunks: chunks.length,
                createdAt: chunk.createdAt.toISOString(),
            },
        }));

        await upsertDocuments(records);

        return successResponse({
            message: 'Document re-indexed successfully',
            chunks: records.length,
        });
    } catch (error) {
        console.error('Retry indexing error:', error);
        return handleApiError(error);
    }
}
