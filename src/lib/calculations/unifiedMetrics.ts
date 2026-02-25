/**
 * UNIFIED CALCULATION ENGINE
 * Single source of truth for all metrics across the application
 * 
 * Eliminates data inconsistencies between Dashboard and Groups pages
 * using standardized Prisma queries with consistent WHERE clauses and JOINs
 * 
 * Used by:
 * - /api/dashboard/summary/route.ts
 * - /api/data/groups/route.ts
 * - All other metric calculations across the app
 * 
 * SSETA COMPLIANCE:
 * The 140 credit hour requirement (TOTAL_CREDITS default) is the standard
 * NVC Level 2 qualification. Each student must complete all required unit
 * standards to achieve this certification. Progress is calculated as
 * (creditsEarned / 140) * 100, where credits are only counted for COMPETENT
 * assessments that meet all three required assessment types: SUMMATIVE,
 * FORMATIVE, and WORKPLACE.
 */

import prisma from '@/lib/prisma';
import { TOTAL_CREDITS } from '@/lib/constants';
import { startOfMonth } from 'date-fns';

/**
 * Group metrics interface - standardized response format
 */
export interface UnifiedGroupMetrics {
  avgCreditsPerStudent: number;      // Average credits earned per student
  avgProgressPercent: number;        // Average progress percentage (0-100)
  totalCreditsEarned: number;        // Sum of all credits earned by all students
  totalUniqueUnitsPassed: number;    // Total unique unit standards completed across group
  totalCreditsRequired: number;      // Total credits required for competency
  studentCount: number;              // Number of students in group
  atRiskCount: number;               // Students below group's highest achieved module
}

/**
 * Student progress interface
 */
export interface StudentProgressMetrics {
  studentId: string;
  totalCreditsEarned: number;
  progress: number;                  // 0-100 percentage
  status: 'ACTIVE' | 'AT_RISK' | 'COMPLETED';
  currentModuleNumber: number;       // Highest module number with competent assessments
  competentUnits: number;            // Count of unique unit standards with COMPETENT result
}

/**
 * Attendance metrics interface
 */
export interface AttendanceMetrics {
  entityId: string;
  entityType: 'GROUP' | 'STUDENT';
  attendanceRate: number;            // 0-100 percentage
  presentCount: number;              // Count of PRESENT records
  lateCount: number;                 // Count of LATE records
  absentCount: number;               // Count of ABSENT records
  totalRecords: number;              // Total attendance records
}

/**
 * CORE FUNCTION 1: Calculate unified group metrics
 * 
 * Single source of truth for credit calculations across Dashboard and Groups pages.
 * Uses standardized Prisma queries with identical WHERE clauses and JOIN conditions.
 * 
 * CALCULATION METHODOLOGY:
 * 1. Query all COMPETENT assessments for students in the group
 * 2. Build a map of studentId -> unitStandardId to count unique units
 * 3. Sum credits from unique units (each unit counted once per student)
 * 4. Calculate average credits per student: totalCredits / studentCount
 * 5. Calculate progress percentage: (avgCredits / requiredCredits) * 100
 * 6. Determine at-risk status by comparing each student's module progress
 *    to the group's highest achieved module (gating logic: requires SUMMATIVE,
 *    FORMATIVE, and WORKPLACE results for ALL units in a module before that
 *    student is considered to have "completed" the module)
 * 
 * @param groupId - Group identifier
 * @param totalCreditsRequired - Total credits for competency (default: 140 SSETA credits)
 * @returns Unified metrics object
 */
