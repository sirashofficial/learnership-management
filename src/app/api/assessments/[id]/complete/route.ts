/**
 * API Route: Complete Assessment
 * POST /api/assessments/[id]/complete
 * 
 * Marks an assessment as complete and triggers automatic progress recalculation
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateProgressFromAssessment } from '@/lib/progress-calculator';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const { result, score, feedback, assessedDate } = body;

        // Validate result
        if (!['COMPETENT', 'NOT_YET_COMPETENT'].includes(result)) {
            return NextResponse.json(
                { error: 'Invalid result. Must be COMPETENT or NOT_YET_COMPETENT' },
                { status: 400 }
            );
        }

        // Update the assessment
        const assessment = await prisma.assessment.update({
            where: { id },
            data: {
                result,
                score: score || null,
                feedback: feedback || null,
                assessedDate: assessedDate ? new Date(assessedDate) : new Date(),
                updatedAt: new Date()
            },
            include: {
                unitStandard: {
                    include: {
                        module: true
                    }
                },
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        // If assessment is COMPETENT, trigger progress update
        if (result === 'COMPETENT') {
            await updateProgressFromAssessment(id);
        }

        return NextResponse.json({
            success: true,
            message: `Assessment marked as ${result}`,
            assessment: {
                id: assessment.id,
                result: assessment.result,
                unitStandard: {
                    code: assessment.unitStandard.code,
                    title: assessment.unitStandard.title
                },
                module: {
                    name: assessment.unitStandard.module.name
                },
                student: assessment.student
            }
        });

    } catch (error) {
        console.error('Error completing assessment:', error);
        return NextResponse.json(
            { error: 'Failed to complete assessment' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/assessments/[id]
 * Get assessment details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const assessment = await prisma.assessment.findUnique({
            where: { id },
            include: {
                unitStandard: {
                    include: {
                        module: true
                    }
                },
                student: {
                    select: {
                        id: true,
                        studentId: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        if (!assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ assessment });

    } catch (error) {
        console.error('Error fetching assessment:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assessment' },
            { status: 500 }
        );
    }
}
