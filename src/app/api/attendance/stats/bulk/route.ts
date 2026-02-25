/**
 * Bulk Attendance Stats Endpoint
 * 
 * Returns attendance statistics for multiple groups/students in a single request.
 * Reduces N+1 query problem from 25 requests to 1 request.
 * 
 * POST /api/attendance/stats/bulk
 * Body: {
 *   groupIds?: string[]
 *   studentIds?: string[]
 *   startDate: string (yyyy-MM-dd)
 *   endDate: string (yyyy-MM-dd)
 * }
 * 
 * Returns: {
 *   [id: string]: {
 *     attendanceRate: number
 *     totalSessions: number
 *     present: number
 *     absent: number
 *     late: number
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateGroupAttendance } from '@/lib/calculateAttendance';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';
import { successResponse, handleApiError } from '@/lib/api-utils';

interface BulkStatsRequest {
  groupIds?: string[];
  studentIds?: string[];
  startDate: string;
  endDate: string;
}

interface AttendanceStats {
  attendanceRate: number;
  totalRecords: number;
  present: number;
  absent: number;
  late: number;
}

async function handlePost(req: NextRequest) {
  try {
    const body: BulkStatsRequest = await req.json();
    const { groupIds = [], studentIds = [], startDate, endDate } = body;

    if (groupIds.length === 0 && studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Must provide groupIds or studentIds' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const results: Record<string, AttendanceStats> = {};

    // Process group stats in parallel
    if (groupIds.length > 0) {
      // Fetch all attendance records for all groups in a single query
      const allRecords = await prisma.attendance.findMany({
        where: {
          groupId: { in: groupIds },
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        select: {
          id: true,
          groupId: true,
          studentId: true,
          status: true,
          date: true,
        },
      });

      // Group records by groupId
      const recordsByGroup: Record<string, any[]> = {};
      allRecords.forEach((record) => {
        const gId = record.groupId;
        if (!gId) return;
        if (!recordsByGroup[gId]) {
          recordsByGroup[gId] = [];
        }
        recordsByGroup[gId].push(record);
      });

      // Calculate stats for each group
      groupIds.forEach((groupId) => {
        const records = recordsByGroup[groupId] || [];
        
        if (records.length === 0) {
          results[groupId] = {
            attendanceRate: 0,
            totalRecords: 0,
            present: 0,
            absent: 0,
            late: 0,
          };
          return;
        }

        // Use shared calculation function for consistency
        const stats = calculateGroupAttendance(
          records.map((r: any) => ({
            studentId: r.studentId,
            status: r.status as 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED',
            date: r.date,
          }))
        );

        results[groupId] = {
          attendanceRate: stats.attendanceRate,
          totalRecords: stats.totalRecords,
          present: stats.present,
          absent: stats.absent,
          late: stats.late,
        };
      });
    }

    // Process student stats in parallel
    if (studentIds.length > 0) {
      // Fetch all attendance records for all students in a single query
      const allRecords = await prisma.attendance.findMany({
        where: {
          studentId: { in: studentIds },
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        select: {
          id: true,
          studentId: true,
          status: true,
          date: true,
        },
      });

      // Group records by studentId
      const recordsByStudent: Record<string, any[]> = {};
      allRecords.forEach((record) => {
        if (!recordsByStudent[record.studentId]) {
          recordsByStudent[record.studentId] = [];
        }
        recordsByStudent[record.studentId].push(record);
      });

      // Calculate stats for each student
      studentIds.forEach((studentId) => {
        const records = recordsByStudent[studentId] || [];
        
        if (records.length === 0) {
          results[studentId] = {
            attendanceRate: 0,
            totalRecords: 0,
            present: 0,
            absent: 0,
            late: 0,
          };
          return;
        }

        const total = records.length;
        const present = records.filter((r: any) => r.status === 'PRESENT').length;
        const late = records.filter((r: any) => r.status === 'LATE').length;
        const absent = records.filter((r: any) => r.status === 'ABSENT').length;

        const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

        results[studentId] = {
          attendanceRate,
          totalRecords: total,
          present,
          absent,
          late,
        };
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Bulk stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bulk statistics' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(withRateLimit(handlePost, 'moderate'), ['ADMIN', 'FACILITATOR']);
