/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';
import { refreshAllStats, needsRefresh } from '@/lib/calculations/materializedViewManager';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

async function getStatsHandler(request: NextRequest) {
  try {
    // Try to use materialized views first for performance
    const useCache = request.nextUrl.searchParams.get('cache') !== 'false';
    
    if (useCache) {
      const cachedStats = await getStatsFromCache();
      if (cachedStats) {
        // Check if any cache is stale (>1 hour old)
        const groupStats = await prisma.groupStats.findFirst({
          orderBy: { lastCalculatedAt: 'asc' },
        });
        
        if (groupStats) {
          const oneHourAgo = new Date();
          oneHourAgo.setHours(oneHourAgo.getHours() - 1);
          
          // Trigger background refresh if stale (don't wait for it)
          if (groupStats.lastCalculatedAt < oneHourAgo) {
            refreshAllStats().catch(err => 
              console.error('Background refresh failed:', err)
            );
          }
        }
        
        return successResponse(cachedStats);
      }
    }

    // Fallback to live calculation if cache is empty or disabled
    return getLiveStats();
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(withRateLimit(getStatsHandler, 'generous'), ['ADMIN', 'FACILITATOR']);

/**
 * Get statistics from materialized views (fast ~50ms)
 */
async function getStatsFromCache() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Check if we have any cached stats
    const groupStatsCount = await prisma.groupStats.count();
    if (groupStatsCount === 0) {
      // No cache yet, trigger initial calculation
      refreshAllStats().catch(err => 
        console.error('Initial stats calculation failed:', err)
      );
      return null; // Will fall back to live stats
    }

    // Get latest dashboard summary metrics
    const [
      totalStudentsMetric,
      totalGroupsMetric,
      attendanceRateMetric,
      totalStudentsLastMonth,
      totalGroupsLastMonth,
    ] = await Promise.all([
      prisma.dashboardSummary.findFirst({
        where: { metricType: 'TOTAL_STUDENTS' },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.dashboardSummary.findFirst({
        where: { metricType: 'TOTAL_GROUPS' },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.dashboardSummary.findFirst({
        where: { metricType: 'ATTENDANCE_RATE' },
        orderBy: { timestamp: 'desc' },
      }),
      // Historical metrics for trend calculation
      prisma.dashboardSummary.findFirst({
        where: {
          metricType: 'TOTAL_STUDENTS',
          timestamp: { lte: thirtyDaysAgo },
        },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.dashboardSummary.findFirst({
        where: {
          metricType: 'TOTAL_GROUPS',
          timestamp: { lte: thirtyDaysAgo },
        },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    // Get some additional live data that changes frequently
    const [activeCourses, pendingAssessments, studentsWithProgress] = await Promise.all([
      prisma.module.count({ where: { status: 'ACTIVE' } }),
      prisma.assessment.count({
        where: {
          result: null,
          dueDate: { gte: now },
        },
      }),
      prisma.student.findMany({
        where: {
          status: 'ACTIVE',
          group: { status: { notIn: ['ARCHIVED', 'Archived'] } },
        },
        select: { progress: true },
      }),
    ]);

    // Calculate completion rate
    const completedStudents = studentsWithProgress.filter(s => s.progress >= 100).length;
    const completionRate = studentsWithProgress.length > 0
      ? Math.round((completedStudents / studentsWithProgress.length) * 100)
      : 0;

    // Calculate trends
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const totalStudents = totalStudentsMetric?.value || 0;
    const totalGroups = totalGroupsMetric?.value || 0;
    const attendanceRate = Math.round(attendanceRateMetric?.value || 0);

    const stats = {
      totalStudents: {
        value: totalStudents,
        trend: calculateTrend(totalStudents, totalStudentsLastMonth?.value || totalStudents),
      },
      totalGroups: {
        value: totalGroups,
        trend: calculateTrend(totalGroups, totalGroupsLastMonth?.value || totalGroups),
      },
      attendanceRate: {
        value: attendanceRate,
        trend: 0, // Could calculate from historical metrics if needed
      },
      activeCourses: {
        value: activeCourses,
        trend: 0, // Live data, trend not cached
      },
      completionRate: {
        value: completionRate,
        trend: 0, // Could calculate from historical if needed
      },
      pendingAssessments: {
        value: pendingAssessments,
        trend: 0, // Live data, trend not cached
      },
      _cached: true, // Flag to indicate this came from cache
    };

    return stats;
  } catch (error) {
    console.error('Error getting stats from cache:', error);
    return null; // Fall back to live stats
  }
}

/**
 * Get live statistics (slower ~800ms, fallback only)
 */
async function getLiveStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get statistics with trend data
  const [
    totalStudents,
    studentsLastMonth,
    totalGroups,
    groupsLastMonth,
    activeCourses,
    coursesLastMonth,
    pendingAssessments,
    pendingAssessmentsLastMonth,
    allAttendance,
    attendanceLastMonth,
    studentsWithProgress,
    studentsProgressLastMonth,
  ] = await Promise.all([
    // Total students (active, attached to non-archived groups)
    prisma.student.count({
      where: {
        status: { notIn: ['ARCHIVED', 'Archived', 'archived'] },
        group: {
          status: { notIn: ['ARCHIVED', 'Archived', 'archived'] },
        },
      },
    }),
    prisma.student.count({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: thirtyDaysAgo },
        group: {
          status: { notIn: ['ARCHIVED', 'Archived'] },
        },
      },
    }),

    // Total active groups
    prisma.group.count({
      where: {
        status: 'ACTIVE'
      }
    }),
    prisma.group.count({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: thirtyDaysAgo }
      }
    }),

    // Active courses (Modules with status ACTIVE)
    prisma.module.count({ where: { status: 'ACTIVE' } }),
    prisma.module.count({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: thirtyDaysAgo }
      }
    }),

    // Pending assessments (result is null when not yet graded)
    prisma.assessment.count({
      where: {
        result: null,
        dueDate: { gte: now },
      },
    }),
    prisma.assessment.count({
      where: {
        result: null,
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
      where: {
        status: 'ACTIVE',
        group: {
          status: { notIn: ['ARCHIVED', 'Archived'] },
        },
      },
      select: { progress: true, createdAt: true },
    }),
    prisma.student.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: thirtyDaysAgo },
        group: {
          status: { notIn: ['ARCHIVED', 'Archived'] },
        },
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
    _cached: false, // Flag to indicate this is live data
  };

  return successResponse(stats);
}
