/**
 * Progress Calculator Utility
 * 
 * Centralized logic for calculating student progress based on assessments and module completion.
 * This ensures consistent progress calculation across the application.
 */

import { PrismaClient } from '@prisma/client';
import { TOTAL_CREDITS } from './constants';

const prisma = new PrismaClient();

export interface ProgressSummary {
    totalCreditsEarned: number;
    totalCreditsRequired: number;
    overallProgress: number;
    currentModuleId: string | null;
    moduleProgress: ModuleProgressSummary[];
}

export interface ModuleProgressSummary {
    moduleId: string;
    moduleNumber: number;
    moduleName: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    creditsEarned: number;
    totalCredits: number;
    progress: number;
    unitStandardsCompleted: number;
    totalUnitStandards: number;
}

/**
 * Check if a unit standard is complete for a student
 * A unit standard is complete when all FORMATIVE assessments are COMPETENT
 */
export async function isUnitStandardComplete(
    studentId: string,
    unitStandardId: string
): Promise<boolean> {
    // Get all formative assessments for this unit standard
    const formativeAssessments = await prisma.assessment.findMany({
        where: {
            studentId,
            unitStandardId,
            type: 'FORMATIVE'
        },
        select: {
            result: true
        }
    });

    // If no formative assessments exist, unit standard is not complete
    if (formativeAssessments.length === 0) {
        return false;
    }

    // All formative assessments must be COMPETENT
    return formativeAssessments.every(a => a.result === 'COMPETENT');
}

/**
 * Calculate credits earned for a specific module
 * Credits are earned when unit standards are completed
 */
export async function calculateModuleCredits(
    studentId: string,
    moduleId: string
): Promise<number> {
    // Get all unit standards for this module
    const unitStandards = await prisma.unitStandard.findMany({
        where: { moduleId },
        select: {
            id: true,
            credits: true
        }
    });

    let creditsEarned = 0;

    // Check each unit standard
    for (const unitStandard of unitStandards) {
        const isComplete = await isUnitStandardComplete(studentId, unitStandard.id);
        if (isComplete) {
            creditsEarned += unitStandard.credits;
        }
    }

    return creditsEarned;
}

/**
 * Calculate overall student progress across all modules
 */
export async function calculateStudentProgress(
    studentId: string
): Promise<ProgressSummary> {
    const totalCreditsRequired = TOTAL_CREDITS;

    // Get all modules
    const modules = await prisma.module.findMany({
        orderBy: { moduleNumber: 'asc' },
        include: {
            unitStandards: true
        }
    });

    // Get student's module progress records
    const moduleProgressRecords = await prisma.moduleProgress.findMany({
        where: { studentId }
    });

    const moduleProgress: ModuleProgressSummary[] = [];
    let totalCreditsEarned = 0;

    for (const module of modules) {
        const progressRecord = moduleProgressRecords.find(mp => mp.moduleId === module.id);

        // Calculate credits earned for this module
        const creditsEarned = await calculateModuleCredits(studentId, module.id);
        totalCreditsEarned += creditsEarned;

        // Count completed unit standards
        let unitStandardsCompleted = 0;
        for (const unitStandard of module.unitStandards) {
            const isComplete = await isUnitStandardComplete(studentId, unitStandard.id);
            if (isComplete) {
                unitStandardsCompleted++;
            }
        }

        // Determine status
        let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
        if (progressRecord) {
            status = progressRecord.status as any;
        } else if (creditsEarned > 0) {
            status = 'IN_PROGRESS';
        }

        // Calculate progress percentage
        const progress = module.credits > 0
            ? Math.round((creditsEarned / module.credits) * 100)
            : 0;

        moduleProgress.push({
            moduleId: module.id,
            moduleNumber: module.moduleNumber,
            moduleName: module.name,
            status,
            creditsEarned,
            totalCredits: module.credits,
            progress,
            unitStandardsCompleted,
            totalUnitStandards: module.unitStandards.length
        });
    }

    const overallProgress = Math.round((totalCreditsEarned / totalCreditsRequired) * 100);

    // Get current module
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { currentModuleId: true }
    });

    return {
        totalCreditsEarned,
        totalCreditsRequired,
        overallProgress,
        currentModuleId: student?.currentModuleId || null,
        moduleProgress
    };
}

