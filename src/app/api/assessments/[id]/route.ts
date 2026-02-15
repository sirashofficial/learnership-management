import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

// GET /api/assessments/[id]
export async function GET(
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
export async function PUT(
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

        const assessment = await prisma.assessment.update({
            where: { id: params.id },
            data: update,
            include: {
                student: { include: { group: true } },
                unitStandard: {
                    include: { module: true },
                },
            },
        });

        // Update student progress when marked competent
        if (result === 'COMPETENT' && assessment.unitStandardId) {
            await updateStudentProgress(assessment.studentId, assessment.unitStandardId);
        }

        // If reset from COMPETENT, recalculate student progress
        if ((result === 'PENDING' || result === null) && assessment.unitStandardId) {
            await updateStudentProgress(assessment.studentId, assessment.unitStandardId);
        }

        return successResponse(assessment, 'Assessment updated successfully');
    } catch (error) {
        console.error('Assessment update error:', error);
        return handleApiError(error);
    }
}

// PATCH /api/assessments/[id] — Same as PUT for flexibility
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return PUT(request, { params });
}

// DELETE /api/assessments/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.assessment.delete({
            where: { id: params.id },
        });

        return successResponse(null, 'Assessment deleted successfully');
    } catch (error) {
        return handleApiError(error);
    }
}

// Helper: recalculate student progress from actual assessment data
async function updateStudentProgress(studentId: string, unitStandardId?: string | null) {
    try {
        // Mark unit standard progress
        if (unitStandardId) {
            const isCompetent = await prisma.assessment.findFirst({
                where: {
                    studentId,
                    unitStandardId,
                    result: 'COMPETENT',
                },
            });

            if (isCompetent) {
                await prisma.unitStandardProgress.upsert({
                    where: {
                        studentId_unitStandardId: { studentId, unitStandardId },
                    },
                    create: {
                        studentId,
                        unitStandardId,
                        status: 'COMPLETED',
                        completionDate: new Date(),
                        summativePassed: true,
                    },
                    update: {
                        status: 'COMPLETED',
                        completionDate: new Date(),
                        summativePassed: true,
                    },
                });
            } else {
                // Reset unit standard progress if no longer competent
                await prisma.unitStandardProgress.upsert({
                    where: {
                        studentId_unitStandardId: { studentId, unitStandardId },
                    },
                    create: {
                        studentId,
                        unitStandardId,
                        status: 'IN_PROGRESS',
                        summativePassed: false,
                    },
                    update: {
                        status: 'IN_PROGRESS',
                        completionDate: null,
                        summativePassed: false,
                    },
                });
            }
        }

        // Recalculate total credits from all competent assessments
        const competentAssessments = await prisma.assessment.findMany({
            where: {
                studentId,
                result: 'COMPETENT',
            },
            include: { unitStandard: true },
        });

        const uniqueUnitStandards = new Set<string>();
        let totalCreditsEarned = 0;

        for (const assessment of competentAssessments) {
            if (assessment.unitStandard && !uniqueUnitStandards.has(assessment.unitStandardId!)) {
                uniqueUnitStandards.add(assessment.unitStandardId!);
                totalCreditsEarned += assessment.unitStandard.credits || 0;
            }
        }

        const totalCreditsRequired = 138;
        const progressPercentage = Math.round((totalCreditsEarned / totalCreditsRequired) * 100);

        await prisma.student.update({
            where: { id: studentId },
            data: {
                totalCreditsEarned,
                progress: progressPercentage,
            },
        });
    } catch (error) {
        console.error('Error in updateStudentProgress:', error);
    }
}
