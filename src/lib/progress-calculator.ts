/**
 * Progress Calculator Utility
 * 
 * Centralized logic for calculating student progress based on assessments and module completion.
 * This ensures consistent progress calculation across the application.
 */

import { PrismaClient } from '@prisma/client';

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
    const totalCreditsRequired = 137; // NVC Level 2 total

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
