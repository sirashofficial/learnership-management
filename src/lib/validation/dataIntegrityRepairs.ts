import prisma from '../prisma';
import { TOTAL_CREDITS } from '../constants';
import { buildRolloutPlanFromUnitRollouts } from '../rolloutUtils';
import { calculateStudentProgress as calculateUnifiedStudentProgress } from '../calculations/unifiedMetrics';

interface RepairOptions {
  dryRun?: boolean;
  userId: string;
}

export async function recalculateAllProgress(options: RepairOptions & { studentIds?: string[] }) {
  const { dryRun = false, studentIds, userId } = options;

  const students = await prisma.student.findMany({
    where: studentIds
      ? { id: { in: studentIds } }
      : { status: { not: 'WITHDRAWN' } },
    include: {
      moduleProgress: true,
    },
  });

  if (students.length === 0) {
    return { dryRun, studentsProcessed: 0, studentsUpdated: 0, updates: [] };
  }

  const assessments = await prisma.assessment.findMany({
    where: {
      result: 'COMPETENT',
      studentId: { in: students.map((s) => s.id) },
    },
    select: {
      studentId: true,
      unitStandardId: true,
      unitStandard: { select: { credits: true, moduleId: true } },
    },
  });

  const moduleCreditsMap = new Map<string, number>();
  const studentModuleCredits = new Map<string, Map<string, number>>();
  const studentModuleUnits = new Map<string, Map<string, Set<string>>>();

  for (const assessment of assessments) {
    const moduleId = assessment.unitStandard?.moduleId;
    if (!moduleId) continue;

    if (!studentModuleCredits.has(assessment.studentId)) {
      studentModuleCredits.set(assessment.studentId, new Map());
      studentModuleUnits.set(assessment.studentId, new Map());
    }

    const moduleUnits = studentModuleUnits.get(assessment.studentId)!;
    if (!moduleUnits.has(moduleId)) {
      moduleUnits.set(moduleId, new Set());
    }

    const unitSet = moduleUnits.get(moduleId)!;
    if (!unitSet.has(assessment.unitStandardId)) {
      unitSet.add(assessment.unitStandardId);
      const moduleCredits = studentModuleCredits.get(assessment.studentId)!;
      const currentCredits = moduleCredits.get(moduleId) || 0;
      moduleCredits.set(moduleId, currentCredits + (assessment.unitStandard?.credits || 0));
    }
  }

  const modules = await prisma.module.findMany({
    select: { id: true, credits: true },
  });

  for (const module of modules) {
    moduleCreditsMap.set(module.id, module.credits || 0);
  }

  const updates: Array<{ studentId: string; updated: boolean; totalCredits: number; progress: number }> = [];

  if (dryRun) {
    for (const student of students) {
      const unified = await calculateUnifiedStudentProgress(student.id, TOTAL_CREDITS);
      const expectedCredits = unified.totalCreditsEarned;
      const expectedProgress = unified.progress;
      const shouldUpdate =
        expectedCredits !== student.totalCreditsEarned || expectedProgress !== student.progress;

      updates.push({
        studentId: student.id,
        updated: shouldUpdate,
        totalCredits: expectedCredits,
        progress: expectedProgress,
      });
    }

    return {
      dryRun: true,
      studentsProcessed: students.length,
      studentsUpdated: updates.filter((u) => u.updated).length,
      updates,
    };
  }

  await prisma.$transaction(async (tx) => {
    for (const student of students) {
      const unified = await calculateUnifiedStudentProgress(student.id, TOTAL_CREDITS);
      const expectedCredits = unified.totalCreditsEarned;
      const expectedProgress = unified.progress;

      const moduleCredits = studentModuleCredits.get(student.id) || new Map();
      const moduleUpdates = student.moduleProgress.map((progress) => {
        const moduleExpectedCredits = moduleCredits.get(progress.moduleId) || 0;
        const moduleTotalCredits = moduleCreditsMap.get(progress.moduleId) || 0;

        let status = progress.status;
        if (moduleExpectedCredits <= 0) {
          status = 'NOT_STARTED';
        } else if (moduleTotalCredits > 0 && moduleExpectedCredits >= moduleTotalCredits) {
          status = 'COMPLETED';
        } else {
          status = 'IN_PROGRESS';
        }

        return {
          id: progress.id,
          moduleId: progress.moduleId,
          creditsEarned: moduleExpectedCredits,
          status,
        };
      });

      const shouldUpdateStudent =
        expectedCredits !== student.totalCreditsEarned || expectedProgress !== student.progress;

      const shouldUpdateModules = moduleUpdates.some((update) => {
        const existing = student.moduleProgress.find((p) => p.id === update.id);
        return existing &&
          (existing.creditsEarned !== update.creditsEarned || existing.status !== update.status);
      });

      if (!shouldUpdateStudent && !shouldUpdateModules) {
        updates.push({
          studentId: student.id,
          updated: false,
          totalCredits: expectedCredits,
          progress: expectedProgress,
        });
        continue;
      }

      const previousState = {
        student: {
          totalCreditsEarned: student.totalCreditsEarned,
          progress: student.progress,
        },
        moduleProgress: student.moduleProgress.map((progress) => ({
          id: progress.id,
          moduleId: progress.moduleId,
          creditsEarned: progress.creditsEarned,
          status: progress.status,
        })),
      };

      const newState = {
        student: {
          totalCreditsEarned: expectedCredits,
          progress: expectedProgress,
        },
        moduleProgress: moduleUpdates,
      };

      await tx.undoHistory.create({
        data: {
          userId,
          action: 'DATA_REPAIR_RECALCULATE_PROGRESS',
          entityType: 'Student',
          entityIds: JSON.stringify([student.id]),
          previousState: JSON.stringify(previousState),
          newState: JSON.stringify(newState),
          description: `Recalculated progress for student ${student.id}`,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });

      if (shouldUpdateStudent) {
        await tx.student.update({
          where: { id: student.id },
          data: {
            totalCreditsEarned: expectedCredits,
            progress: expectedProgress,
          },
        });
      }

      for (const update of moduleUpdates) {
        await tx.moduleProgress.update({
          where: { id: update.id },
          data: {
            creditsEarned: update.creditsEarned,
            status: update.status,
          },
        });
      }

      updates.push({
        studentId: student.id,
        updated: true,
        totalCredits: expectedCredits,
        progress: expectedProgress,
      });
    }
  });

  return {
    dryRun: false,
    studentsProcessed: students.length,
    studentsUpdated: updates.filter((u) => u.updated).length,
    updates,
  };
}

export async function cleanupOrphanedRecords(options: RepairOptions) {
  const { dryRun = false, userId } = options;

  const orphanedAssessments = await prisma.$queryRaw<
    Array<{ id: string; studentId: string }>
  >`
    SELECT a.id, a."studentId"
    FROM "Assessment" a
    LEFT JOIN "Student" s
      ON a."studentId" = s.id AND s."isDeleted" = false
    WHERE s.id IS NULL AND a."isDeleted" = false
  `;

  const orphanedAttendance = await prisma.$queryRaw<
    Array<{ id: string; sessionId: string | null }>
  >`
    SELECT a.id, a."sessionId"
    FROM "Attendance" a
    LEFT JOIN "Session" s ON a."sessionId" = s.id
    WHERE a."sessionId" IS NOT NULL AND s.id IS NULL AND a."isDeleted" = false
  `;

  if (!dryRun && (orphanedAssessments.length > 0 || orphanedAttendance.length > 0)) {
    const previousState = {
      assessmentIds: orphanedAssessments.map((record) => record.id),
      attendanceIds: orphanedAttendance.map((record) => record.id),
    };

    await prisma.undoHistory.create({
      data: {
        userId,
        action: 'DATA_REPAIR_CLEANUP_ORPHANS',
        entityType: 'DataIntegrity',
        entityIds: JSON.stringify({
          assessmentIds: previousState.assessmentIds,
          attendanceIds: previousState.attendanceIds,
        }),
        previousState: JSON.stringify(previousState),
        newState: JSON.stringify({
          deletedAt: new Date().toISOString(),
        }),
        description: 'Soft-deleted orphaned assessments and attendance records',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    if (orphanedAssessments.length > 0) {
      await prisma.assessment.updateMany({
        where: { id: { in: orphanedAssessments.map((record) => record.id) } },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    }

    if (orphanedAttendance.length > 0) {
      await prisma.attendance.updateMany({
        where: { id: { in: orphanedAttendance.map((record) => record.id) } },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    }
  }

  return {
    dryRun,
    orphanedAssessments: orphanedAssessments.length,
    orphanedAttendance: orphanedAttendance.length,
  };
}

function parsePlanDate(value?: string): Date | null {
  if (!value) return null;
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  const parsed = new Date(`${year}-${month}-${day}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function syncRolloutPlans(options: RepairOptions & { groupIds?: string[] }) {
  const { dryRun = false, userId, groupIds } = options;

  const groups = await prisma.group.findMany({
    where: groupIds ? { id: { in: groupIds } } : undefined,
    include: {
      rolloutPlan: true,
      unitStandardRollouts: {
        include: {
          unitStandard: { 
            select: { 
              id: true,
              code: true,
              title: true,
              credits: true,
              module: { select: { moduleNumber: true, name: true } } 
            } 
          },
        },
      },
      rolloutPlans: true,
    },
  });

  const updates: Array<{ groupId: string; updated: boolean }> = [];

  for (const group of groups) {
    const plan = buildRolloutPlanFromUnitRollouts(group.unitStandardRollouts);
    if (!plan || plan.modules.length === 0) {
      updates.push({ groupId: group.id, updated: false });
      continue;
    }

    const moduleDates = new Map<number, { startDate: Date; endDate: Date }>();

    for (const module of plan.modules) {
      const unitDates = module.unitStandards
        .map((unit) => ({
          start: parsePlanDate(unit.startDate),
          end: parsePlanDate(unit.assessingDate) || parsePlanDate(unit.endDate),
        }))
        .filter((entry) => entry.start || entry.end);

      if (unitDates.length === 0) continue;

      let startDate = unitDates[0].start || unitDates[0].end as Date;
      let endDate = unitDates[0].end || unitDates[0].start as Date;

      for (const entry of unitDates) {
        if (entry.start && entry.start < startDate) startDate = entry.start;
        if (entry.end && entry.end > endDate) endDate = entry.end;
      }

      moduleDates.set(module.moduleNumber, { startDate, endDate });
    }

    if (moduleDates.size === 0) {
      updates.push({ groupId: group.id, updated: false });
      continue;
    }

    if (dryRun) {
      updates.push({ groupId: group.id, updated: true });
      continue;
    }

    const previousState = {
      rolloutPlan: group.rolloutPlan,
      rolloutPlans: group.rolloutPlans,
    };

    const groupPlanData: Record<string, Date | null> = {};
    for (const [moduleNumber, dates] of moduleDates.entries()) {
      groupPlanData[`module${moduleNumber}StartDate`] = dates.startDate;
      groupPlanData[`module${moduleNumber}EndDate`] = dates.endDate;
    }

    await prisma.$transaction(async (tx) => {
      await tx.undoHistory.create({
        data: {
          userId,
          action: 'DATA_REPAIR_SYNC_ROLLOUT',
          entityType: 'Group',
          entityIds: JSON.stringify([group.id]),
          previousState: JSON.stringify(previousState),
          newState: JSON.stringify(groupPlanData),
          description: `Synced rollout plans for group ${group.id}`,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });

      await tx.groupRolloutPlan.upsert({
        where: { groupId: group.id },
        create: {
          groupId: group.id,
          ...groupPlanData,
        },
        update: {
          ...groupPlanData,
        },
      });

      for (const planEntry of group.rolloutPlans) {
        const dates = moduleDates.get(planEntry.moduleNumber);
        if (!dates) continue;

        await tx.rolloutPlan.update({
          where: { id: planEntry.id },
          data: {
            projectedStartDate: dates.startDate,
            projectedEndDate: dates.endDate,
          },
        });
      }
    });

    updates.push({ groupId: group.id, updated: true });
  }

  return {
    dryRun,
    groupsProcessed: groups.length,
    groupsUpdated: updates.filter((u) => u.updated).length,
    updates,
  };
}
