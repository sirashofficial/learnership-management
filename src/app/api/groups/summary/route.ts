import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    // Get all groups with student counts and summaries
    const groups = await prisma.group.findMany({
      include: {
        _count: { select: { students: true } },
        students: {
          select: {
            progress: true,
            totalCreditsEarned: true,
            status: true,
          },
        },
        Company: {
          select: { name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Transform data to include calculated summaries
    const groupSummaries = groups.map((group) => {
      const studentCount = group._count.students;
      const students = group.students;

      // Calculate averages and sums
      const totalProgress = students.reduce((sum, s) => sum + (s.progress || 0), 0);
      const averageProgress = studentCount > 0 ? Math.round(totalProgress / studentCount) : 0;

      const totalCredits = students.reduce((sum, s) => sum + (s.totalCreditsEarned || 0), 0);

      const atRiskCount = students.filter((s) => s.status === 'AT_RISK').length;

      return {
        id: group.id,
        name: group.name,
        companyName: group.Company?.name || 'N/A',
        studentCount,
        averageProgress,
        totalCredits,
        atRiskCount,
        status: group.status,
      };
    });

    return successResponse(groupSummaries);
  } catch (error) {
    console.error('Groups summary error:', error);
    return handleApiError(error);
  }
}