/**
 * Update student progress when an assessment is marked competent
 * This is the main function that triggers automatic progress recalculation
 */
export async function updateProgressFromAssessment(
    assessmentId: string
): Promise<void> {
    // Get the assessment with related data
    const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: {
            unitStandard: {
                include: {
                    module: true
                }
            }
        }
    });

    if (!assessment || assessment.result !== 'COMPETENT') {
        return; // Only process competent assessments
    }

    const { studentId, unitStandard } = assessment;
    const moduleId = unitStandard.moduleId;

    // Check if unit standard is now complete
    const isComplete = await isUnitStandardComplete(studentId, unitStandard.id);

    // Update or create UnitStandardProgress
    await prisma.unitStandardProgress.upsert({
        where: {
            studentId_unitStandardId: {
                studentId,
                unitStandardId: unitStandard.id
            }
        },
        update: {
            status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
            updatedAt: new Date()
        },
        create: {
            studentId,
            unitStandardId: unitStandard.id,
            status: isComplete ? 'COMPLETED' : 'IN_PROGRESS'
        }
    });

    // Recalculate module credits
    const moduleCredits = await calculateModuleCredits(studentId, moduleId);

    // Update ModuleProgress
    const moduleProgress = await prisma.moduleProgress.findFirst({
        where: { studentId, moduleId }
    });

    if (moduleProgress) {
        await prisma.moduleProgress.update({
            where: { id: moduleProgress.id },
            data: {
                creditsEarned: moduleCredits,
                progress: Math.round((moduleCredits / unitStandard.module.credits) * 100),
                updatedAt: new Date()
            }
        });
    }

    // Recalculate total student credits
    const progressSummary = await calculateStudentProgress(studentId);

    // Update student record
    await prisma.student.update({
        where: { id: studentId },
        data: {
            totalCreditsEarned: progressSummary.totalCreditsEarned,
            progress: progressSummary.overallProgress,
            updatedAt: new Date()
        }
    });
}

/**
 * UNIFIED Progress Update Function for All Contexts
 * 
 * This is the SINGLE SOURCE OF TRUTH for updating student progress.
 * Used by all assessment endpoints (route.ts, [id]/route.ts, bulk/route.ts)
 * 
 * @param tx Prisma client - can be main prisma instance OR transaction client
 * @param studentId Student to update
 * @param unitStandardId Optional - specific unit standard that was assessed
 * 
 * Handles:
 * 1. Mark unit standard as COMPLETED if assessment was competent
 * 2. Recalculate all competent assessments (dedup by unit standard)
 * 3. Update Student.totalCreditsEarned and Student.progress
 * 4. For each affected module: recalculate and upsert ModuleProgress
 */
