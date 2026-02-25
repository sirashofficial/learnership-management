
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, withRateLimit, getAuthContext } from '@/middleware/apiAuth';

export const dynamic = 'force-dynamic';

async function handleGet(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const moduleId = searchParams.get('moduleId');

        const where = moduleId ? { moduleId } : {};

        const formatives = await prisma.formativeAssessment.findMany({
            where,
            include: {
                module: {
                    select: {
                        code: true,
                        name: true,
                    }
                },
                unitStandard: {
                    select: {
                        code: true,
                        title: true,
                    }
                },
                completions: true, // Include all completions for now, frontend can filter
            },
            orderBy: {
                order: 'asc',
            }
        });

        return NextResponse.json({ success: true, data: formatives });
    } catch (error) {
        console.error('Error fetching formatives:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch formative assessments' },
            { status: 500 }
        );
    }
}

export const GET = withAuth(withRateLimit(handleGet, 'moderate'), ['ADMIN', 'FACILITATOR', 'STUDENT']);
