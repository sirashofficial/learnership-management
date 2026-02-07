import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { updateProgressFromAssessment } from '@/lib/progress-calculator';

/**
 * PUT /api/assessments/bulk-update
 * Update multiple assessments at once (mark as complete)
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { assessmentIds, result, assessedDate } = body;

        if (!assessmentIds || !Array.isArray(assessmentIds) || assessmentIds.length === 0) {
            return NextResponse.json(
                { error: 'assessmentIds array is required' },
                { status: 400 }
            );
        }

        if (!result || !['COMPETENT', 'NOT_YET_COMPETENT', 'PENDING'].includes(result)) {
            return NextResponse.json(
                { error: 'Valid result is required (COMPETENT, NOT_YET_COMPETENT, or PENDING)' },
                { status: 400 }
            );
        }

        const updateDate = assessedDate ? new Date(assessedDate) : new Date();

        // Update all assessments
        const updateResult = await prisma.assessment.updateMany({
            where: {
                id: { in: assessmentIds }
            },
            data: {
                result,
                assessedDate: result !== 'PENDING' ? updateDate : null,
                updatedAt: new Date()
            }
        });

        // If marking as COMPETENT, trigger progress updates for each assessment
        if (result === 'COMPETENT') {
            const progressUpdates = assessmentIds.map(id =>
                updateProgressFromAssessment(id).catch(err => {
                    console.error(`Failed to update progress for assessment ${id}:`, err);
                    return null;
                })
            );

            await Promise.all(progressUpdates);
        }

        return NextResponse.json({
            success: true,
            message: `Updated ${updateResult.count} assessments`,
            updated: updateResult.count,
            result
        });

    } catch (error) {
        console.error('Error bulk updating assessments:', error);
        return NextResponse.json(
            { error: 'Failed to update assessments', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
