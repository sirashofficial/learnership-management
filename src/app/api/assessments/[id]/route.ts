import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { updateStudentProgressUnified } from '@/lib/progress-calculator';
import { withAuth, withRateLimit, enforceGroupAccess, getAuthContext } from '@/middleware/apiAuth';
import { softDelete } from '@/lib/softDelete';

// GET /api/assessments/[id]
async function handleGet(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const assessment = await prisma.assessment.findUnique({
            where: { id: params.id },
            include: {
                student: {
                    include: { group: true },
                },
                unitStandard: {
                    include: { module: true },
                },
            },
        });

        if (!assessment) {
            return errorResponse('Assessment not found', 404);
        }

        return successResponse(assessment);
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT /api/assessments/[id] — Update assessment result (supports 3-state: COMPETENT, NOT_YET_COMPETENT, PENDING/null)
async function handlePut(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { result, score, feedback, notes, assessedDate, moderationStatus } = body;

        const update: any = {};

        // Support resetting to PENDING (null/unmarked state)
        if (result !== undefined) {
            update.result = result || 'PENDING';
        }
        if (score !== undefined) update.score = score;
        if (feedback !== undefined) update.feedback = feedback;
        if (notes !== undefined) update.notes = notes;
        if (assessedDate) update.assessedDate = new Date(assessedDate);
        if (moderationStatus) update.moderationStatus = moderationStatus;

        // Set assessed date if marking (not resetting)
        if (result && result !== 'PENDING' && !assessedDate) {
            update.assessedDate = new Date();
        }

        // If resetting to PENDING, clear the assessed date
        if (result === 'PENDING' || result === null) {
            update.result = 'PENDING';
            update.assessedDate = null;
            update.moderationStatus = 'PENDING';
        }

        // Atomically update assessment and student progress
        const assessment = await prisma.$transaction(async (tx) => {
            const updatedAssessment = await tx.assessment.update({
                where: { id: params.id },
                data: update,
                include: {
                    student: { include: { group: true } },
                    unitStandard: {
                        include: { module: true },
                    },
                },
            });

            // Update student progress when marked competent (inside transaction)
            if (result === 'COMPETENT' && updatedAssessment.unitStandardId) {
                await updateStudentProgressUnified(tx, updatedAssessment.studentId, updatedAssessment.unitStandardId);
            }

            // If reset from COMPETENT, recalculate student progress
            if ((result === 'PENDING' || result === null) && updatedAssessment.unitStandardId) {
                await updateStudentProgressUnified(tx, updatedAssessment.studentId, updatedAssessment.unitStandardId);
            }

            return updatedAssessment;
        });

        return successResponse(assessment, 'Assessment updated successfully');
    } catch (error) {
        console.error('Assessment update error:', error);
        return handleApiError(error);
    }
}

// DELETE /api/assessments/[id]
async function handleDelete(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Soft delete the assessment
        await softDelete('assessment', params.id);

        return successResponse(null, 'Assessment archived successfully. Can be restored within 30 days.');
    } catch (error) {
        return handleApiError(error);
    }
}

export const GET = withAuth(
  withRateLimit(handleGet, 'moderate'),
  ['ADMIN', 'FACILITATOR']
);

export const PUT = withAuth(
  withRateLimit(handlePut, 'moderate'),
  ['ADMIN', 'FACILITATOR']
);

export const PATCH = withAuth(
  withRateLimit(handlePut, 'moderate'),
  ['ADMIN', 'FACILITATOR']
);

export const DELETE = withAuth(
  withRateLimit(handleDelete, 'strict'),
  ['ADMIN']
);
