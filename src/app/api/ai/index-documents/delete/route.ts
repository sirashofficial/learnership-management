import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { getPineconeIndex, PINECONE_NAMESPACE } from '@/lib/ai/pinecone';

export const dynamic = 'force-dynamic';

// DELETE: Remove a document and its chunks
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { documentId } = body;

        if (!documentId) {
            return Response.json(
                { success: false, error: 'Document ID is required' },
                { status: 400 }
            );
        }

        // Delete all chunks with this document ID prefix
        const deletedChunks = await prisma.documentChunk.deleteMany({
            where: {
                id: {
                    startsWith: documentId,
                },
            },
        });

        // Delete from Pinecone
        try {
            const index = getPineconeIndex();
            // Get all chunk IDs for this document
            const chunkIds = [];
            for (let i = 0; i < 100; i++) {
                chunkIds.push(`${documentId}-chunk-${i}`);
            }
            
            await index.namespace(PINECONE_NAMESPACE).deleteMany(chunkIds);
        } catch (pineconeError) {
            console.error('Pinecone delete error:', pineconeError);
            // Continue even if Pinecone delete fails
        }

        return successResponse({
            message: 'Document deleted successfully',
            deletedChunks: deletedChunks.count,
        });
    } catch (error) {
        console.error('Delete document error:', error);
        return handleApiError(error);
    }
}
