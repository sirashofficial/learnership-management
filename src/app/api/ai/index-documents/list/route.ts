import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: List all indexed documents
export async function GET(request: NextRequest) {
    try {
        // Get unique documents from chunks
        const chunks = await prisma.documentChunk.findMany({
            orderBy: { createdAt: 'desc' },
        });

        // Group by filename to get unique documents
        const documentMap = new Map<string, any>();

        for (const chunk of chunks) {
            if (!documentMap.has(chunk.filename)) {
                documentMap.set(chunk.filename, {
                    id: chunk.id.split('-chunk-')[0], // Get document ID
                    filename: chunk.filename,
                    category: chunk.category,
                    status: 'indexed',
                    chunks: 1,
                    createdAt: chunk.createdAt.toISOString(),
                });
            } else {
                const doc = documentMap.get(chunk.filename);
                doc.chunks += 1;
            }
        }

        const documents = Array.from(documentMap.values());

        return successResponse({
            documents,
            total: documents.length,
        });
    } catch (error) {
        console.error('List documents error:', error);
        return handleApiError(error);
    }
}
