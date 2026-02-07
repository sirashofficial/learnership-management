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

// GET /api/students/[id]/progress - Get student's module progress
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const studentId = params.id;

        // Get student with current module
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                currentModule: true
            }
        });

        if (!student) {
            return errorResponse('Student not found', 404);
        }

        // Get all module progress for this student
        const moduleProgress = await prisma.moduleProgress.findMany({
            where: { studentId },
            include: {
                module: {
                    include: {
                        unitStandards: true
                    }
                }
            },
            orderBy: {
                module: {
                    moduleNumber: 'asc'
                }
            }
        });

        // Get unit standard progress
        const unitStandardProgress = await prisma.unitStandardProgress.findMany({
            where: { studentId },
            include: {
                unitStandard: {
                    include: {
                        module: true
                    }
                }
            }
        });

        // Calculate overall statistics
        const totalCredits = 138; // NVC Level 2 total
        const creditsEarned = student.totalCreditsEarned;
        const overallProgress = Math.round((creditsEarned / totalCredits) * 100);

        // Calculate module-specific statistics
        const moduleStats = moduleProgress.map(mp => {
            const moduleCredits = mp.module.credits;
            const modulePercentage = Math.round((mp.creditsEarned / moduleCredits) * 100);

            return {
                moduleId: mp.moduleId,
                moduleName: mp.module.name,
                moduleNumber: mp.module.moduleNumber,
                status: mp.status,
                creditsEarned: mp.creditsEarned,
                totalCredits: moduleCredits,
                percentage: modulePercentage,
                startDate: mp.startDate,
                completionDate: mp.completionDate
            };
        });

        return successResponse({
            student: {
                id: student.id,
                name: `${student.firstName} ${student.lastName}`,
                totalCreditsEarned: creditsEarned,
                totalCreditsRequired: totalCredits,
                overallProgress,
                currentModule: student.currentModule
            },
            moduleProgress: moduleStats,
            unitStandardProgress
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/students/[id]/progress - Update student's module progress
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const studentId = params.id;
        const body = await request.json();
        const { moduleId, action } = body;

        if (!moduleId || !action) {
            return errorResponse('moduleId and action are required');
        }

        const student = await prisma.student.findUnique({
            where: { id: studentId }
        });

        if (!student) {
            return errorResponse('Student not found', 404);
        }

        const module = await prisma.module.findUnique({
            where: { id: moduleId },
            include: { unitStandards: true }
        });

        if (!module) {
            return errorResponse('Module not found', 404);
        }

        let updatedProgress;

        switch (action) {
            case 'START':
                // Start a module
                updatedProgress = await prisma.moduleProgress.upsert({
                    where: {
                        studentId_moduleId: {
                            studentId,
                            moduleId
                        }
                    },
                    create: {
                        studentId,
                        moduleId,
                        status: 'IN_PROGRESS',
                        startDate: new Date()
                    },
                    update: {
                        status: 'IN_PROGRESS',
                        startDate: new Date()
                    }
                });

                // Update student's current module
                await prisma.student.update({
                    where: { id: studentId },
                    data: { currentModuleId: moduleId }
                });
                break;

            case 'COMPLETE':
                // Complete a module
                updatedProgress = await prisma.moduleProgress.update({
                    where: {
                        studentId_moduleId: {
                            studentId,
                            moduleId
                        }
                    },
                    data: {
                        status: 'COMPLETED',
                        completionDate: new Date(),
                        progress: 100
                    }
                });
                break;

            case 'CALCULATE_PROGRESS':
                // Manually recalculate progress for a student
                const { recalculateAllProgress } = await import('@/lib/progress-calculator');
                const progressSummary = await recalculateAllProgress(studentId);

                return successResponse({
                    message: 'Progress recalculated successfully',
                    summary: progressSummary
                });

            default:
                return errorResponse('Invalid action. Use START, COMPLETE, or CALCULATE_PROGRESS');
        }

        return successResponse({
            message: 'Progress updated successfully',
            progress: updatedProgress
        });
    } catch (error) {
        return handleApiError(error);
    }
}