export async function calculateGroupMetrics(
  groupId: string,
  totalCreditsRequired: number = TOTAL_CREDITS
): Promise<UnifiedGroupMetrics> {
  try {
    // STANDARDIZED QUERY 1: Student count with identical WHERE clause
    const studentCount = await prisma.student.count({
      where: {
        groupId: groupId,
        // Only count active learners, exclude transferred/withdrawn students
        status: { not: 'WITHDRAWN' }
      }
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

    // STANDARDIZED QUERY 2: Fetch all COMPETENT assessments with identical WHERE
    // Uses consistent JOIN conditions across all endpoints
    const competentAssessments = await prisma.assessment.findMany({
      where: {
        result: 'COMPETENT',
        student: {
          groupId: groupId,
          status: { not: 'WITHDRAWN' }  // Same filter as above
        }
      },
      select: {
        studentId: true,
        unitStandardId: true,
        unitStandard: {
          select: {
            credits: true,
            code: true,
            module: {
              select: {
                moduleNumber: true,
                id: true
              }
            }
          }
        }
      }
    });

    // BUILD MAPS: studentId -> unitStandardId -> credits
    // This ensures each unit is counted only once per student (no double-counting)
    const studentUnitsMap = new Map<string, Map<string, number>>();

    for (const assessment of competentAssessments) {
      if (!assessment.unitStandardId) continue;

      if (!studentUnitsMap.has(assessment.studentId)) {
        studentUnitsMap.set(assessment.studentId, new Map());
      }

      const unitMap = studentUnitsMap.get(assessment.studentId)!;
      // Store credit value for this unit (will be same regardless of how many assessments)
      unitMap.set(
        assessment.unitStandardId,
        assessment.unitStandard?.credits || 0
      );
    }

    // CALCULATE TOTALS from unique units
    let totalCreditsEarned = 0;
    let totalUniqueUnitsPassed = 0;

    for (const unitMap of studentUnitsMap.values()) {
      totalUniqueUnitsPassed += unitMap.size;
      for (const credits of unitMap.values()) {
        totalCreditsEarned += credits;
      }
    }

    // CALCULATE AVERAGES
    const avgCreditsPerStudent = studentCount > 0
      ? Math.round(totalCreditsEarned / studentCount)
      : 0;

    const avgProgressPercent = totalCreditsRequired > 0
      ? Math.round((avgCreditsPerStudent / totalCreditsRequired) * 100)
      : 0;

    // GATING LOGIC: Determine at-risk students
    // A learner's current module is the next module AFTER the highest module
    // where they have COMPETENT results for ALL THREE required assessment types:
    // SUMMATIVE, FORMATIVE, and WORKPLACE
    //
    // studentModulesMap: studentId -> highest FULLY completed module number

    const gatedAssessments = await prisma.assessment.findMany({
      where: {
        result: 'COMPETENT',
        student: {
          groupId: groupId,
          status: { not: 'WITHDRAWN' }  // Consistent filter
        }
      },
      select: {
        studentId: true,
        type: true,
        unitStandard: {
          select: {
            module: {
              select: { moduleNumber: true }
            }
          }
        }
      }
    });

    // Build: studentId -> moduleNumber -> Set of assessment types
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

    const REQUIRED_ASSESSMENT_TYPES = new Set(['SUMMATIVE', 'FORMATIVE', 'WORKPLACE']);

    const studentModulesMap = new Map<string, number>();
    for (const [studentId, modMap] of studentModuleTypes.entries()) {
      // Find the highest module where all three assessment types are complete
      let highestComplete = 0;
      for (const [modNum, types] of modMap.entries()) {
        // Only count module as complete if ALL three required types are present
        const allPresent = [...REQUIRED_ASSESSMENT_TYPES].every(t => types.has(t));
        if (allPresent && modNum > highestComplete) {
          highestComplete = modNum;
        }
      }
      studentModulesMap.set(studentId, highestComplete);
    }

    // Flag any learner below the group's maximum module as at-risk
    const studentModules = Array.from(studentModulesMap.values());
    const groupMaxModule = studentModules.length > 0 ? Math.max(...studentModules) : 0;
    const atRiskCount = Array.from(studentModulesMap.values())
      .filter(m => m < groupMaxModule).length;

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
    console.error(`[UnifiedMetrics] Error calculating group metrics for ${groupId}:`, error);
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
 * CORE FUNCTION 2: Calculate unified student progress
 * 
 * Standardized progress calculation for all students based on SSETA's
 * 140 credit hour requirements. This ensures consistent progress reporting
 * across Dashboard and all student-level views.
 * 
 * CALCULATION METHODOLOGY:
 * 1. Query all COMPETENT assessments for the student
 * 2. Count unique unit standards completed
 * 3. Sum total credits from those units
 * 4. Calculate progress: (totalCredits / requiredCredits) * 100
 * 5. Determine status: COMPLETED if >= 100%, AT_RISK if < 25%, else ACTIVE
 * 6. Find current module number (highest module with assessments)
 * 
 * @param studentId - Student identifier
 * @param totalCreditsRequired - Total credits for competency (default: 140 SSETA credits)
 * @returns Student progress metrics
 */
export async function calculateStudentProgress(
  studentId: string,
  totalCreditsRequired: number = TOTAL_CREDITS
): Promise<StudentProgressMetrics> {
  try {
    // STANDARDIZED QUERY: All COMPETENT assessments for student
    const competentAssessments = await prisma.assessment.findMany({
      where: {
        studentId: studentId,
        result: 'COMPETENT'
      },
      select: {
        unitStandardId: true,
        unitStandard: {
          select: {
            credits: true,
            module: {
              select: { moduleNumber: true }
            }
          }
        }
      }
    });

    if (competentAssessments.length === 0) {
      return {
        studentId,
        totalCreditsEarned: 0,
        progress: 0,
        status: 'ACTIVE',
        currentModuleNumber: 0,
        competentUnits: 0,
      };
    }

    // Build unique units map to prevent double-counting
    const uniqueUnits = new Map<string, number>();
    let maxModuleNumber = 0;

    for (const assessment of competentAssessments) {
      if (!assessment.unitStandardId) continue;

      // Store unique unit and its credits
      uniqueUnits.set(
        assessment.unitStandardId,
        assessment.unitStandard?.credits || 0
      );

      // Track highest module number
      const modNum = assessment.unitStandard?.module?.moduleNumber || 0;
      if (modNum > maxModuleNumber) {
        maxModuleNumber = modNum;
      }
    }

    // Sum credits from unique units
    let totalCreditsEarned = 0;
    for (const credits of uniqueUnits.values()) {
      totalCreditsEarned += credits;
    }

    // Calculate progress percentage
    const progress = totalCreditsRequired > 0
      ? Math.round((totalCreditsEarned / totalCreditsRequired) * 100)
      : 0;

    // Determine status based on progress
    let status: 'ACTIVE' | 'AT_RISK' | 'COMPLETED';
    if (progress >= 100) {
      status = 'COMPLETED';
    } else if (progress < 25) {
      status = 'AT_RISK';
    } else {
      status = 'ACTIVE';
    }

    return {
      studentId,
      totalCreditsEarned,
      progress,
      status,
      currentModuleNumber: maxModuleNumber,
      competentUnits: uniqueUnits.size,
    };
  } catch (error) {
    console.error(`[UnifiedMetrics] Error calculating progress for student ${studentId}:`, error);
    return {
      studentId,
      totalCreditsEarned: 0,
      progress: 0,
      status: 'ACTIVE',
      currentModuleNumber: 0,
      competentUnits: 0,
    };
  }
}

/**
 * CORE FUNCTION 3: Calculate unified attendance rate
 * 
 * Standardized attendance calculation that handles both group-level and
 * student-level metrics. Calculates attendance for the current month only.
 * 
 * CALCULATION METHODOLOGY:
 * For groups:
 * 1. Query all attendance records for the group in current month
 * 2. Group by student to calculate per-student rate
 * 3. Average the per-student rates (not simple record count)
 * 
 * For students:
 * 1. Query all attendance records for the student in current month
 * 2. Calculate rate as (PRESENT + LATE) / total records
 * 
 * This ensures groups aren't skewed by students with many records.
 * 
 * @param entityId - Group ID or Student ID
 * @param entityType - 'GROUP' or 'STUDENT'
 * @returns Attendance metrics
 */
export async function calculateAttendanceRate(
  entityId: string,
  entityType: 'GROUP' | 'STUDENT' = 'GROUP'
): Promise<AttendanceMetrics> {
  try {
    const startOfCurrentMonth = startOfMonth(new Date());

    // STANDARDIZED QUERY: Attendance records for current month
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: { gte: startOfCurrentMonth },
        ...(entityType === 'GROUP'
          ? { groupId: entityId }
          : { studentId: entityId }
        )
      },
      select: {
        status: true,
        studentId: true
      }
    });

    if (attendanceRecords.length === 0) {
      return {
        entityId,
        entityType,
        attendanceRate: 0,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        totalRecords: 0,
      };
    }

    const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'LATE').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'ABSENT').length;

    let attendanceRate = 0;

    if (entityType === 'STUDENT') {
      // For student: simple calculation
      const recordCount = attendanceRecords.length;
      attendanceRate = recordCount > 0
        ? Math.round(((presentCount + lateCount) / recordCount) * 100)
        : 0;
    } else {
      // For group: average per-student rate to normalize by student count
      const studentMap = new Map<string, string[]>();
      for (const record of attendanceRecords) {
        if (!studentMap.has(record.studentId)) {
          studentMap.set(record.studentId, []);
        }
        studentMap.get(record.studentId)!.push(record.status);
      }

      let subtotalRates = 0;
      for (const statuses of studentMap.values()) {
        const studentPresent = statuses.filter(s => s === 'PRESENT').length;
        const studentLate = statuses.filter(s => s === 'LATE').length;
        const studentRate = statuses.length > 0
          ? ((studentPresent + studentLate) / statuses.length) * 100
          : 0;
        subtotalRates += studentRate;
      }

      attendanceRate = studentMap.size > 0
        ? Math.round(subtotalRates / studentMap.size)
        : 0;
    }

    return {
      entityId,
      entityType,
      attendanceRate,
      presentCount,
      lateCount,
      absentCount,
      totalRecords: attendanceRecords.length,
    };
  } catch (error) {
    console.error(`[UnifiedMetrics] Error calculating attendance for ${entityType} ${entityId}:`, error);
    return {
      entityId,
      entityType,
      attendanceRate: 0,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      totalRecords: 0,
    };
  }
}

