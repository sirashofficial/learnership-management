import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

// POST /api/attendance/bulk - Mark attendance for multiple students
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentIds, sessionId, groupId, date, status, markedBy, notes } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return errorResponse('Student IDs are required', 400);
    }

    if (!status || !['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(status)) {
      return errorResponse('Valid status is required', 400);
    }

    const attendanceDate = date ? new Date(date) : new Date();

    // Create attendance records for all students
    const attendanceRecords = await Promise.all(
      studentIds.map((studentId: string) =>
        prisma.attendance.upsert({
          where: {
            studentId_sessionId: {
              studentId,
              sessionId: sessionId || 'MANUAL',
            },
          },
          update: {
            status,
            markedBy,
            markedAt: new Date(),
            notes,
            date: attendanceDate,
          },
          create: {
            studentId,
            sessionId: sessionId || 'MANUAL',
            groupId,
            status,
            date: attendanceDate,
            markedBy,
            markedAt: new Date(),
            notes,
          },
        })
      )
    );

    return successResponse(attendanceRecords, `Marked ${attendanceRecords.length} students as ${status}`);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/attendance/bulk - Copy attendance from a previous session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceDate, targetDate, groupId } = body;

    if (!sourceDate || !targetDate || !groupId) {
      return errorResponse('Source date, target date, and group ID are required', 400);
    }

    // Get attendance from source date
    const sourceAttendance = await prisma.attendance.findMany({
      where: {
        groupId,
        date: new Date(sourceDate),
      },
    });

    if (sourceAttendance.length === 0) {
      return errorResponse('No attendance records found for the source date', 404);
    }

    // Create new attendance records for target date
    const copiedRecords = await Promise.all(
      sourceAttendance.map((record) =>
        prisma.attendance.create({
          data: {
            studentId: record.studentId,
            sessionId: record.sessionId,
            groupId: record.groupId,
            status: record.status,
            date: new Date(targetDate),
            notes: `Copied from ${new Date(sourceDate).toLocaleDateString()}`,
            markedAt: new Date(),
          },
        })
      )
    );

    return successResponse(copiedRecords, `Copied ${copiedRecords.length} attendance records`);
  } catch (error) {
    return handleApiError(error);
  }
}
