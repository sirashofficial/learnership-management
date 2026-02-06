/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get statistics with trend data
    const [
      totalStudents,
      studentsLastMonth,
      totalGroups,
      groupsLastMonth,
      totalCompanies,
      companiesLastMonth,
      activeCourses,
      coursesLastMonth,
      pendingAssessments,
      pendingAssessmentsLastMonth,
      allAttendance,
      attendanceLastMonth,
      studentsWithProgress,
      studentsProgressLastMonth,
    ] = await Promise.all([
      // Total students
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.student.count({ 
        where: { 
          status: 'ACTIVE',
          createdAt: { lte: thirtyDaysAgo }
        } 
      }),
      
      // Total active groups with companies
      prisma.group.count({ where: { status: 'ACTIVE' } }),
      prisma.group.count({ 
        where: { 
          status: 'ACTIVE',
          createdAt: { lte: thirtyDaysAgo }
        } 
      }),
      
      // Total companies
      prisma.company.count({ where: { status: 'ACTIVE' } }),
      prisma.company.count({ 
        where: { 
          status: 'ACTIVE',
          createdAt: { lte: thirtyDaysAgo }
        } 
      }),
      
      // Active courses
      prisma.module.count({ where: { status: { in: ['IN_PROGRESS', 'NOT_STARTED'] } } }),
      prisma.module.count({ 
        where: { 
          status: { in: ['IN_PROGRESS', 'NOT_STARTED'] },
          createdAt: { lte: thirtyDaysAgo }
        } 
      }),
      
      // Pending assessments
      prisma.assessment.count({
        where: {
          result: 'PENDING',
          dueDate: { gte: now },
        },
      }),
      prisma.assessment.count({
        where: {
          result: 'PENDING',
          dueDate: { gte: thirtyDaysAgo, lte: now },
        },
      }),
      
      // All attendance for rate calculation
      prisma.attendance.findMany({
        where: {
          date: { gte: sevenDaysAgo },
        },
        select: { status: true },
      }),
      prisma.attendance.findMany({
        where: {
          date: { gte: thirtyDaysAgo, lte: sevenDaysAgo },
        },
        select: { status: true },
      }),
      
      // Students with progress
      prisma.student.findMany({
        where: { status: 'ACTIVE' },
        select: { progress: true, createdAt: true },
      }),
      prisma.student.findMany({
        where: { 
          status: 'ACTIVE',
          createdAt: { lte: thirtyDaysAgo }
        },
        select: { progress: true },
      }),
    ]);

    // Calculate attendance rate
    const presentCount = allAttendance.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendanceRate = allAttendance.length > 0
      ? Math.round((presentCount / allAttendance.length) * 100)
      : 0;
      
    const presentCountLastMonth = attendanceLastMonth.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendanceRateLastMonth = attendanceLastMonth.length > 0
      ? Math.round((presentCountLastMonth / attendanceLastMonth.length) * 100)
      : 0;

    // Calculate completion rate (students with progress >= 100)
    const completedStudents = studentsWithProgress.filter((s: any) => s.progress >= 100).length;
    const completionRate = studentsWithProgress.length > 0
      ? Math.round((completedStudents / studentsWithProgress.length) * 100)
      : 0;
      
    const completedStudentsLastMonth = studentsProgressLastMonth.filter((s: any) => s.progress >= 100).length;
    const completionRateLastMonth = studentsProgressLastMonth.length > 0
      ? Math.round((completedStudentsLastMonth / studentsProgressLastMonth.length) * 100)
      : 0;

    // Calculate trends (percentage change)
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const stats = {
      totalStudents: {
        value: totalStudents,
        trend: calculateTrend(totalStudents, studentsLastMonth),
      },
      totalGroups: {
        value: totalGroups,
        trend: calculateTrend(totalGroups, groupsLastMonth),
      },
      totalCompanies: {
        value: totalCompanies,
        trend: calculateTrend(totalCompanies, companiesLastMonth),
      },
      attendanceRate: {
        value: attendanceRate,
        trend: attendanceRate - attendanceRateLastMonth,
      },
      activeCourses: {
        value: activeCourses,
        trend: calculateTrend(activeCourses, coursesLastMonth),
      },
      completionRate: {
        value: completionRate,
        trend: completionRate - completionRateLastMonth,
      },
      pendingAssessments: {
        value: pendingAssessments,
        trend: calculateTrend(pendingAssessments, pendingAssessmentsLastMonth),
      },
    };

    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
