import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';
import { addMinutes } from 'date-fns';

// POST /api/attendance/bulk - Mark attendance for multiple students
// Supports two body formats:
//   1. Per-student: { records: [{ studentId, groupId, date, status, notes }], sessionType }
//   2. Same-status: { studentIds, sessionId, groupId, date, status, markedBy, notes }
export async function POST(request: NextRequest) {
  // Extract authenticated user (best-effort — bulk also works unauthenticated)
  let authUserId = 'system';
  try {
    const authResult = await requireAuth(request);
    if (!(authResult instanceof NextResponse)) authUserId = (authResult as any).userId ?? 'system';
  } catch {}
  try {
    const body = await request.json();

    // --- Format 1: per-student records from BulkAttendanceModal ---
    if (Array.isArray(body.records)) {
      const { records, sessionType } = body as {
        records: { studentId: string; groupId?: string; date: string; status: string; notes?: string | null }[];
        sessionType?: string;
      };

      if (records.length === 0) return errorResponse('No records provided', 400);

      const savedRecords: any[] = [];
      const previousStates: any[] = [];

      for (const rec of records) {
        const attendanceDate = new Date(rec.date);
        const existing = await prisma.attendance.findFirst({
          where: { studentId: rec.studentId, date: attendanceDate, groupId: rec.groupId ?? null },
        });

        if (existing) {
          previousStates.push({
            id: existing.id,
            existed: true,
            status: existing.status,
            notes: existing.notes,
          });
          const updated = await prisma.attendance.update({
            where: { id: existing.id },
            data: {
              status: rec.status,
              notes: rec.notes ?? null,
              markedAt: new Date(),
            },
          });
          savedRecords.push(updated);
        } else {
          const created = await prisma.attendance.create({
            data: {
              studentId: rec.studentId,
              groupId: rec.groupId ?? null,
              date: attendanceDate,
              status: rec.status,
              notes: rec.notes ?? null,
              markedAt: new Date(),
            },
          });
          previousStates.push({ id: created.id, existed: false, status: null, notes: null });
          savedRecords.push(created);
        }
      }

      // Create undo record (30 min window)
      let undoId: string | undefined;
      try {
        const undo = await prisma.undoHistory.create({
          data: {
            userId: authUserId,
            action: 'BULK_ATTENDANCE',
            entityType: 'Attendance',
            entityIds: JSON.stringify(savedRecords.map((r) => r.id)),
            previousState: JSON.stringify(previousStates),
            newState: JSON.stringify(savedRecords.map((r) => ({ id: r.id, status: r.status, notes: r.notes }))),
            description: `Bulk attendance for ${savedRecords.length} students`,
            canUndo: true,
            expiresAt: addMinutes(new Date(), 30),
          },
        });
        undoId = undo.id;
      } catch {}

      return successResponse(
        { count: savedRecords.length, undoId },
        `Marked attendance for ${savedRecords.length} students`
      );
    }

    // --- Format 2: legacy same-status format ---
    const { studentIds, sessionId, groupId, date, status, markedBy, notes } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return errorResponse('Student IDs are required', 400);
    }
    if (!status || !['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(status)) {
      return errorResponse('Valid status is required', 400);
    }

    const attendanceDate = date ? new Date(date) : new Date();

    const attendanceRecords = await Promise.all(
      studentIds.map(async (studentId: string) => {
        const existing = await prisma.attendance.findFirst({
          where: { studentId, date: attendanceDate, groupId: groupId || null },
        });

        if (existing) {
          return prisma.attendance.update({
            where: { id: existing.id },
            data: { status, markedBy, markedAt: new Date(), notes, sessionId: sessionId || null },
          });
        }

        return prisma.attendance.create({
          data: {
            studentId,
            sessionId: sessionId || null,
            groupId: groupId || null,
            status,
            date: attendanceDate,
            markedBy,
            markedAt: new Date(),
            notes,
          },
        });
      })
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
