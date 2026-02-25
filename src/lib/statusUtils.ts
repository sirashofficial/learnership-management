import { PlanStatus } from '@/types/rollout';

/**
 * Shared utility to determine the performance status of a group.
 * Unifies logic between Dashboard (previously attendance-only) and Groups (previously progress-only).
 */
export function calculatePerformanceStatus(
    projectedPercent: number,
    actualPercent: number,
    hasPlan: boolean,
    attendanceRate: number = 0,
    currentAssessmentModule: number = 0,
    expectedModule: number = 0,
    dateStatus: PlanStatus = 'ON_TRACK'
): PlanStatus {
    if (!hasPlan) return 'NO_PLAN';

    // Lifecycle boundaries
    if (dateStatus === 'NO_PLAN') return 'NO_PLAN';
    if (dateStatus === 'NOT_STARTED') return 'NOT_STARTED';

    // 1. OVERDUE: End date passed but progress < 100%
    if (dateStatus === 'COMPLETE') {
        if (actualPercent >= 100 || (currentAssessmentModule > 0 && currentAssessmentModule >= expectedModule && expectedModule > 0)) {
            return 'COMPLETE';
        }
        return 'OVERDUE';
    }

    // 2. Progress-based logic (Decoupled from Attendance)
    // If we have no assessment data yet, determine status by whether we should have started
    if (!currentAssessmentModule || currentAssessmentModule === 0) {
        if (expectedModule >= 2) return 'AT_RISK';
        if (expectedModule === 1) return 'BEHIND';
        return 'ON_TRACK';
    }

    const lag = expectedModule - currentAssessmentModule;
    const percentLag = projectedPercent - actualPercent;

    // 3. Status Thresholds (Combine Module Lag and Percentage Lag)
    // AT_RISK if behind by 2+ modules OR more than 15% behind
    if (lag >= 2 || percentLag >= 15) return 'AT_RISK';

    // BEHIND if behind by 1 module OR more than 5% behind
    if (lag >= 1 || percentLag >= 5) return 'BEHIND';

    return 'ON_TRACK';
}

/**
 * Normalizes status strings to proper PlanStatus type
 */
export function normalizeStatus(status: string): PlanStatus {
    const s = status?.toUpperCase();
    if (s === 'ON_TRACK' || s === 'ON TRACK') return 'ON_TRACK';
    if (s === 'BEHIND') return 'BEHIND';
    if (s === 'AT_RISK' || s === 'AT RISK') return 'AT_RISK';
    if (s === 'OVERDUE') return 'OVERDUE';
    if (s === 'COMPLETE' || s === 'COMPLETED') return 'COMPLETE';
    if (s === 'NOT_STARTED' || s === 'NOT STARTED') return 'NOT_STARTED';
    return 'NO_PLAN';
}
