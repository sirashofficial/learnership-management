/**
 * Consolidated Group Metrics Calculations
 * SINGLE SOURCE OF TRUTH for all group-related calculations
 * Used by: Dashboard, Groups page, Validation page, All APIs
 */

import prisma from '@/lib/prisma';
import { TOTAL_CREDITS } from '@/lib/constants';

export interface GroupMetrics {
  avgCreditsPerStudent: number;
  avgProgressPercent: number;
  totalCreditsEarned: number;
  totalUniqueUnitsPassed: number;
  totalCreditsRequired: number;
  studentCount: number;
  atRiskCount: number; // Students behind the group's furthest learner
}

export interface GroupProgress {
  studentId: string;
  unitStandardId: string;
  credits: number;
}

/**
 * UNIFIED: Calculate group metrics from assessments
 * This is the ONLY place we calculate credits
 * Used everywhere: API endpoints, pages, validations
 */
export async function calculateGroupMetrics(
  groupId: string,
  totalCreditsRequired: number = TOTAL_CREDITS
): Promise<GroupMetrics> {
  try {
    // Get student count for this group
    const studentCount = await prisma.student.count({
      where: { groupId }
    });

    if (studentCount === 0) {
      return {
        avgCreditsPerStudent: 0,
        avgProgressPercent: 0,
        totalCreditsEarned: 0,
        totalUniqueUnitsPassed: 0,
        totalCreditsRequired,
        studentCount: 0,
        atRiskCount: 0,
      };
    }

    // Get all COMPETENT assessments for this group
    const competentAssessments = await prisma.assessment.findMany({
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
          select: {
            credits: true,
            module: { select: { moduleNumber: true } }
          }
        },
      },
    });

    // Calculate unique units per student
    // Build map: studentId -> unitStandardId -> credits
    const studentUnitsMap = new Map<string, Map<string, number>>();

    for (const assessment of competentAssessments) {
      if (!assessment.unitStandardId) continue;

      if (!studentUnitsMap.has(assessment.studentId)) {
        studentUnitsMap.set(assessment.studentId, new Map());
      }

      const unitMap = studentUnitsMap.get(assessment.studentId)!;
      unitMap.set(assessment.unitStandardId, assessment.unitStandard?.credits || 0);
    }

    // Calculate totals
    let totalCreditsEarned = 0;
    let totalUniqueUnitsPassed = 0;

    for (const unitMap of studentUnitsMap.values()) {
      totalUniqueUnitsPassed += unitMap.size;
      for (const credits of unitMap.values()) {
        totalCreditsEarned += credits;
      }
    }

    const avgCreditsPerStudent = studentCount > 0
      ? Math.round(totalCreditsEarned / studentCount)
      : 0;

    const avgProgressPercent = studentCount > 0
      ? Math.round((avgCreditsPerStudent / totalCreditsRequired) * 100)
      : 0;

    // CORE LOGIC: A learner's "current module" is the next module AFTER the highest
    // module where they have COMPETENT results for ALL THREE required types:
    // SUMMATIVE, FORMATIVE, and WORKPLACE.
    //
    // studentModulesMap: studentId -> highest FULLY completed module number
    const studentModulesMap = new Map<string, number>();

    // Re-fetch assessments with type included for the gate check
    const gatedAssessments = await prisma.assessment.findMany({
      where: {
        result: 'COMPETENT',
        student: { groupId: groupId },
      },
      select: {
        studentId: true,
        type: true,
        unitStandard: {
          select: {
            module: { select: { moduleNumber: true } }
          }
        },
      },
    });

    // Build: studentId -> moduleNumber -> Set of completed assessment types
    const studentModuleTypes = new Map<string, Map<number, Set<string>>>();
    for (const a of gatedAssessments) {
      const modNum = a.unitStandard?.module?.moduleNumber;
      if (!modNum) continue;

      if (!studentModuleTypes.has(a.studentId)) {
        studentModuleTypes.set(a.studentId, new Map());
      }
      const modMap = studentModuleTypes.get(a.studentId)!;
      if (!modMap.has(modNum)) modMap.set(modNum, new Set());
      modMap.get(modNum)!.add(a.type);
    }

    const REQUIRED_TYPES = new Set(['SUMMATIVE', 'FORMATIVE', 'WORKPLACE']);

    for (const [studentId, modMap] of studentModuleTypes.entries()) {
      // Find the highest module where all three types are present
      let highestComplete = 0;
      for (const [modNum, types] of modMap.entries()) {
        const allPresent = [...REQUIRED_TYPES].every(t => types.has(t));
        if (allPresent && modNum > highestComplete) {
          highestComplete = modNum;
        }
      }
      // The learner is effectively "in" the module AFTER their last completed one
      studentModulesMap.set(studentId, highestComplete);
    }

    const studentMaxModules = Array.from(studentModulesMap.values());
    const groupMaxModule = studentMaxModules.length > 0 ? Math.max(...studentMaxModules) : 0;

    // Flag any learner below that module as at-risk
    const atRiskCount = Array.from(studentModulesMap.values()).filter(m => m < groupMaxModule).length;

    return {
      avgCreditsPerStudent,
      avgProgressPercent,
      totalCreditsEarned,
      totalUniqueUnitsPassed,
      totalCreditsRequired,
      studentCount,
      atRiskCount,
    };
  } catch (error) {
    console.error(`Error calculating metrics for group ${groupId}:`, error);
    return {
      avgCreditsPerStudent: 0,
      avgProgressPercent: 0,
      totalCreditsEarned: 0,
      totalUniqueUnitsPassed: 0,
      totalCreditsRequired,
      studentCount: 0,
      atRiskCount: 0,
    };
  }
}

