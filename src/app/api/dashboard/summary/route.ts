import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';
import {
  calculateGroupMetrics,
  calculateAttendanceRate,
} from '@/lib/calculations/unifiedMetrics';
import { TOTAL_CREDITS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

async function getSummaryHandler(request: NextRequest) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    /**
     * UNIFIED METRICS: Use the unified calculation engine instead of
     * pre-calculated Student fields to ensure consistency with Groups page.
     * 
     * All metrics are calculated from actual COMPETENT assessments using
     * standardized Prisma queries - this is the source of truth.
     */

    // Get all groups
    const groups = await prisma.group.findMany({
      select: { id: true }
    });
    const groupIds = groups.map(g => g.id);

    // Get system-wide student and assessment count
    const [
      totalStudents,
      totalGroups,
      activeStudents,
      atRiskStudents,
      completedStudents,
      pendingAssessments,
      completedAssessments,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.group.count(),
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.student.count({ where: { status: 'AT_RISK' } }),
      prisma.student.count({ where: { status: 'COMPLETED' } }),
      prisma.assessment.count({ where: { result: null } }),
      prisma.assessment.count({ where: { result: 'COMPETENT' } }),
    ]);

    // Calculate unified metrics across all groups
    let totalCreditsEarned = 0;
    let totalStudentsWithMetrics = 0;
    let summedProgress = 0;
    let totalGroupCount = 0;

    if (groupIds.length > 0) {
      const metricsPromises = groupIds.map(groupId =>
        calculateGroupMetrics(groupId, TOTAL_CREDITS)
      );
      const allMetrics = await Promise.all(metricsPromises);

      for (const metrics of allMetrics) {
        totalCreditsEarned += metrics.totalCreditsEarned;
        totalStudentsWithMetrics += metrics.studentCount;
        summedProgress += metrics.avgProgressPercent * metrics.studentCount;
        if (metrics.studentCount > 0) {
          totalGroupCount += 1;
        }
      }
    }

    // Calculate system-wide average progress
    const averageProgress = totalStudentsWithMetrics > 0
      ? Math.round(summedProgress / totalStudentsWithMetrics)
      : 0;

    // Calculate overall attendance rate for current month
    const attendanceMetrics = await calculateAttendanceRate(
      'system',  // Placeholder for system-wide (not a real entityId)
      'GROUP'
    );

    const summary = {
      totalStudents,
      totalGroups,
      activeStudents,
      atRiskStudents,
      completedStudents,
      averageProgress,           // Calculated from unified metrics
      totalCredits: totalCreditsEarned,  // From unified metrics (actual assessments)
      pendingAssessments,
      completedAssessments,
      attendanceRate: 0,         // Placeholder - would need different calculation
      _debug: {
        message: 'Metrics calculated using unified calculation engine for consistency'
      }
    };

    return successResponse(summary);
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return handleApiError(error);
  }
}

export const GET = withAuth(withRateLimit(getSummaryHandler, 'generous'), ['ADMIN', 'FACILITATOR']);
