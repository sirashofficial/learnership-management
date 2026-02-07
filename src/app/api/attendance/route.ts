import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

// GET /api/attendance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const studentId = searchParams.get('studentId');
    const groupId = searchParams.get('groupId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    const attendance = await prisma.attendance.findMany({
      where: {
        ...(sessionId && { sessionId }),
        ...(studentId && { studentId }),
        ...(groupId && { groupId }),
        ...(status && { status }),
        ...(date && { date: new Date(date) }),
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            email: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        session: {
          select: {
            id: true,
            title: true,
            module: true,
            date: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return successResponse(attendance);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle bulk attendance submission
    if (body.records && Array.isArray(body.records)) {

      const results = [];
      const errors = [];

      for (const record of body.records) {
        const { studentId, sessionId, groupId, date, status, notes, markedBy, qrCodeScan } = record;



        if (!studentId || !status) {
          console.warn('⚠️ Skipping invalid record - missing studentId or status:', record);
          errors.push({ record, reason: 'Missing studentId or status' });
          continue; // Skip invalid records
        }

        if (!['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(status)) {
          console.warn('⚠️ Skipping invalid status:', status);
          errors.push({ record, reason: `Invalid status: ${status}` });
          continue; // Skip invalid status
        }

        const attendanceDate = date ? new Date(date) : new Date();
        const normalizedGroupId = groupId || null; // FIX: Use null instead of empty string


        try {
          // Check if record exists
          const existingRecord = await prisma.attendance.findFirst({
            where: {
              studentId,
              date: attendanceDate,
              groupId: normalizedGroupId,
            },
          });

          let attendance;
          if (existingRecord) {
            console.log('📝 Updating existing record:', existingRecord.id);
            // Update existing record
            attendance = await prisma.attendance.update({
              where: { id: existingRecord.id },
              data: {
                status,
                notes,
                markedBy,
                markedAt: new Date(),
                qrCodeScan: qrCodeScan || false,
                sessionId: sessionId || null,
              },
            });
          } else {
            console.log('➕ Creating new record');
            // Create new record with explicit student connection
            attendance = await prisma.attendance.create({
              data: {
                student: {
                  connect: { id: studentId }
                },
                session: sessionId ? {
                  connect: { id: sessionId }
                } : undefined,
                groupId: normalizedGroupId,
                status,
                date: attendanceDate,
                notes,
                markedBy,
                markedAt: new Date(),
                qrCodeScan: qrCodeScan || false,
              },
            });
          }

          console.log('✅ Successfully saved attendance record:', attendance.id);
          results.push(attendance);

          // Check if we need to create an alert for absences
          if (status === 'ABSENT') {
            const activePolicy = await prisma.attendancePolicy.findFirst({
              where: { isActive: true },
            });

            if (activePolicy?.notifyOnAbsence) {
              // Check consecutive absences
              const recentAttendance = await prisma.attendance.findMany({
                where: { studentId },
                orderBy: { date: 'desc' },
                take: activePolicy.consecutiveAbsences + 1,
              });

              const consecutiveAbsences = recentAttendance.filter((r) => r.status === 'ABSENT').length;

              if (consecutiveAbsences >= activePolicy.consecutiveAbsences) {
                await prisma.attendanceAlert.create({
                  data: {
                    studentId,
                    type: 'CONSECUTIVE_ABSENCE',
                    severity: 'WARNING',
                    message: `Student has ${consecutiveAbsences} consecutive absences`,
                    details: `Exceeded policy threshold of ${activePolicy.consecutiveAbsences} absences`,
                  },
                });
              }
            }
          }
        } catch (recordError) {
          console.error('❌ Error saving individual record:', recordError);
          errors.push({
            record,
            reason: recordError instanceof Error ? recordError.message : 'Unknown error',
            error: recordError
          });
        }
      }

      console.log('📊 Bulk operation complete:', {
        total: body.records.length,
        successful: results.length,
        failed: errors.length
      });

      if (errors.length > 0) {
        console.warn('⚠️ Some records failed:', errors);
      }

      return successResponse({
        success: results,
        failed: errors,
        summary: {
          total: body.records.length,
          successful: results.length,
          failed: errors.length
        }
      }, `Successfully marked attendance for ${results.length} student(s)${errors.length > 0 ? ` (${errors.length} failed)` : ''}`);
    }

    // Handle single attendance record
    const { studentId, sessionId, groupId, date, status, notes, markedBy, qrCodeScan } = body;

    if (!studentId || !status) {
      return errorResponse('Student ID and status are required', 400);
    }

    if (!['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(status)) {
      return errorResponse('Invalid status', 400);
    }

    const attendanceDate = date ? new Date(date) : new Date();

    // Use findFirst + create/update to handle existing records safely
    const existingEntry = await prisma.attendance.findFirst({
      where: {
        studentId,
        date: attendanceDate,
        groupId: groupId || null,
      }
    });

    let attendance;
    if (existingEntry) {
      attendance = await prisma.attendance.update({
        where: { id: existingEntry.id },
        data: {
          status,
          notes,
          markedBy,
          markedAt: new Date(),
          qrCodeScan: qrCodeScan || false,
          sessionId: sessionId || null,
        },
        include: {
          student: true,
          session: true,
        },
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          studentId,
          sessionId: sessionId || null,
          groupId: groupId || null,
          status,
          date: attendanceDate,
          notes,
          markedBy,
          markedAt: new Date(),
          qrCodeScan: qrCodeScan || false,
        },
        include: {
          student: true,
          session: true,
        },
      });
    }

    // Check if we need to create an alert
    if (status === 'ABSENT') {
      const activePolicy = await prisma.attendancePolicy.findFirst({
        where: { isActive: true },
      });

      if (activePolicy?.notifyOnAbsence) {
        // Check consecutive absences
        const recentAttendance = await prisma.attendance.findMany({
          where: { studentId },
          orderBy: { date: 'desc' },
          take: activePolicy.consecutiveAbsences + 1,
        });

        const consecutiveAbsences = recentAttendance.filter((r) => r.status === 'ABSENT').length;

        if (consecutiveAbsences >= activePolicy.consecutiveAbsences) {
          await prisma.attendanceAlert.create({
            data: {
              studentId,
              type: 'CONSECUTIVE_ABSENCE',
              severity: 'WARNING',
              message: `Student has ${consecutiveAbsences} consecutive absences`,
              details: `Exceeded policy threshold of ${activePolicy.consecutiveAbsences} absences`,
            },
          });
        }
      }
    }

    return successResponse(attendance, 'Attendance marked successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/attendance - Update existing attendance
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, notes, markedBy } = body;

    if (!id || !status) {
      return errorResponse('Attendance ID and status are required', 400);
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        status,
        notes,
        markedBy,
        markedAt: new Date(),
      },
      include: {
        student: true,
        session: true,
      },
    });

    return successResponse(attendance, 'Attendance updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/attendance - Delete attendance record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Attendance ID is required', 400);
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return successResponse(null, 'Attendance deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
