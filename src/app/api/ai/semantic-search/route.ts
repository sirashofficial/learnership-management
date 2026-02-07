import { NextRequest } from 'next/server';
import { searchDocuments, SearchResult } from '@/lib/ai/pinecone';
import { successResponse, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            query,
            topK = 5,
            moduleNumber,
            category,
            includeContent = true
        } = body;

        if (!query || typeof query !== 'string') {
            return Response.json(
                { success: false, error: 'Query is required' },
                { status: 400 }
            );
        }

        // Build filter if specified
        const filter: Record<string, number | string> = {};
        if (moduleNumber) {
            filter.moduleNumber = moduleNumber;
        }
        if (category) {
            filter.category = category;
        }

        const results = await searchDocuments(query, topK, Object.keys(filter).length > 0 ? filter : undefined);

        // Format results for the frontend
        const formattedResults = results.map((result: SearchResult) => ({
            id: result.id,
            score: result.score,
            filename: result.metadata.filename,
            category: result.metadata.category,
            moduleNumber: result.metadata.moduleNumber,
            moduleName: result.metadata.moduleName,
            tags: result.metadata.tags,
            content: includeContent ? result.content : result.content.substring(0, 200) + '...',
            preview: result.content.substring(0, 300) + (result.content.length > 300 ? '...' : ''),
        }));

        return successResponse({
            query,
            results: formattedResults,
            total: formattedResults.length,
        });
    } catch (error) {
        console.error('Semantic search error:', error);
        return handleApiError(error);
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const topK = parseInt(searchParams.get('topK') || '5');
        const moduleNumber = searchParams.get('module');
        const category = searchParams.get('category');

        if (!query) {
            return successResponse({ results: [], total: 0 });
        }

        // Build filter
        const filter: Record<string, number | string> = {};
        if (moduleNumber) {
            filter.moduleNumber = parseInt(moduleNumber);
        }
        if (category) {
            filter.category = category;
        }

        const results = await searchDocuments(query, topK, Object.keys(filter).length > 0 ? filter : undefined);

        const formattedResults = results.map((result: SearchResult) => ({
            id: result.id,
            score: result.score,
            filename: result.metadata.filename,
            category: result.metadata.category,
            moduleNumber: result.metadata.moduleNumber,
            moduleName: result.metadata.moduleName,
            tags: result.metadata.tags,
            preview: result.content.substring(0, 300) + (result.content.length > 300 ? '...' : ''),
        }));

        return successResponse({
            query,
            results: formattedResults,
            total: formattedResults.length,
        });
    } catch (error) {
        console.error('Semantic search error:', error);
        return handleApiError(error);
    }
}
