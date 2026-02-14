/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const alerts: any[] = [];

    // 1. Assessment deadlines (due in next 3 days)
    const upcomingAssessments = await prisma.assessment.findMany({
      where: {
        result: 'PENDING',
        dueDate: {
          gte: now,
          lte: threeDaysFromNow,
        },
      },
      include: {
        student: {
          include: {
            group: true,
          },
        },
      },
      take: 10,
      orderBy: { dueDate: 'asc' },
    });

    upcomingAssessments.forEach((assessment: any) => {
      const daysUntilDue = Math.ceil((assessment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `assessment-${assessment.id}`,
        type: 'ASSESSMENT_DEADLINE',
        priority: daysUntilDue <= 1 ? 'URGENT' : 'WARNING',
        title: `Assessment due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}`,
        message: `${assessment.student.firstName} ${assessment.student.lastName} - ${assessment.module}`,
        timestamp: now,
        data: {
          assessmentId: assessment.id,
          studentId: assessment.student.id,
          studentName: `${assessment.student.firstName} ${assessment.student.lastName}`,
          module: assessment.module,
          dueDate: assessment.dueDate,
        },
      });
    });

    // 2. Students with low attendance (< 75% in last 7 days)
    const allStudents = await prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: {
        attendance: {
          where: {
            date: { gte: sevenDaysAgo },
          },
        },
        group: true,
      },
    });

    allStudents.forEach((student: any) => {
      if (student.attendance.length >= 3) {
        const presentCount = student.attendance.filter(
          (a: any) => a.status === 'PRESENT' || a.status === 'LATE'
        ).length;
        const attendanceRate = Math.round((presentCount / student.attendance.length) * 100);

        if (attendanceRate < 75) {
          alerts.push({
            id: `attendance-${student.id}`,
            type: 'LOW_ATTENDANCE',
            priority: attendanceRate < 50 ? 'URGENT' : 'WARNING',
            title: `Low attendance: ${attendanceRate}%`,
            message: `${student.firstName} ${student.lastName} - ${student.group.name}`,
            timestamp: now,
            data: {
              studentId: student.id,
              studentName: `${student.firstName} ${student.lastName}`,
              groupName: student.group.name,
              attendanceRate,
            },
          });
        }
      }
    });

    // 3. Pending moderation items
    const pendingModeration = await prisma.assessment.findMany({
      where: {
        moderationStatus: 'PENDING',
        result: { not: 'PENDING' },
      },
      include: {
        student: {
          include: {
            group: true,
          },
        },
      },
      take: 10,
      orderBy: { assessedDate: 'asc' },
    });

    pendingModeration.forEach((assessment: any) => {
      alerts.push({
        id: `moderation-${assessment.id}`,
        type: 'PENDING_MODERATION',
        priority: 'INFO',
        title: 'Assessment pending moderation',
        message: `${assessment.student.firstName} ${assessment.student.lastName} - ${assessment.module}`,
        timestamp: assessment.assessedDate || now,
        data: {
          assessmentId: assessment.id,
          studentId: assessment.student.id,
          studentName: `${assessment.student.firstName} ${assessment.student.lastName}`,
          module: assessment.module,
        },
      });
    });

    // 4. Students at risk (progress < 40%)
    const atRiskStudents = await prisma.student.findMany({
      where: {
        status: 'ACTIVE',
        progress: { lt: 40 },
      },
      include: {
        group: true,
      },
      take: 10,
      orderBy: { progress: 'asc' },
    });

    atRiskStudents.forEach((student: any) => {
      alerts.push({
        id: `at-risk-${student.id}`,
        type: 'AT_RISK',
        priority: student.progress < 20 ? 'URGENT' : 'WARNING',
        title: `Student at risk: ${student.progress}% progress`,
        message: `${student.firstName} ${student.lastName} - ${student.group.name}`,
        timestamp: now,
        data: {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          groupName: student.group.name,
          progress: student.progress,
        },
      });
    });

    // 5. Missing documents (incomplete POE checklists)
    const incompleteChecklists = await prisma.pOEChecklist.findMany({
      where: {
        OR: [
          { idCopyPresent: false },
          { contractSigned: false },
          { inductionComplete: false },
        ],
      },
      include: {
        student: {
          include: {
            group: true,
          },
        },
      },
      take: 10,
    });

    incompleteChecklists.forEach((checklist: any) => {
      const missing: string[] = [];
      if (!checklist.idCopyPresent) missing.push('ID Copy');
      if (!checklist.contractSigned) missing.push('Contract');
      if (!checklist.inductionComplete) missing.push('Induction');

      alerts.push({
        id: `documents-${checklist.student.id}`,
        type: 'MISSING_DOCUMENTS',
        priority: 'WARNING',
        title: 'Missing documents',
        message: `${checklist.student.firstName} ${checklist.student.lastName} - ${missing.join(', ')}`,
        timestamp: now,
        data: {
          studentId: checklist.student.id,
          studentName: `${checklist.student.firstName} ${checklist.student.lastName}`,
          groupName: checklist.student.group.name,
          missingDocuments: missing,
        },
      });
    });

    // 6. Courses ending soon (groups ending in next 7 days)
    const endingGroups = await prisma.group.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    endingGroups.forEach((group: any) => {
      const daysUntilEnd = Math.ceil((group.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `ending-${group.id}`,
        type: 'COURSE_ENDING',
        priority: daysUntilEnd <= 3 ? 'WARNING' : 'INFO',
        title: `Group ending ${daysUntilEnd === 0 ? 'today' : `in ${daysUntilEnd} day${daysUntilEnd > 1 ? 's' : ''}`}`,
        message: `${group.name}${group.company ? ` - ${group.company.name}` : ''} (${group._count.students} students)`,
        timestamp: now,
        data: {
          groupId: group.id,
          groupName: group.name,
          companyName: group.company?.name || null,
          endDate: group.endDate,
          studentCount: group._count.students,
        },
      });
    });

    // Sort by priority and take top 10
    const priorityOrder = { URGENT: 0, WARNING: 1, INFO: 2 };
    const sortedAlerts = alerts
      .sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      })
      .slice(0, 10);

    return successResponse({ alerts: sortedAlerts });
  } catch (error) {
    return handleApiError(error);
  }
}