export async function updateStudentProgressUnified(
    tx: any,  // Prisma client or transaction
    studentId: string,
    unitStandardId?: string | null
): Promise<void> {
    try {
        // 1. Mark Unit Standard as COMPLETED if specified
        if (unitStandardId) {
            await tx.unitStandardProgress.upsert({
                where: {
                    studentId_unitStandardId: {
                        studentId,
                        unitStandardId
                    }
                },
                create: {
                    studentId,
                    unitStandardId,
                    status: 'COMPLETED',
                    completionDate: new Date(),
                    summativePassed: true
                },
                update: {
                    status: 'COMPLETED',
                    completionDate: new Date(),
                    summativePassed: true
                }
            });
        }

        // 2. Get all competent assessments for this student
        const approvedAssessments = await tx.assessment.findMany({
            where: {
                studentId,
                result: 'COMPETENT',
            },
            include: {
                unitStandard: true
            }
        });

        // 3. Calculate total credits earned (deduplicate by unit standard)
        const uniqueUnitStandards = new Set<string>();
        let totalCreditsEarned = 0;

        for (const assessment of approvedAssessments) {
            if (assessment.unitStandard && !uniqueUnitStandards.has(assessment.unitStandardId!)) {
                uniqueUnitStandards.add(assessment.unitStandardId!);
                totalCreditsEarned += assessment.unitStandard.credits || 0;
            }
        }

        // 4. Update student record
        const totalCreditsRequired = TOTAL_CREDITS;
        const progressPercentage = Math.round((totalCreditsEarned / totalCreditsRequired) * 100);

        await tx.student.update({
            where: { id: studentId },
            data: {
                totalCreditsEarned,
                progress: progressPercentage
            }
        });

        // 5. Update Module Progress for affected modules
        const affectedModuleIds = new Set<string>();
        for (const assessment of approvedAssessments) {
            if (assessment.unitStandard) {
                affectedModuleIds.add(assessment.unitStandard.moduleId);
            }
        }

        for (const moduleId of affectedModuleIds) {
            const module = await tx.module.findUnique({
                where: { id: moduleId },
                include: { unitStandards: true }
            });

            if (!module) continue;

            // Calculate credits for this module
            let moduleCreditsEarned = 0;
            let completedCount = 0;

            for (const us of module.unitStandards) {
                if (uniqueUnitStandards.has(us.id)) {
                    moduleCreditsEarned += us.credits;
                    completedCount++;
                }
            }

            const modulePercentage = Math.round((moduleCreditsEarned / module.credits) * 100);
            const isCompleted = completedCount === module.unitStandards.length;

            await tx.moduleProgress.upsert({
                where: {
                    studentId_moduleId: {
                        studentId,
                        moduleId
                    }
                },
                create: {
                    studentId,
                    moduleId,
                    creditsEarned: moduleCreditsEarned,
                    progress: modulePercentage,
                    status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
                    startDate: new Date(),
                    completionDate: isCompleted ? new Date() : null
                },
                update: {
                    creditsEarned: moduleCreditsEarned,
                    progress: modulePercentage,
                    status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
                    completionDate: isCompleted ? new Date() : null
                }
            });
        }
    } catch (error) {
        console.error('Error in updateStudentProgressUnified:', error);
        throw error;
    }
}

/**
 * Wrapper for non-transaction contexts
 * Used by endpoints that don't need transactional atomicity
 */
export async function updateStudentProgress(
    studentId: string,
    unitStandardId?: string | null
): Promise<void> {
    return updateStudentProgressUnified(prisma, studentId, unitStandardId);
}

/**
 * Manually recalculate all progress for a student
 * Useful for fixing inconsistencies or after bulk operations
 */
export async function recalculateAllProgress(studentId: string): Promise<ProgressSummary> {
    const progressSummary = await calculateStudentProgress(studentId);

    // Update student record
    await prisma.student.update({
        where: { id: studentId },
        data: {
            totalCreditsEarned: progressSummary.totalCreditsEarned,
            progress: progressSummary.overallProgress,
            updatedAt: new Date()
        }
    });

    // Update all module progress records
    for (const moduleProgress of progressSummary.moduleProgress) {
        await prisma.moduleProgress.upsert({
            where: {
                studentId_moduleId: {
                    studentId,
                    moduleId: moduleProgress.moduleId
                }
            },
            update: {
                creditsEarned: moduleProgress.creditsEarned,
                progress: moduleProgress.progress,
                status: moduleProgress.status,
                updatedAt: new Date()
            },
            create: {
                studentId,
                moduleId: moduleProgress.moduleId,
                status: moduleProgress.status,
                progress: moduleProgress.progress,
                creditsEarned: moduleProgress.creditsEarned
            }
        });
    }

    return progressSummary;
}
