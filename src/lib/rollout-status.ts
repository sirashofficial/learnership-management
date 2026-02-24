import { differenceInDays, isAfter, isBefore } from 'date-fns';

/**
 * Compute RolloutPlan status based on dates (no stored field)
 * Status values: NOT_STARTED | IN_PROGRESS | BEHIND | COMPLETED | AT_RISK
 */
export function computeRolloutPlanStatus(
  projectedStartDate: Date,
  projectedEndDate: Date,
  actualStartDate: Date | null | undefined,
  actualEndDate: Date | null | undefined
): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. If actual end date is set, plan is COMPLETED
  if (actualEndDate) {
    return 'COMPLETED';
  }

  // 2. If actual start date is set, plan is IN_PROGRESS (unless we're past projected end)
  if (actualStartDate) {
    const actualStart = new Date(actualStartDate);
    actualStart.setHours(0, 0, 0, 0);

    // Calculate progress based on elapsed time
    const daysElapsed = differenceInDays(today, actualStart);
    const projEnd = new Date(projectedEndDate);
    projEnd.setHours(0, 0, 0, 0);
    const totalDays = differenceInDays(projEnd, new Date(projectedStartDate).setHours(0, 0, 0, 0));

    // If past projected end date without completion, mark as AT_RISK
    if (isAfter(today, projEnd)) {
      return 'AT_RISK';
    }

    // Otherwise in progress
    return 'IN_PROGRESS';
  }

  // 3. If today is before projected start, NOT_STARTED
  const projStart = new Date(projectedStartDate);
  projStart.setHours(0, 0, 0, 0);
  if (isBefore(today, projStart)) {
    return 'NOT_STARTED';
  }

  // 4. If today is between projected start and end, IN_PROGRESS
  const projEnd = new Date(projectedEndDate);
  projEnd.setHours(0, 0, 0, 0);
  if (isAfter(today, projEnd)) {
    // Past projected end date but no actual dates set = BEHIND
    return 'BEHIND';
  }

  // Default: in progress
  return 'IN_PROGRESS';
}

/**
 * Enriches a RolloutPlan with computed status
 */
export function enrichRolloutPlanWithStatus(plan: any): any {
  const computedStatus = computeRolloutPlanStatus(
    plan.projectedStartDate,
    plan.projectedEndDate,
    plan.actualStartDate,
    plan.actualEndDate
  );

  // Return without status field, add computed status
  const { status, ...rest } = plan;
  return {
    ...rest,
    computedStatus,
    varianceDays:
      plan.projectedEndDate && plan.actualEndDate
        ? differenceInDays(plan.actualEndDate, plan.projectedEndDate)
        : null,
  };
}

/**
 * Enriches multiple RolloutPlans with computed status
 */
export function enrichRolloutPlansWithStatus(plans: any[]): any[] {
  return plans.map(enrichRolloutPlanWithStatus);
}
