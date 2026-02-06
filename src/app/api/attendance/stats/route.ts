import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';

export const dynamic = 'force-dynamic';

// GET /api/attendance/stats - Get attendance statistics and analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const groupId = searchParams.get('groupId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate && endDate
      ? {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }
      : {};

    if (studentId) {
      // Individual student stats
      const records = await prisma.attendance.findMany({
        where: {
          studentId,
          ...dateFilter,
        },
      });

      const total = records.length;
      const present = records.filter((r) => r.status === 'PRESENT').length;
      const late = records.filter((r) => r.status === 'LATE').length;
      const absent = records.filter((r: any) => r.status === 'ABSENT').length;
      const excused = records.filter((r: any) => r.status === 'EXCUSED').length;

      const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;

      // Check consecutive absences
      const sortedRecords = records.sort(
        (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      let consecutiveAbsences = 0;
      let maxConsecutiveAbsences = 0;
      let currentStreak = 0;

      for (const record of sortedRecords) {
        if (record.status === 'ABSENT') {
          currentStreak++;
          maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, currentStreak);
        } else if (record.status === 'PRESENT' || record.status === 'LATE') {
          currentStreak = 0;
        }
      }

      // Check if currently on absence streak
      const recentRecords = sortedRecords.slice(-5);
      for (let i = recentRecords.length - 1; i >= 0; i--) {
        if (recentRecords[i].status === 'ABSENT') {
          consecutiveAbsences++;
        } else if (recentRecords[i].status === 'PRESENT' || recentRecords[i].status === 'LATE') {
          break;
        }
      }

      return successResponse({
        total,
        present,
        late,
        absent,
        excused,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        consecutiveAbsences,
        maxConsecutiveAbsences,
      });
    }

    if (groupId) {
      // Group stats
      const records = await prisma.attendance.findMany({
        where: {
          groupId,
          ...dateFilter,
        },
        include: {
          student: true,
        },
      });

      const studentIds = [...new Set(records.map((r: any) => r.studentId))];
      const total = records.length;
      const present = records.filter((r: any) => r.status === 'PRESENT').length;
      const late = records.filter((r: any) => r.status === 'LATE').length;
      const absent = records.filter((r: any) => r.status === 'ABSENT').length;
      const excused = records.filter((r: any) => r.status === 'EXCUSED').length;

      const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;

      // Get daily attendance trends
      const dailyStats = records.reduce((acc: any, record: any) => {
        const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
        if (!acc[dateKey]) {
          acc[dateKey] = { present: 0, late: 0, absent: 0, excused: 0, date: dateKey };
        }
        acc[dateKey][record.status.toLowerCase()]++;
        return acc;
      }, {});

      return successResponse({
        totalRecords: total,
        totalStudents: studentIds.length,
        present,
        late,
        absent,
        excused,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        dailyTrends: Object.values(dailyStats),
      });
    }

    return errorResponse('Student ID or Group ID is required', 400);
  } catch (error) {
    return handleApiError(error);
  }
}