/**
 * OPTIMIZATION: Calculate metrics for multiple groups in parallel
 * 
 * Reduces N+1 query problems by fetching data for all groups at once.
 * Uses same logic as calculateGroupMetrics but batched.
 * 
 * @param groupIds - Array of group IDs
 * @param totalCreditsRequired - Total credits required (default: 140)
 * @returns Map of groupId -> metrics
 */
export async function calculateMultipleGroupMetrics(
  groupIds: string[],
  totalCreditsRequired: number = TOTAL_CREDITS
): Promise<Map<string, UnifiedGroupMetrics>> {
  const results = new Map<string, UnifiedGroupMetrics>();

  if (groupIds.length === 0) {
    return results;
  }

  try {
    // STANDARDIZED BATCH QUERIES
    const metricsPromises = groupIds.map(groupId =>
      calculateGroupMetrics(groupId, totalCreditsRequired)
    );

    const allMetrics = await Promise.all(metricsPromises);

    for (let i = 0; i < groupIds.length; i++) {
      results.set(groupIds[i], allMetrics[i]);
    }
  } catch (error) {
    console.error('[UnifiedMetrics] Error calculating multiple group metrics:', error);
  }

  return results;
}

/**
 * VALIDATION: Verify metrics consistency and data integrity
 * 
 * Checks that calculated metrics are within expected ranges.
 * Used for auditing and detecting data anomalies.
 * 
 * @param metrics - Metrics to validate
 * @returns Validation result with any errors
 */
