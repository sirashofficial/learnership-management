/**
 * Consolidated Group Metrics Calculations
 * DELEGATES TO: src/lib/calculations/unifiedMetrics.ts
 * Single source of truth for all group-related calculations
 * Used by: Dashboard, Groups page, Validation page, All APIs
 * 
 * This module maintains backward compatibility by re-exporting
 * unified calculation functions. All actual calculation logic
 * lives in the unified metrics engine to prevent inconsistencies.
 */

import prisma from '@/lib/prisma';
import { TOTAL_CREDITS } from '@/lib/constants';
import {
  calculateGroupMetrics as unifiedCalculateGroupMetrics,
  calculateMultipleGroupMetrics as unifiedCalculateMultipleGroupMetrics,
  UnifiedGroupMetrics,
  validateGroupMetrics,
} from '@/lib/calculations/unifiedMetrics';

/**
 * BACKWARD COMPATIBLE: GroupMetrics interface
 * Maps to UnifiedGroupMetrics to maintain existing code
 */
export interface GroupMetrics extends UnifiedGroupMetrics {}

export interface GroupProgress {
  studentId: string;
  unitStandardId: string;
  credits: number;
}

/**
 * BACKWARD COMPATIBLE: Re-export unified calculateGroupMetrics
 * This is the ONLY place we calculate credits - in the unified engine
 * Used everywhere: API endpoints, pages, validations
 */
export async function calculateGroupMetrics(
  groupId: string,
  totalCreditsRequired: number = TOTAL_CREDITS
): Promise<GroupMetrics> {
  return unifiedCalculateGroupMetrics(groupId, totalCreditsRequired) as Promise<GroupMetrics>;
}

/**
 * BACKWARD COMPATIBLE: Calculate metrics for multiple groups in parallel
 * DELEGATES TO: unifiedCalculateMultipleGroupMetrics
 */
export async function calculateMultipleGroupMetrics(
  groupIds: string[],
  totalCreditsRequired: number = TOTAL_CREDITS
): Promise<Map<string, GroupMetrics>> {
  const unifiedResults = await unifiedCalculateMultipleGroupMetrics(groupIds, totalCreditsRequired);
  
  // Convert UnifiedGroupMetrics to GroupMetrics (they're compatible)
  const results = new Map<string, GroupMetrics>();
  for (const [groupId, metrics] of unifiedResults) {
    results.set(groupId, metrics as GroupMetrics);
  }
  return results;
}

/**
 * UNIFIED: Get all group progress data (assessments)
 * Returns only COMPETENT assessments per group
 */
export async function getGroupProgress(groupId: string): Promise<GroupProgress[]> {
  try {
    const assessments = await prisma.assessment.findMany({
      where: {
        result: 'COMPETENT',
        student: {
          groupId: groupId,
        },
      },
      select: {
        studentId: true,
        unitStandardId: true,
        unitStandard: {
          select: { credits: true }
        },
      },
    });

    return assessments
      .filter(a => a.unitStandardId)
      .map(a => ({
        studentId: a.studentId,
        unitStandardId: a.unitStandardId!,
        credits: a.unitStandard?.credits || 0,
      }));
  } catch (error) {
    console.error(`Error getting progress for group ${groupId}:`, error);
    return [];
  }
}

/**
 * UNIFIED: Get group health status
 * Determines if group is on track, behind, ahead, etc.
 */
export function getGroupHealthStatus(metrics: GroupMetrics): 'ON_TRACK' | 'BEHIND' | 'AHEAD' | 'AT_RISK' | 'NO_DATA' {
  if (metrics.studentCount === 0) {
    return 'NO_DATA';
  }

  const progressPercent = metrics.avgProgressPercent;

  // Align with Dashboard/Groups logic: AHEAD is a specialization of ON_TRACK
  if (progressPercent >= 80) {
    return 'AHEAD';
  } else if (progressPercent >= 50) {
    return 'ON_TRACK';
  } else if (progressPercent >= 25) {
    return 'BEHIND';
  } else {
    // Very low progress is At Risk
    return 'AT_RISK';
  }
}

/**
 * BACKWARD COMPATIBLE: Validate metrics consistency
 * DELEGATES TO: validateGroupMetrics from unified metrics
 * Used for auditing and data integrity checks
 */
export function validateMetrics(metrics: GroupMetrics): { valid: boolean; errors: string[] } {
  return validateGroupMetrics(metrics);
}

/**
 * UNIFIED: Calculate current assessment module (highest module with competent assessments)
 * OPTIMIZED: Uses Student.currentModuleId if available, falls back to calculation only if needed
 */
export async function getCurrentAssessmentModule(groupId: string): Promise<number> {
  try {
    // Try to use pre-calculated currentModuleId on Student model (more efficient)
    const studentWithHighestModule = await prisma.student.findFirst({
      where: { groupId },
      select: { currentModule: { select: { moduleNumber: true } } },
      orderBy: { currentModule: { moduleNumber: 'desc' } },
    });

    if (studentWithHighestModule?.currentModule?.moduleNumber) {
      return studentWithHighestModule.currentModule.moduleNumber;
    }

    // Fallback: Return 0 if no competent assessments found
    // SQLite doesn't support complex aggregates on related fields
    return 0;
  } catch (error) {
    console.error(`Error getting current assessment module for group ${groupId}:`, error);
    return 0;
  }
}

/**
 * UNIFIED: Format metrics for display
 */
export function formatMetrics(metrics: GroupMetrics): {
  displayText: string;
  percentageText: string;
} {
  return {
    displayText: `${metrics.avgCreditsPerStudent} of ${metrics.totalCreditsRequired} credits`,
    percentageText: `${metrics.avgProgressPercent}% complete`,
  };
}
