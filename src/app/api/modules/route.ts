import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper functions
function successResponse(data: any, status = 200) {
    return NextResponse.json(data, { status });
}

function errorResponse(message: string, status = 400, details?: any) {
    return NextResponse.json({ error: message, details }, { status });
}

function handleApiError(error: any) {
    console.error('API Error:', error);
    return errorResponse(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        500
    );
}

// GET /api/modules - List all modules
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const includeUnitStandards = searchParams.get('includeUnitStandards') === 'true';

        const modules = await prisma.module.findMany({
            orderBy: { moduleNumber: 'asc' },
            include: {
                unitStandards: includeUnitStandards ? {
                    orderBy: { code: 'asc' }
                } : false,
                _count: {
                    select: {
                        unitStandards: true,
                        students: true,
                        progress: true
                    }
                }
            }
        });

        return successResponse({ modules });
    } catch (error) {
        return handleApiError(error);
    }
}
