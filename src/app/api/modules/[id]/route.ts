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

// GET /api/modules/[id] - Get module details with unit standards
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const module = await prisma.module.findUnique({
            where: { id: params.id },
            include: {
                unitStandards: {
                    orderBy: { code: 'asc' }
                },
                _count: {
                    select: {
                        students: true,
                        progress: true
                    }
                }
            }
        });

        if (!module) {
            return errorResponse('Module not found', 404);
        }

        return successResponse({ module });
    } catch (error) {
        return handleApiError(error);
    }
}
