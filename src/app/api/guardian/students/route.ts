import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api-utils';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

/**
 * GET /api/guardian/students
 * 
 * Returns list of all students linked to the authenticated guardian
 * with restricted field access for read-only portal
 * 
 * Row-Level Security: Only returns students linked to the requesting guardian
 * Response includes only safe fields:
 * - Student name
 * - Current module
 * - Progress percentage
 * - Attendance rate for current month
 * - Upcoming assessment dates
 * - Recent grades
 * 
 * No sensitive data like ID numbers or other students' info
 */
async function getGuardianStudentsHandler(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    if (user.role !== 'GUARDIAN') {
      return errorResponse('Forbidden: User is not a guardian', 403);
    }

    // Get all verified guard-student relationships for this guardian
    const guardianStudents = await prisma.guardianStudent.findMany({
      where: {
        guardianId: user.userId,
        isVerified: true,
      },
      select: {
        studentId: true,
        relationshipType: true,
      },
    });

    if (guardianStudents.length === 0) {
      return successResponse({
        students: [],
      }, 'No linked students found');
    }

    const studentIds = guardianStudents.map((gs) => gs.studentId);

    // Fetch student data with only safe fields
    const students = await prisma.student.findMany({
      where: {
        id: {
          in: studentIds,
        },
        isDeleted: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        currentModuleId: true,
        progress: true,
        totalCreditsEarned: true,
        status: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    // Fetch current month attendance data for each student
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const attendanceData = await Promise.all(
      studentIds.map(async (studentId) => {
        const totalDays = await prisma.attendance.count({
          where: {
            studentId,
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        });

        const presentDays = await prisma.attendance.count({
          where: {
            studentId,
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
            status: 'PRESENT',
          },
        });

        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        return {
          studentId,
          attendanceRate: Math.round(attendanceRate),
        };
      })
    );

    const attendanceMap = Object.fromEntries(
      attendanceData.map((ad) => [ad.studentId, ad.attendanceRate])
    );

    // Fetch upcoming assessments for each student
    const upcomingAssessments = await Promise.all(
      studentIds.map(async (studentId) => {
        const assessments = await prisma.assessment.findMany({
          where: {
            studentId,
            dueDate: {
              gte: new Date(),
            },
            isDeleted: false,
          },
          select: {
            dueDate: true,
          },
          orderBy: {
            dueDate: 'asc',
          },
          take: 5,
        });

        return {
          studentId,
          upcomingDates: assessments.map((a) => a.dueDate),
        };
      })
    );

    const assessmentMap = Object.fromEntries(
      upcomingAssessments.map((ua) => [ua.studentId, ua.upcomingDates])
    );

    // Fetch recent grades for each student
    const recentGrades = await Promise.all(
      studentIds.map(async (studentId) => {
        const grades = await prisma.assessment.findMany({
          where: {
            studentId,
            score: {
              not: null,
            },
            isDeleted: false,
          },
          select: {
            score: true,
            assessedDate: true,
            unitStandard: {
              select: {
                title: true,
              },
            },
          },
          orderBy: {
            assessedDate: 'desc',
          },
          take: 5,
        });

        return {
          studentId,
          grades: grades.map((g) => ({
            score: g.score,
            date: g.assessedDate,
            unitStandard: g.unitStandard?.title,
          })),
        };
      })
    );

    const gradesMap = Object.fromEntries(
      recentGrades.map((rg) => [rg.studentId, rg.grades])
    );

    // Get module information for each student
    const moduleIds = students
      .filter((s) => s.currentModuleId)
      .map((s) => s.currentModuleId as string);

    const modules = await prisma.module.findMany({
      where: {
        id: {
          in: moduleIds,
        },
      },
      select: {
        id: true,
        name: true,
        moduleNumber: true,
      },
    });

    const moduleMap = Object.fromEntries(modules.map((m) => [m.id, m]));

    // Build response with restricted fields
    const responseStudents = students.map((student) => ({
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      currentModule: student.currentModuleId
        ? moduleMap[student.currentModuleId]
          ? {
              name: moduleMap[student.currentModuleId].name,
              number: moduleMap[student.currentModuleId].moduleNumber,
            }
          : null
        : null,
      progress: student.progress,
      creditsEarned: student.totalCreditsEarned,
      status: student.status,
      attendanceRate: attendanceMap[student.id] || 0,
      upcomingAssessments: assessmentMap[student.id] || [],
      recentGrades: gradesMap[student.id] || [],
    }));

    return successResponse({
      students: responseStudents,
      count: responseStudents.length,
    }, 'Students retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(
  withRateLimit(getGuardianStudentsHandler, 'moderate'),
  ['GUARDIAN']
);
