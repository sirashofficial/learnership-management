import { addDays, isWeekend, nextDay, startOfDay } from 'date-fns';

/**
 * SSETA NVC Level 2 Rollout Formula:
 * 1 Credit = 10 Notional Hours
 * 1 Work Day = 8 Hours
 * => 1 Credit = 1.25 Working Days
 */
export const DAYS_PER_CREDIT = 1.25;

export interface ModuleRollout {
    moduleNumber: number;
    name: string;
    credits: number;
    startDate: Date;
    endDate: Date;
}

/**
 * Calculates working days by skipping weekends
 */
export function addWorkingDays(startDate: Date, days: number): Date {
    let result = new Date(startDate);
    let daysAdded = 0;

    while (daysAdded < days) {
        result = addDays(result, 1);
        if (!isWeekend(result)) {
            daysAdded++;
        }
    }

    return result;
}

/**
 * Generates a full rollout plan based on a start date
 * Follows the 6-module structure of SSETA NVC Level 2
 */
export function calculateRolloutPlan(startDate: Date) {
    const modules = [
        { number: 1, name: 'Numeracy', credits: 16 },
        { number: 2, name: 'Communication Skills', credits: 24 },
        { number: 3, name: 'Market Requirements', credits: 22 },
        { number: 4, name: 'Sector & Industry', credits: 26 },
        { number: 5, name: 'Financial Management', credits: 23 },
        { number: 6, name: 'Business Operations', credits: 26 },
    ];

    let currentStart = startOfDay(startDate);
    // Ensure we start on a weekday
    if (isWeekend(currentStart)) {
        currentStart = nextDay(currentStart, 1); // Move to next Monday
    }

    const plannedRollout: ModuleRollout[] = [];

    for (const mod of modules) {
        const workingDays = Math.ceil(mod.credits * DAYS_PER_CREDIT);
        // End date is currentStart + (workingDays - 1) because the start day counts as day 1
        const currentEnd = addWorkingDays(currentStart, workingDays - 1);

        plannedRollout.push({
            moduleNumber: mod.number,
            name: mod.name,
            credits: mod.credits,
            startDate: new Date(currentStart),
            endDate: new Date(currentEnd),
        });

        // Next module starts the next working day after currentEnd
        currentStart = addWorkingDays(currentEnd, 1);
    }

    return plannedRollout;
}