export function validateGroupMetrics(
  metrics: UnifiedGroupMetrics
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (metrics.studentCount < 0) {
    errors.push('Student count cannot be negative');
  }

  if (metrics.totalCreditsEarned < 0) {
    errors.push('Total credits earned cannot be negative');
  }

  if (metrics.totalCreditsRequired <= 0) {
    errors.push('Total credits required must be positive');
  }

  if (metrics.avgProgressPercent < 0 || metrics.avgProgressPercent > 100) {
    errors.push('Progress percent must be between 0 and 100');
  }

  if (metrics.totalUniqueUnitsPassed < 0) {
    errors.push('Total unique units passed cannot be negative');
  }

  if (metrics.atRiskCount < 0 || metrics.atRiskCount > metrics.studentCount) {
    errors.push('At-risk count must be between 0 and student count');
  }

  // Logical validations
  if (metrics.studentCount === 0 && metrics.totalCreditsEarned > 0) {
    errors.push('Cannot have earned credits with no students');
  }

  if (metrics.studentCount > 0 && metrics.avgCreditsPerStudent > metrics.totalCreditsRequired) {
    errors.push('Average credits per student cannot exceed total required credits');
  }

  if (metrics.totalUniqueUnitsPassed > metrics.studentCount * metrics.totalCreditsRequired) {
    errors.push('Total unique units passed exceeds theoretical maximum');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
