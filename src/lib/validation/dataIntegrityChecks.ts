import prisma from '../prisma';
import { TOTAL_CREDITS } from '../constants';

export type DataIntegritySeverity = 'warning' | 'critical';
export type DataIntegrityCheckType =
  | 'student_progress'
  | 'group_rollout'
  | 'attendance_rates'
  | 'orphaned_records';

export interface DataIntegrityIssue {
  checkType: DataIntegrityCheckType;
  severity: DataIntegritySeverity;
  description: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

export const DATA_INTEGRITY_THRESHOLDS = {
  creditDriftCriticalPercent: 5,
  roundingDriftPercent: 1,
  attendanceDriftWarningPercent: 1,
  rolloutDateDriftDays: 1,
  totalCreditsRequired: TOTAL_CREDITS,
};

function daysDiff(dateA: Date, dateB: Date): number {
  const diffMs = Math.abs(dateA.getTime() - dateB.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export async function validateStudentProgress(): Promise<DataIntegrityIssue[]> {
  const issues: DataIntegrityIssue[] = [];

  const [moduleProgress, assessments] = await Promise.all([
    prisma.moduleProgress.findMany({
      include: {
        module: { select: { id: true, moduleNumber: true, name: true, credits: true } },
        student: { select: { id: true, studentId: true, firstName: true, lastName: true } },
      },
    }),
    prisma.assessment.findMany({
      where: { result: 'COMPETENT' },
      select: {
        studentId: true,
        unitStandardId: true,
        unitStandard: { select: { credits: true, moduleId: true } },
      },
    }),
  ]);

  const studentModuleCredits = new Map<string, Map<string, number>>();
  const studentModuleUnits = new Map<string, Map<string, Set<string>>>();

  for (const assessment of assessments) {
    const moduleId = assessment.unitStandard?.moduleId;
    if (!moduleId) continue;

    if (!studentModuleCredits.has(assessment.studentId)) {
      studentModuleCredits.set(assessment.studentId, new Map());
      studentModuleUnits.set(assessment.studentId, new Map());
    }

    const moduleCredits = studentModuleCredits.get(assessment.studentId)!;
    const moduleUnits = studentModuleUnits.get(assessment.studentId)!;

    if (!moduleUnits.has(moduleId)) {
      moduleUnits.set(moduleId, new Set());
    }

    const unitSet = moduleUnits.get(moduleId)!;
    if (!unitSet.has(assessment.unitStandardId)) {
      unitSet.add(assessment.unitStandardId);
      const currentCredits = moduleCredits.get(moduleId) || 0;
      moduleCredits.set(moduleId, currentCredits + (assessment.unitStandard?.credits || 0));
    }
  }

  for (const progress of moduleProgress) {
    const moduleId = progress.moduleId;
    const studentId = progress.studentId;
    const expectedCredits = studentModuleCredits.get(studentId)?.get(moduleId) || 0;
    const storedCredits = progress.creditsEarned || 0;

    if (expectedCredits === storedCredits) continue;

    const diff = Math.abs(expectedCredits - storedCredits);
    const driftPercent = expectedCredits === 0 ? 100 : Math.round((diff / expectedCredits) * 100);
    const severity: DataIntegritySeverity =
      driftPercent > DATA_INTEGRITY_THRESHOLDS.creditDriftCriticalPercent ? 'critical' : 'warning';

    issues.push({
      checkType: 'student_progress',
      severity,
      entityId: progress.id,
      description: `Module ${progress.module?.moduleNumber || '?'} credits mismatch for ${progress.student.firstName} ${progress.student.lastName}: stored ${storedCredits}, expected ${expectedCredits}.`,
      metadata: {
        studentId: progress.studentId,
        moduleId,
        moduleNumber: progress.module?.moduleNumber,
        storedCredits,
        expectedCredits,
        driftPercent,
      },
    });
  }

  return issues;
}

export async function validateGroupRollout(): Promise<DataIntegrityIssue[]> {
  const issues: DataIntegrityIssue[] = [];

  const [rolloutPlans, unitStandardRollouts] = await Promise.all([
    prisma.rolloutPlan.findMany({
      select: {
        id: true,
        groupId: true,
        moduleId: true,
        moduleNumber: true,
        projectedStartDate: true,
        projectedEndDate: true,
      },
    }),
    prisma.unitStandardRollout.findMany({
      select: {
        groupId: true,
        startDate: true,
        endDate: true,
        summativeDate: true,
        assessingDate: true,
        unitStandard: { select: { module: { select: { moduleNumber: true } } } },
      },
    }),
  ]);

  const rolloutDateMap = new Map<string, { startDate: Date; endDate: Date }>();

  for (const rollout of unitStandardRollouts) {
    const moduleNumber = rollout.unitStandard?.module?.moduleNumber;
    if (!moduleNumber) continue;

    const start = rollout.startDate || rollout.endDate || rollout.summativeDate || rollout.assessingDate;
    const end = rollout.assessingDate || rollout.endDate || rollout.summativeDate || rollout.startDate;
    if (!start || !end) continue;

    const key = `${rollout.groupId}:${moduleNumber}`;
    const existing = rolloutDateMap.get(key);

    if (!existing) {
      rolloutDateMap.set(key, { startDate: start, endDate: end });
      continue;
    }

    if (start < existing.startDate) {
      existing.startDate = start;
    }

    if (end > existing.endDate) {
      existing.endDate = end;
    }
  }

  for (const plan of rolloutPlans) {
    const key = `${plan.groupId}:${plan.moduleNumber}`;
    const expected = rolloutDateMap.get(key);
    if (!expected) continue;

    const startDiff = daysDiff(expected.startDate, plan.projectedStartDate);
    const endDiff = daysDiff(expected.endDate, plan.projectedEndDate);

    if (
      startDiff > DATA_INTEGRITY_THRESHOLDS.rolloutDateDriftDays ||
      endDiff > DATA_INTEGRITY_THRESHOLDS.rolloutDateDriftDays
    ) {
      issues.push({
        checkType: 'group_rollout',
        severity: 'warning',
        entityId: plan.id,
        description: `Rollout plan dates drift for group ${plan.groupId} module ${plan.moduleNumber}.`,
        metadata: {
          groupId: plan.groupId,
          moduleNumber: plan.moduleNumber,
          projectedStartDate: plan.projectedStartDate,
          projectedEndDate: plan.projectedEndDate,
          expectedStartDate: expected.startDate,
          expectedEndDate: expected.endDate,
          startDiffDays: startDiff,
          endDiffDays: endDiff,
        },
      });
    }
  }

  return issues;
}

export async function validateAttendanceRates(): Promise<DataIntegrityIssue[]> {
  const issues: DataIntegrityIssue[] = [];

  const groupStats = await prisma.groupStats.findMany({
    select: { groupId: true, attendanceRate: true },
  });

  if (groupStats.length === 0) return issues;

  const attendanceCounts = await prisma.$queryRaw<
    Array<{ groupId: string; totalCount: number; presentCount: number }>
  >`
    SELECT "groupId",
      COUNT(*)::int as "totalCount",
      SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END)::int as "presentCount"
    FROM "Attendance"
    WHERE "groupId" IS NOT NULL AND "isDeleted" = false
    GROUP BY "groupId"
  `;

  const attendanceMap = new Map<string, { totalCount: number; presentCount: number }>();
  for (const row of attendanceCounts) {
    attendanceMap.set(row.groupId, {
      totalCount: Number(row.totalCount || 0),
      presentCount: Number(row.presentCount || 0),
    });
  }

  for (const stat of groupStats) {
    const counts = attendanceMap.get(stat.groupId) || { totalCount: 0, presentCount: 0 };
    const expectedRate = counts.totalCount > 0
      ? Math.round((counts.presentCount / counts.totalCount) * 100)
      : 0;
    const storedRate = Math.round(stat.attendanceRate || 0);
    const diff = Math.abs(expectedRate - storedRate);

    if (diff > DATA_INTEGRITY_THRESHOLDS.attendanceDriftWarningPercent) {
      issues.push({
        checkType: 'attendance_rates',
        severity: 'warning',
        entityId: stat.groupId,
        description: `Attendance rate mismatch for group ${stat.groupId}: stored ${storedRate}%, expected ${expectedRate}%.`,
        metadata: {
          groupId: stat.groupId,
          storedRate,
          expectedRate,
          presentCount: counts.presentCount,
          totalCount: counts.totalCount,
          driftPercent: diff,
        },
      });
    }
  }

  return issues;
}

export async function validateOrphanedRecords(): Promise<DataIntegrityIssue[]> {
  const issues: DataIntegrityIssue[] = [];

  const orphanedAssessments = await prisma.$queryRaw<
    Array<{ id: string; studentId: string }>
  >`
    SELECT a.id, a."studentId"
    FROM "Assessment" a
    LEFT JOIN "Student" s
      ON a."studentId" = s.id AND s."isDeleted" = false
    WHERE s.id IS NULL AND a."isDeleted" = false
  `;

  for (const record of orphanedAssessments) {
    issues.push({
      checkType: 'orphaned_records',
      severity: 'critical',
      entityId: record.id,
      description: `Assessment ${record.id} has no active student record.`,
      metadata: { assessmentId: record.id, studentId: record.studentId },
    });
  }

  const orphanedAttendance = await prisma.$queryRaw<
    Array<{ id: string; sessionId: string | null }>
  >`
    SELECT a.id, a."sessionId"
    FROM "Attendance" a
    LEFT JOIN "Session" s ON a."sessionId" = s.id
    WHERE a."sessionId" IS NOT NULL AND s.id IS NULL AND a."isDeleted" = false
  `;

  for (const record of orphanedAttendance) {
    issues.push({
      checkType: 'orphaned_records',
      severity: 'critical',
      entityId: record.id,
      description: `Attendance ${record.id} references a missing session.`,
      metadata: { attendanceId: record.id, sessionId: record.sessionId },
    });
  }

  return issues;
}

export async function runAllDataIntegrityChecks(): Promise<DataIntegrityIssue[]> {
  const results = await Promise.all([
    validateStudentProgress(),
    validateGroupRollout(),
    validateAttendanceRates(),
    validateOrphanedRecords(),
  ]);

  return results.flat();
}
