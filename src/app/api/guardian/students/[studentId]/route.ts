import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api-utils';
import { verifyGuardianAccess } from '@/middleware/requireGuardian';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

/**
 * GET /api/guardian/students/[studentId]
 * 
 * Returns detailed read-only information for a specific student
 * Row-Level Security: Only the linked guardian can access
 * 
 * Returns:
 * - Progress timeline with module-by-module breakdown
 * - Attendance calendar data for current month
 * - Assessment history with scores and dates
 * - Recent grades with feedback
 * - Upcoming assessments
 * - No sensitive administrative data
 */
async function getStudentDetailHandler(
  request: NextRequest,
  context: { params: { studentId: string } }
) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    if (user.role !== 'GUARDIAN') {
      return errorResponse('Forbidden: User is not a guardian', 403);
    }

    const { studentId } = context.params;

    // Row-level security check: verify guardian has access to this student
    const hasAccess = await verifyGuardianAccess(user.userId, studentId);
    if (!hasAccess) {
      return errorResponse(
        'Forbidden: You do not have access to this student\'s information',
        403
      );
    }

    // Fetch student data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        progress: true,
        totalCreditsEarned: true,
        status: true,
        currentModuleId: true,
        createdAt: true,
      },
    });

    if (!student || student.status === 'INACTIVE') {
      return errorResponse('Student not found', 404);
    }

    // Fetch module progress (progress timeline)
    const moduleProgress = await prisma.moduleProgress.findMany({
      where: {
        studentId,
      },
      select: {
        status: true,
        progress: true,
        creditsEarned: true,
        startDate: true,
        completionDate: true,
        module: {
          select: {
            id: true,
            moduleNumber: true,
            name: true,
            credits: true,
          },
        },
      },
      orderBy: {
        module: {
          moduleNumber: 'asc',
        },
      },
    });

    // Fetch attendance data for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const attendance = await prisma.attendance.findMany({
      where: {
        studentId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        date: true,
        status: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Calculate attendance statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter((a) => a.status === 'PRESENT').length;
    const absentDays = attendance.filter((a) => a.status === 'ABSENT').length;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Fetch assessment history and grades
    const assessments = await prisma.assessment.findMany({
      where: {
        studentId,
        isDeleted: false,
      },
      select: {
        id: true,
        type: true,
        score: true,
        assessedDate: true,
        dueDate: true,
        result: true,
        feedback: true,
        unitStandard: {
          select: {
            title: true,
            code: true,
            credits: true,
          },
        },
      },
      orderBy: {
        assessedDate: 'desc',
      },
    });

    // Separate upcoming assessments from completed ones
    const upcomingAssessments = assessments.filter(
      (a) => a.dueDate > now && !a.assessedDate
    );
    const completedAssessments = assessments.filter(
      (a) => a.assessedDate !== null
    );

    // Fetch unit standard progress
    const unitProgress = await prisma.unitStandardProgress.findMany({
      where: {
        studentId,
      },
      select: {
        status: true,
        formativesPassed: true,
        summativePassed: true,
        startDate: true,
        completionDate: true,
        unitStandard: {
          select: {
            code: true,
            title: true,
            credits: true,
          },
        },
      },
      orderBy: {
        unitStandard: {
          code: 'asc',
        },
      },
    });

    // Build comprehensive response
    const response = {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        status: student.status,
        enrolledDate: student.createdAt,
        overallProgress: student.progress,
        creditsEarned: student.totalCreditsEarned,
      },
      progressTimeline: moduleProgress.map((mp) => ({
        module: {
          number: mp.module.moduleNumber,
          name: mp.module.name,
          totalCredits: mp.module.credits,
        },
        status: mp.status,
        progress: mp.progress,
        creditsEarned: mp.creditsEarned,
        startDate: mp.startDate,
        completionDate: mp.completionDate,
      })),
      attendanceCalendar: {
        currentMonth: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
        totalDays,
        presentDays,
        absentDays,
        attendanceRate: Math.round(attendanceRate),
        dailyRecords: attendance,
      },
      assessmentHistory: {
        upcoming: upcomingAssessments.map((a) => ({
          dueDate: a.dueDate,
          type: a.type,
          unitStandard: {
            code: a.unitStandard?.code,
            title: a.unitStandard?.title,
          },
        })),
        completed: completedAssessments.map((a) => ({
          date: a.assessedDate || a.dueDate,
          type: a.type,
          score: a.score,
          result: a.result,
          feedback: a.feedback,
          unitStandard: {
            code: a.unitStandard?.code,
            title: a.unitStandard?.title,
            credits: a.unitStandard?.credits,
          },
        })),
      },
      unitStandardProgress: unitProgress.map((up) => ({
        code: up.unitStandard?.code,
        title: up.unitStandard?.title,
        credits: up.unitStandard?.credits,
        status: up.status,
        formativesCompleted: up.formativesPassed,
        summativeCompleted: up.summativePassed,
        startDate: up.startDate,
        completionDate: up.completionDate,
      })),
    };

    return successResponse(response, 'Student details retrieved successfully');
  } catch (error) {
    console.error('Error fetching student details:', error);
    return handleApiError(error);
  }
}

export const GET = withAuth(
  withRateLimit(getStudentDetailHandler, 'moderate'),
  ['GUARDIAN']
);
