import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Get various statistics for the dashboard
    const [
      totalStudents,
      totalGroups,
      pendingAssessments,
      recentAttendance,
      atRiskStudents,
    ] = await Promise.all([
      // Total students
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      
      // Total active groups
      prisma.group.count({ where: { status: 'Active' } }),
      
      // Pending assessments
      prisma.assessment.count({
        where: {
          result: null,
          dueDate: { gte: new Date() },
        },
      }),
      
      // Recent attendance (last 7 days)
      prisma.attendance.findMany({
        where: {
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          student: true,
          session: { include: { group: true } },
        },
        take: 5,
        orderBy: { date: 'desc' },
      }),
      
      // Students at risk (progress < 50%)
      prisma.student.findMany({
        where: {
          status: 'ACTIVE',
          progress: { lt: 50 },
        },
        include: { group: true },
        take: 5,
      }),
    ]);

    // Calculate average progress
    const studentsWithProgress = await prisma.student.findMany({
      where: { status: 'ACTIVE' },
      select: { progress: true },
    });

    const avgProgress = studentsWithProgress.length > 0
      ? Math.round(
          studentsWithProgress.reduce((sum: number, s: any) => sum + s.progress, 0) /
            studentsWithProgress.length
        )
      : 0;

    const stats = {
      totalStudents,
      totalGroups,
      totalSites: totalGroups, // Keep for backward compatibility
      pendingAssessments,
      avgProgress,
      recentAttendance,
      atRiskStudents,
    };

    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
