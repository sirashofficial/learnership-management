import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

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
