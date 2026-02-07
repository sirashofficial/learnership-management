import { Student } from '@/hooks/useStudents';

export type AlertType = 'STALLED' | 'AT_RISK' | 'BEHIND_SCHEDULE' | 'NONE';

export interface StudentAlert {
    type: AlertType;
    severity: 'low' | 'medium' | 'high';
    message: string;
    daysStalled?: number;
}

/**
 * Calculate expected credits based on time elapsed since enrollment
 * Assumes linear progression: 138 credits over 12 months = ~11.5 credits/month
 */
function getExpectedCredits(enrollmentDate: Date): number {
    const now = new Date();
    const monthsElapsed = (now.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const expectedCredits = Math.floor(monthsElapsed * 11.5); // 138 credits / 12 months
    return Math.min(expectedCredits, 138); // Cap at total credits
}

/**
 * Detect if a student has stalled (no progress in 30+ days)
 */
export function detectStalledProgress(student: Student, lastAssessmentDate?: Date): StudentAlert | null {
    if (!lastAssessmentDate) {
        // No assessments recorded yet
        const enrollmentDate = new Date(student.createdAt);
        const daysSinceEnrollment = Math.floor((Date.now() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceEnrollment > 30) {
            return {
                type: 'STALLED',
                severity: 'high',
                message: `No assessments completed in ${daysSinceEnrollment} days`,
                daysStalled: daysSinceEnrollment
            };
        }
    } else {
        const daysSinceLastAssessment = Math.floor((Date.now() - lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceLastAssessment > 60) {
            return {
                type: 'STALLED',
                severity: 'high',
                message: `No progress in ${daysSinceLastAssessment} days`,
                daysStalled: daysSinceLastAssessment
            };
        } else if (daysSinceLastAssessment > 30) {
            return {
                type: 'STALLED',
                severity: 'medium',
                message: `No progress in ${daysSinceLastAssessment} days`,
                daysStalled: daysSinceLastAssessment
            };
        }
    }

    return null;
}

/**
 * Detect if a student is behind expected progress
 */
export function detectAtRiskProgress(student: Student): StudentAlert | null {
    const enrollmentDate = new Date(student.createdAt);
    const expectedCredits = getExpectedCredits(enrollmentDate);
    const actualCredits = student.totalCreditsEarned || 0;

    // Only flag if enrolled for at least 2 months
    const monthsElapsed = (Date.now() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsElapsed < 2) {
        return null;
    }

    const creditGap = expectedCredits - actualCredits;

    if (creditGap > 20) {
        return {
            type: 'AT_RISK',
            severity: 'high',
            message: `${creditGap} credits behind schedule`
        };
    } else if (creditGap > 10) {
        return {
            type: 'AT_RISK',
            severity: 'medium',
            message: `${creditGap} credits behind schedule`
        };
    }

    return null;
}

/**
 * Get the most severe alert for a student
 */
export function getStudentAlert(student: Student, lastAssessmentDate?: Date): StudentAlert {
    // Check for stalled progress first (highest priority)
    const stalledAlert = detectStalledProgress(student, lastAssessmentDate);
    if (stalledAlert) {
        return stalledAlert;
    }

    // Check for at-risk status
    const atRiskAlert = detectAtRiskProgress(student);
    if (atRiskAlert) {
        return atRiskAlert;
    }

    // No alerts
    return {
        type: 'NONE',
        severity: 'low',
        message: 'On track'
    };
}

/**
 * Get alert badge color based on severity
 */
export function getAlertColor(severity: 'low' | 'medium' | 'high'): string {
    switch (severity) {
        case 'high':
            return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
        case 'medium':
            return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
        case 'low':
        default:
            return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    }
}
