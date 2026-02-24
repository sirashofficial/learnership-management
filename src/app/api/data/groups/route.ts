/**
 * UNIFIED GROUP DATA ENDPOINT
 * Single source of truth for all group data across the app
 * Replaces: /api/groups AND /api/dashboard/summary
 * 
 * Used by:
 * - Groups Page (src/app/groups/page.tsx)
 * - Dashboard (src/app/page.tsx)
 * - Admin Validation (src/app/admin/validation/page.tsx)
 * - GroupsContext (src/contexts/GroupsContext.tsx)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  calculateGroupMetrics,
  calculateMultipleGroupMetrics,
  getGroupProgress,
  getGroupHealthStatus,
  getCurrentAssessmentModule,
} from '@/lib/group-metrics';
import { calculatePerformanceStatus } from '@/lib/statusUtils';
import { PlanStatus } from '@/types/rollout';
import { startOfMonth } from 'date-fns';
import { TOTAL_CREDITS } from '@/lib/constants';

export interface UnifiedGroupData {
  id: string;
  name: string;
  location?: string;
  createdAt: string;
  totalCreditsRequired: number;
  startDate?: string;
  endDate?: string;
  status: string;
  rolloutPlan?: any;
  metrics: {
    avgCreditsPerStudent: number;
    avgProgressPercent: number;
    totalCreditsEarned: number;
    totalUniqueUnitsPassed: number;
    studentCount: number;
    healthStatus: PlanStatus;
    attendanceRate: number;
    totalRecorded?: number;
  };
  facilitatorMetrics?: {
    totalUnits: number;
    facilitatedUnits: number;
    facilitatedPercent: number;
    currentModule: number;
  };
}

export interface UnifiedResponse {
  success: boolean;
  data?: {
    groups: UnifiedGroupData[];
    summary: {
      totalGroups: number;
      totalStudents: number;
      totalCreditsEarned: number;
      averageProgress: number;
    };
    timestamp: string;
  };
  error?: string;
}

/**
 * Calculate total credits required for a group by summing all unit standards rolled out
 */
async function calculateTotalCreditsRequired(groupId: string): Promise<number> {
  const unitStandardRollouts = await prisma.unitStandardRollout.findMany({
    where: { groupId },
    select: {
      unitStandard: {
        select: { credits: true }
      }
    }
  });

  return unitStandardRollouts.reduce((sum, rollout) => {
    return sum + (rollout.unitStandard?.credits || 0);
  }, 0);
}

/**
 * GET /api/data/groups
 * Returns unified group data with consistent metrics
 */
