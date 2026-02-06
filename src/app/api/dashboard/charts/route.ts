/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '30'; // days: 7, 30, 90, all
    
    const now = new Date();
    const daysAgo = timeRange === 'all' ? 365 : parseInt(timeRange);
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // 1. Attendance Trend Chart Data
    const attendanceData = await prisma.attendance.findMany({
      where: {
        date: { gte: startDate },
      },
      select: {
        date: true,
        status: true,
      },
      orderBy: { date: 'asc' },
    });

    // Group by date and calculate rates
    const attendanceByDate = new Map<string, { present: number; total: number }>();
    attendanceData.forEach((record: any) => {
      const dateKey = record.date.toISOString().split('T')[0];
      const current = attendanceByDate.get(dateKey) || { present: 0, total: 0 };
      current.total++;
      if (record.status === 'PRESENT' || record.status === 'LATE') {
        current.present++;
      }
      attendanceByDate.set(dateKey, current);
    });

    const attendanceTrend = Array.from(attendanceByDate.entries())
      .map(([date, data]) => ({
        date,
        rate: Math.round((data.present / data.total) * 100),
        present: data.present,
        total: data.total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 2. Group Distribution Chart Data (Pie Chart)
    const groupsWithCounts = await prisma.group.findMany({
      where: { status: 'ACTIVE' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { students: true },
        },
      },
    });

    const groupDistribution = groupsWithCounts.map((group: any) => ({
      id: group.id,
      name: group.name,
      companyName: group.company?.name || 'No Company',
      studentCount: group._count.students,
      percentage: 0, // Will calculate after getting total
    }));

    const totalStudentsInGroups = groupDistribution.reduce((sum: number, g: any) => sum + g.studentCount, 0);
    groupDistribution.forEach((group: any) => {
      group.percentage = totalStudentsInGroups > 0 
        ? Math.round((group.studentCount / totalStudentsInGroups) * 100)
        : 0;
    });

    // 3. Course Progress Chart Data (Bar Chart)
    const modules = await prisma.module.findMany({
      where: {
        status: { in: ['IN_PROGRESS', 'COMPLETED'] },
      },
      include: {
        progress: {
          include: {
            student: true,
          },
          where: {
            student: {
              status: 'ACTIVE',
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    const courseProgress = modules.map((module: any) => {
      const studentProgress = module.progress;
      const totalStudents = studentProgress.length;
      
      if (totalStudents === 0) {
        return {
          id: module.id,
          name: module.name,
          code: module.code,
          completionRate: 0,
          studentsCompleted: 0,
          totalStudents: 0,
          avgProgress: 0,
        };
      }

      const completedStudents = studentProgress.filter((p: any) => p.status === 'COMPLETED').length;
      const avgProgress = Math.round(
        studentProgress.reduce((sum: number, p: any) => sum + p.progress, 0) / totalStudents
      );

      return {
        id: module.id,
        name: module.name,
        code: module.code,
        completionRate: Math.round((completedStudents / totalStudents) * 100),
        studentsCompleted: completedStudents,
        totalStudents,
        avgProgress,
      };
    });

    return successResponse({
      attendanceTrend,
      groupDistribution,
      courseProgress,
      timeRange: daysAgo,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
