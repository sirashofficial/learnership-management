/**
 * Shared progress calculation utility
 * Ensures consistent progress calculation across all pages
 * 
 * Handles:
 * 1. Projected progress (based on timeline dates)
 * 2. Actual progress (based on completed credits/units)
 * 3. Progress status comparison
 */

export interface Module {
  number: number;
  name: string;
  credits: number;
}

export interface ProgressCalculation {
  completedCredits: number;
  totalCredits: number;
  percentage: number;
}

export interface ProgressStatus {
  status: 'NO_PLAN' | 'NOT_STARTED' | 'ON_TRACK' | 'BEHIND' | 'AT_RISK' | 'COMPLETE';
  label: string;
  color: string;
}

/**
 * Standard curriculum for NVC Level 2
 * These credits are fixed per the qualification
 */
export const STANDARD_MODULES: Module[] = [
  { number: 1, name: 'Numeracy', credits: 16 },
  { number: 2, name: 'HIV/AIDS & Communications', credits: 24 },
  { number: 3, name: 'Market Requirements', credits: 22 },
  { number: 4, name: 'Business Sector & Industry', credits: 26 },
  { number: 5, name: 'Financial Requirements', credits: 26 },
  { number: 6, name: 'Business Operations', credits: 26 },
];

export const TOTAL_CREDITS = STANDARD_MODULES.reduce((sum, m) => sum + m.credits, 0); // 140

/**
 * Calculate projected progress based on timeline
 * Projected progress = (days elapsed) / (total duration) * 100
 * 
 * @param startDate When the group started
 * @param endDate When the group should finish
 * @param currentDate The date to calculate from
 * @returns Progress percentage (0-100)
 */
export function calculateProjectedProgress(
  startDate: Date | string,
  endDate: Date | string,
  currentDate: Date = new Date()
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date(currentDate);

  // Normalize to start of day
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  // Not yet started
  if (now < start) return 0;

  // Already completed
  if (now > end) return 100;

  // In progress
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();

  return Math.round((elapsed / totalDuration) * 100);
}

/**
 * Calculate actual progress based on completed credits
 * This compares what students have actually achieved vs what was required
 * 
 * @param completedCredits Credits students have earned so far
 * @param totalRequired Total credits required (default: 140 for NVC L2)
 * @returns Progress percentage (0-100)
 */
export function calculateActualProgress(
  completedCredits: number,
  totalRequired: number = TOTAL_CREDITS
): ProgressCalculation {
  const percentage = Math.round((completedCredits / totalRequired) * 100);
  return {
    completedCredits,
    totalCredits: totalRequired,
    percentage: Math.min(percentage, 100), // Cap at 100%
  };
}

/**
 * Determine status by comparing projected vs actual progress
 * 
 * Status rules:
 * - ON_TRACK: Actual >= Projected (on schedule or ahead)
 * - BEHIND: Actual < Projected but within 10% (slightly behind)
 * - AT_RISK: Actual < Projected by more than 10% (significantly behind)
 * - NOT_STARTED: Not yet started (Projected = 0 and Actual = 0)
 * - COMPLETE: Programme finished (Projected = 100 and Actual >= 80)
 * 
 * @param projectedPercent Expected progress based on timeline
 * @param actualPercent Actual achieved progress based on credits
 * @param hasPlan Whether a rollout plan exists
 * @returns Status object with label and color
 */
export function getProgressStatus(
  projectedPercent: number,
  actualPercent: number,
  hasPlan: boolean
): ProgressStatus {
  if (!hasPlan) {
    return { status: 'NO_PLAN', label: 'No Plan', color: 'slate' };
  }

  if (projectedPercent === 0 && actualPercent === 0) {
    return { status: 'NOT_STARTED', label: 'Not Started', color: 'slate' };
  }

  if (projectedPercent >= 100 && actualPercent >= 80) {
    return { status: 'COMPLETE', label: 'Complete', color: 'teal' };
  }

  if (actualPercent >= projectedPercent) {
    return { status: 'ON_TRACK', label: 'On Track', color: 'emerald' };
  }

  const gap = projectedPercent - actualPercent;
  if (gap <= 10) {
    return { status: 'BEHIND', label: 'Behind', color: 'amber' };
  }

  return { status: 'AT_RISK', label: 'At Risk', color: 'red' };
}

/**
 * Get module info by number
 */
export function getModuleInfo(moduleNumber: number): Module | undefined {
  return STANDARD_MODULES.find(m => m.number === moduleNumber);
}

/**
 * Get all module names and credits
 */
export function getAllModuleInfo(): Module[] {
  return [...STANDARD_MODULES];
}

/**
 * Format progress percentage for display
 */
export function formatProgressPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

/**
 * Calculate the gap between projected and actual progress
 * Negative means ahead of schedule, positive means behind
 */
export function calculateProgressGap(
  projectedPercent: number,
  actualPercent: number
): number {
  return projectedPercent - actualPercent;
}

/**
 * Check if a group needs intervention
 * At-risk if gap > 15% or if behind with only 3 weeks left
 */
export function needsIntervention(
  projectedPercent: number,
  actualPercent: number,
  daysRemaining?: number
): boolean {
  const gap = calculateProgressGap(projectedPercent, actualPercent);
  
  if (gap > 15) return true;
  if (gap > 5 && daysRemaining && daysRemaining < 21) return true;
  
  return false;
}
