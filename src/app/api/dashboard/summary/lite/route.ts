import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/summary/lite
 * 
 * Ultra-lightweight dashboard summary - returns only 10 key metrics
 * using aggregate queries instead of loading records.
 * 
 * Performance: Typically under 200ms (using indexes on Student.status, progress)
 */
async function getLiteSummaryHandler(request: NextRequest) {
  try {
    // Use aggregate queries instead of loading all records
    const [
      totalStudents,
      totalGroups,
      activeStudents,
      atRiskStudents,
      completedStudents,
      progressAggregate,
      creditsAggregate,
      pendingAssessments,
      completedAssessments,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.group.count(),
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.student.count({ where: { status: 'AT_RISK' } }),
      prisma.student.count({ where: { status: 'COMPLETED' } }),
      prisma.student.aggregate({
        _avg: { progress: true },
      }),
      prisma.student.aggregate({
        _sum: { totalCreditsEarned: true },
      }),
      prisma.assessment.count({ where: { result: null } }),
      prisma.assessment.count({ where: { result: 'COMPETENT' } }),
    ]);

    const summary = {
      totalStudents,
      totalGroups,
      activeStudents,
      atRiskStudents,
      completedStudents,
      averageProgress: Math.round(progressAggregate._avg.progress ?? 0),
      totalCredits: creditsAggregate._sum.totalCreditsEarned ?? 0,
      pendingAssessments,
      completedAssessments,
      attendanceRate: 0, // Placeholder for now
    };

    return successResponse(summary);
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return handleApiError(error);
  }
}

export const GET = withAuth(withRateLimit(getLiteSummaryHandler, 'generous'), ['ADMIN', 'FACILITATOR']);