export async function GET(request: NextRequest): Promise<NextResponse<UnifiedResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Fetch all groups
    let groupsQuery = prisma.group.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        createdAt: true,
        startDate: true,
        endDate: true,
        status: true,
        rolloutPlan: true,
        unitStandardRollouts: {
          include: {
            unitStandard: {
              include: {
                module: true
              }
            },
          },
        },
      },
    });

    // If activeOnly is explicitly requested, filter to active groups only
    if (activeOnly) {
      groupsQuery = prisma.group.findMany({
        where: {
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          location: true,
          createdAt: true,
          startDate: true,
          endDate: true,
          status: true,
          rolloutPlan: true,
          unitStandardRollouts: {
            include: {
              unitStandard: {
                include: {
                  module: true
                }
              },
            },
          },
        },
      });
    }

    const groups = await groupsQuery;

    if (groups.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          groups: [],
          summary: {
            totalGroups: 0,
            totalStudents: 0,
            totalCreditsEarned: 0,
            averageProgress: 0,
          },
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Get metrics for all groups in parallel
    const groupIds = groups.map(g => g.id);

    // Calculate total credits required for each group
    const creditsRequiredMap = new Map<string, number>();
    await Promise.all(
      groupIds.map(async (gid) => {
        const credits = await calculateTotalCreditsRequired(gid);
        creditsRequiredMap.set(gid, credits);
      })
    );

    const metricsMap = await calculateMultipleGroupMetrics(
      groupIds,
      TOTAL_CREDITS
    );

    // Get attendance data for all groups for the CURRENT MONTH only
    const startOfCurrentMonth = startOfMonth(new Date());

    const attendanceData = await prisma.attendance.findMany({
      where: {
        groupId: { in: groupIds },
        date: { gte: startOfCurrentMonth },
      },
      select: {
        groupId: true,
        studentId: true,
        status: true,
      },
    });

    // Group attendance by groupId
    const attendanceMap = new Map<string, any[]>();
    attendanceData.forEach(record => {
      const gid = record.groupId || '';
      if (!attendanceMap.has(gid)) attendanceMap.set(gid, []);
      attendanceMap.get(gid)!.push(record);
    });

    // Calculate attendance rate per group
    const groupAttendanceRates = new Map<string, number>();
    for (const [gid, records] of attendanceMap.entries()) {
      // Use shared utility for average per-student attendance rate
      const studentMap = new Map<string, any[]>();
      records.forEach(r => {
        if (!studentMap.has(r.studentId)) studentMap.set(r.studentId, []);
        studentMap.get(r.studentId)!.push(r);
      });

      let subtotalRates = 0;
      studentMap.forEach(studentRecords => {
        const presentCount = studentRecords.filter(r => r.status === 'PRESENT').length;
        const lateCount = studentRecords.filter(r => r.status === 'LATE').length;
        subtotalRates += (studentRecords.length > 0 ? ((presentCount + lateCount) / studentRecords.length) * 100 : 0);
      });

      groupAttendanceRates.set(gid, studentMap.size > 0 ? subtotalRates / studentMap.size : 0);
    }

    // Get total student count across all groups
    const totalStudents = await prisma.student.count({
      where: {
        groupId: {
          in: groupIds,
        },
      },
    });

    // Build unified response
    const unifiedGroups: UnifiedGroupData[] = await Promise.all(groups.map(async (group) => {
      const totalCreditsRequired = creditsRequiredMap.get(group.id) || TOTAL_CREDITS;
      const metrics = metricsMap.get(group.id) || {
        avgCreditsPerStudent: 0,
        avgProgressPercent: 0,
        totalCreditsEarned: 0,
        totalUniqueUnitsPassed: 0,
        studentCount: 0,
      };

      // Recalculate progress based on actual total credits required
      const avgProgressPercent = metrics.studentCount > 0 && totalCreditsRequired > 0
        ? Math.round((metrics.avgCreditsPerStudent / totalCreditsRequired) * 100)
        : 0;

      const attendanceRate = Math.round(groupAttendanceRates.get(group.id) || 0);
      const totalRecorded = (attendanceMap.get(group.id) || []).length;

      // Facilitator-centric: Group is at the highest module ANY student has reached
      const currentAssessmentModule = await getCurrentAssessmentModule(group.id);

      // Facilitator progress summary (Safe access)
      const totalUnits = (group as any).unitStandardRollouts?.length || 0;
      const facilitatedUnits = (group as any).unitStandardRollouts?.filter((r: any) => r.facilitated).length || 0;
      const facilitatedPercent = totalUnits > 0 ? Math.round((facilitatedUnits / totalUnits) * 100) : 0;

      // Get the current facilitated module number (Safe access)
      let facilitatedModuleNum = 0;
      if ((group as any).currentFacilitatedModuleId) {
        const activeRollout = (group as any).unitStandardRollouts?.find((r: any) => r.unitStandard?.module?.id === (group as any).currentFacilitatedModuleId);
        facilitatedModuleNum = activeRollout?.unitStandard?.module?.moduleNumber || 0;
      }

      const facilitatorMetrics = {
        totalUnits,
        facilitatedUnits,
        facilitatedPercent,
        currentModule: facilitatedModuleNum
      };

      // Calculate expected module based on current date vs rollout plan
      const now = new Date();
      let expectedModule = 0;
      const rollouts = group.unitStandardRollouts || [];
      for (const r of rollouts) {
        if (r.startDate && new Date(r.startDate) <= now) {
          const modNum = r.unitStandard?.module?.moduleNumber || 0;
          if (modNum > expectedModule) expectedModule = modNum;
        }
      }

      // Determine date status (COMPLETE if end date passed)
      let dateStatus: PlanStatus = 'ON_TRACK';
      if (group.endDate && new Date(group.endDate) < now) {
        dateStatus = 'COMPLETE';
      } else if (group.startDate && new Date(group.startDate) > now) {
        dateStatus = 'NOT_STARTED';
      }

      // Unify health status calculation
      const healthStatus = calculatePerformanceStatus(
        80, // Projected proxy (not strictly used for badge anymore)
        avgProgressPercent,
        Boolean(rollouts.length),
        attendanceRate,
        currentAssessmentModule,
        expectedModule,
        dateStatus
      );

      return {
        id: group.id,
        name: group.name,
        location: group.location || undefined,
        createdAt: group.createdAt.toISOString(),
        totalCreditsRequired,
        startDate: group.startDate?.toISOString(),
        endDate: group.endDate?.toISOString(),
        status: group.status,
        // Don't include rolloutPlan and unitStandardRollouts to avoid serialization issues unnecessarily
        rolloutPlan: null,
        unitStandardRollouts: [],
        currentAssessmentModule: currentAssessmentModule || 0,
        metrics: {
          avgCreditsPerStudent: metrics.avgCreditsPerStudent,
          avgProgressPercent,
          totalCreditsEarned: metrics.totalCreditsEarned,
          totalUniqueUnitsPassed: metrics.totalUniqueUnitsPassed,
          studentCount: metrics.studentCount,
          atRiskCount: (metrics as any).atRiskCount ?? 0,
          healthStatus,
          attendanceRate,
          totalRecorded,
        },
        facilitatorMetrics,
      };
    }));

    // Calculate summary
    const totalCreditsEarned = unifiedGroups.reduce(
      (sum, g) => sum + g.metrics.totalCreditsEarned,
      0
    );

    const totalStudentsWithCredits = unifiedGroups.reduce(
      (sum, g) => sum + g.metrics.studentCount,
      0
    );

    const averageProgress = totalStudentsWithCredits > 0
      ? Math.round(
        unifiedGroups.reduce(
          (sum, g) => sum + g.metrics.avgProgressPercent * g.metrics.studentCount,
          0
        ) / totalStudentsWithCredits
      )
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        groups: unifiedGroups,
        summary: {
          totalGroups: unifiedGroups.length,
          totalStudents,
          totalCreditsEarned,
          averageProgress,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in unified groups endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch group data',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/data/groups/{groupId}
 * Returns unified data for a specific group, including all student progress
 */
export async function GET_BY_ID(groupId: string): Promise<UnifiedGroupData | null> {
  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        location: true,
        createdAt: true,
        startDate: true,
        endDate: true,
        status: true,
        rolloutPlan: true,
        unitStandardRollouts: {
          include: {
            unitStandard: true,
          },
        },
      },
    });

    if (!group) {
      return null;
    }

    const totalCreditsRequired = await calculateTotalCreditsRequired(groupId);
    const metrics = await calculateGroupMetrics(groupId, totalCreditsRequired);

    // Recalculate progress based on actual total credits required
    const avgProgressPercent = metrics.studentCount > 0 && totalCreditsRequired > 0
      ? Math.round((metrics.avgCreditsPerStudent / totalCreditsRequired) * 100)
      : 0;

    const healthStatus = getGroupHealthStatus({
      ...metrics,
      totalCreditsRequired,
      avgProgressPercent,
    });

    // Fetch attendance for this group for the CURRENT MONTH only
    const startOfCurrentMonth = startOfMonth(new Date());

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        groupId,
        date: { gte: startOfCurrentMonth }
      },
      select: { studentId: true, status: true },
    });

    const studentMap = new Map<string, any[]>();
    attendanceRecords.forEach(r => {
      if (!studentMap.has(r.studentId)) studentMap.set(r.studentId, []);
      studentMap.get(r.studentId)!.push(r);
    });

    let subtotalRates = 0;
    studentMap.forEach(studentRecords => {
      const presentCount = studentRecords.filter(r => r.status === 'PRESENT').length;
      const lateCount = studentRecords.filter(r => r.status === 'LATE').length;
      subtotalRates += (studentRecords.length > 0 ? ((presentCount + lateCount) / studentRecords.length) * 100 : 0);
    });

    const attendanceRate = studentMap.size > 0 ? subtotalRates / studentMap.size : 0;

    return {
      id: group.id,
      name: group.name,
      location: group.location || undefined,
      createdAt: group.createdAt.toISOString(),
      totalCreditsRequired,
      startDate: group.startDate?.toISOString(),
      endDate: group.endDate?.toISOString(),
      status: group.status,
      rolloutPlan: group.rolloutPlan,
      metrics: {
        avgCreditsPerStudent: metrics.avgCreditsPerStudent,
        avgProgressPercent,
        totalCreditsEarned: metrics.totalCreditsEarned,
        totalUniqueUnitsPassed: metrics.totalUniqueUnitsPassed,
        studentCount: metrics.studentCount,
        healthStatus,
        attendanceRate: Math.round(attendanceRate),
      },
    };
  } catch (error) {
    console.error(`Error fetching unified data for group ${groupId}:`, error);
    return null;
  }
}