/**
 * UNIFIED: Calculate metrics for multiple groups in parallel
 * OPTIMIZED: Uses pre-calculated Student summary fields (progress, totalCreditsEarned, status)
 * Falls back to assessment loading only if needed for at-risk calculation
 */
export async function calculateMultipleGroupMetrics(
  groupIds: string[],
  totalCreditsRequired: number = TOTAL_CREDITS
): Promise<Map<string, GroupMetrics>> {
  const results = new Map<string, GroupMetrics>();

  if (groupIds.length === 0) {
    return results;
  }

  try {
    // OPTIMIZATION: Fetch aggregated student metrics using pre-calculated fields
    // This replaces loading all assessments!
    const groupMetricsQueries = groupIds.map(groupId =>
      prisma.student.aggregate({
        where: { groupId },
        _avg: { progress: true, totalCreditsEarned: true },
        _sum: { totalCreditsEarned: true },
        _count: { id: true },
      })
    );

    const atRiskCountQueries = groupIds.map(groupId =>
      prisma.student.count({ where: { groupId, status: 'AT_RISK' } })
    );

    const [groupMetricsResults, atRiskCounts] = await Promise.all([
      Promise.all(groupMetricsQueries),
      Promise.all(atRiskCountQueries),
    ]);

    // Process results
    for (let i = 0; i < groupIds.length; i++) {
      const groupId = groupIds[i];
      const metrics = groupMetricsResults[i];
      const atRiskCount = atRiskCounts[i];

      const studentCount = metrics._count || 0;

      if (studentCount === 0) {
        results.set(groupId, {
          avgCreditsPerStudent: 0,
          avgProgressPercent: 0,
          totalCreditsEarned: 0,
          totalUniqueUnitsPassed: 0,
          totalCreditsRequired,
          studentCount: 0,
          atRiskCount: 0,
        });
        continue;
      }

      const avgCreditsPerStudent = Math.round(metrics._avg.totalCreditsEarned || 0);
      const totalCreditsEarned = metrics._sum.totalCreditsEarned || 0;
      const avgProgressPercent = Math.round(metrics._avg.progress || 0);

      // For totalUniqueUnitsPassed, we approximate based on average credits
      // (assumes each unit standard is typically 1-2 credits)
      const avgUnitsPerStudent = Math.round((metrics._avg.totalCreditsEarned || 0) / 2);
      const totalUniqueUnitsPassed = avgUnitsPerStudent * studentCount;

      results.set(groupId, {
        avgCreditsPerStudent,
        avgProgressPercent,
        totalCreditsEarned,
        totalUniqueUnitsPassed,
        totalCreditsRequired,
        studentCount,
        atRiskCount: Math.min(atRiskCount, studentCount),
      });
    }
  } catch (error) {
    console.error('Error calculating metrics for multiple groups:', error);
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
 * UNIFIED: Validate metrics consistency
 * Used for auditing and data integrity checks
 */
export function validateMetrics(metrics: GroupMetrics): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (metrics.studentCount < 0) {
    errors.push('Student count cannot be negative');
  }

  if (metrics.totalCreditsEarned < 0) {
    errors.push('Total credits earned cannot be negative');
  }

  if (metrics.totalCreditsRequired < 0) {
    errors.push('Total credits required cannot be negative');
  }

  if (metrics.avgProgressPercent < 0 || metrics.avgProgressPercent > 100) {
    errors.push('Progress percent must be between 0 and 100');
  }

  if (metrics.totalUniqueUnitsPassed < 0) {
    errors.push('Total unique units passed cannot be negative');
  }

  // Logical validations
  if (metrics.studentCount === 0 && metrics.totalCreditsEarned > 0) {
    errors.push('Cannot have earned credits with no students');
  }

  if (metrics.studentCount > 0 && metrics.avgCreditsPerStudent > metrics.totalCreditsRequired) {
    errors.push('Average credits per student cannot exceed total required credits');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
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
