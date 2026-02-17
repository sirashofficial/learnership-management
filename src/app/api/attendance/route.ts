
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';

// GET /api/attendance
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;
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
  console.log('🔵 [ATTENDANCE POST] Handler called - method:', request.method);
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    console.log('🔵 [ATTENDANCE POST] Parsed body, records count:', body.records?.length);
    
    // Handle bulk attendance submission
    if (body.records && Array.isArray(body.records)) {
      console.log('📥 Received bulk attendance records:', body.records.length);
      const results = [];
      const errors = [];
      
      for (const record of body.records) {
        try {
          const { studentId, sessionId, groupId, date, status, notes, markedBy, qrCodeScan } = record;

          console.log('🔄 Processing record:', { studentId, groupId, status, date });

          // Validate required fields
          if (!studentId || !status) {
            console.warn('⚠️ Skipping invalid record - missing studentId or status:', record);
            errors.push({ record, error: 'Missing studentId or status' });
            continue;
          }

          // Validate status values
          if (!['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(status)) {
            console.warn('⚠️ Skipping invalid status:', status);
            errors.push({ record, error: `Invalid status: ${status}` });
            continue;
          }

          // Ensure date is valid
          const attendanceDate = date ? new Date(date) : new Date();
          
          // Check if student exists - try both UUID and studentId string
          let student = await prisma.student.findUnique({ where: { id: studentId } })
            .catch(() => null);
          
          if (!student) {
            // Try finding by studentId string (e.g., "2026-CL-001")
            student = await prisma.student.findUnique({ where: { studentId } })
              .catch(() => null);
          }

          if (!student) {
            console.warn('⚠️ Student not found:', studentId);
            errors.push({ record, error: `Student not found: ${studentId}` });
            continue;
          }

          // Use groupId from student if not provided
          const finalGroupId = groupId || student.groupId;
          if (!finalGroupId) {
            console.warn('⚠️ No group ID available for student:', studentId);
            errors.push({ record, error: 'No group available' });
            continue;
          }

          // Create or update attendance using student's UUID
          const attendance = await prisma.attendance.upsert({
            where: {
              studentId_date_groupId: {
                studentId: student.id,
                date: attendanceDate,
                groupId: finalGroupId
              }
            },
            create: {
              studentId: student.id,
              sessionId: sessionId || null,
              groupId: finalGroupId,
              date: attendanceDate,
              status,
              notes: notes || null,
              markedBy: markedBy || null,
              markedAt: new Date(),
              qrCodeScan: qrCodeScan || false
            },
            update: {
              status,
              notes: notes || undefined,
              markedBy: markedBy || undefined,
              markedAt: new Date(),
              qrCodeScan: qrCodeScan || false,
              sessionId: sessionId || null
            }
          });

          results.push(attendance);
          console.log('✅ Successfully saved attendance for:', student.studentId);

          // Check if we need to create an alert for absences
          if (status === 'ABSENT') {
            const activePolicy = await prisma.attendancePolicy.findFirst({
              where: { isActive: true },
            });

            if (activePolicy?.notifyOnAbsence) {
              const recentAttendance = await prisma.attendance.findMany({
                where: { studentId: student.id },
                orderBy: { date: 'desc' },
                take: activePolicy.consecutiveAbsences + 1,
              });

              const consecutiveAbsences = recentAttendance.filter((r) => r.status === 'ABSENT').length;

              if (consecutiveAbsences >= activePolicy.consecutiveAbsences) {
                await prisma.attendanceAlert.create({
                  data: {
                    studentId: student.id,
                    type: 'CONSECUTIVE_ABSENCE',
                    severity: 'WARNING',
                    message: `Student has ${consecutiveAbsences} consecutive absences`,
                    details: `Exceeded policy threshold of ${activePolicy.consecutiveAbsences} absences`,
                  },
                }).catch(() => null); // Ignore if alert already exists
              }
            }
          }
        } catch (recordError) {
          console.error('❌ Error processing record:', recordError);
          errors.push({ 
            record, 
            error: recordError instanceof Error ? recordError.message : 'Unknown error'
          });
        }
      }

      console.log(`✅ Processed ${results.length} records, ${errors.length} errors`);
      
      if (errors.length > 0) {
        console.warn('⚠️ Errors encountered:', errors);
      }

      // Return in format expected by frontend
      return successResponse({
        success: results,
        failed: errors,
        summary: {
          total: body.records.length,
          successful: results.length,
          failed: errors.length
        }
      }, errors.length === 0 ? 'All attendance saved successfully' : `Saved ${results.length}, failed ${errors.length}`);
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

    // Find student by UUID or studentId string
    let student = await prisma.student.findUnique({ where: { id: studentId } })
      .catch(() => null);
    
    if (!student) {
      student = await prisma.student.findUnique({ where: { studentId } })
        .catch(() => null);
    }

    if (!student) {
      return errorResponse(`Student not found: ${studentId}`, 404);
    }

    // Use upsert to handle existing records
    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_date_groupId: {
          studentId: student.id,
          date: attendanceDate,
          groupId: groupId || student.groupId || null,
        },
      },
      update: {
        status,
        notes,
        markedBy,
        markedAt: new Date(),
        qrCodeScan: qrCodeScan || false,
        sessionId: sessionId || null,
      },
      create: {
        studentId: student.id,
        sessionId: sessionId || null,
        groupId: groupId || student.groupId || null,
        status,
        date: attendanceDate,
        notes,
        markedBy,
        markedAt: new Date(),
        qrCodeScan: qrCodeScan || false,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
          },
        },
        session: {
          select: {
            id: true,
            title: true,
            module: true,
          },
        },
      },
    });

    // Check if we need to create an alert
    if (status === 'ABSENT') {
      const activePolicy = await prisma.attendancePolicy.findFirst({
        where: { isActive: true },
      });

      if (activePolicy?.notifyOnAbsence) {
        const recentAttendance = await prisma.attendance.findMany({
          where: { studentId: student.id },
          orderBy: { date: 'desc' },
          take: activePolicy.consecutiveAbsences + 1,
        });

        const consecutiveAbsences = recentAttendance.filter((r) => r.status === 'ABSENT').length;

        if (consecutiveAbsences >= activePolicy.consecutiveAbsences) {
          await prisma.attendanceAlert.create({
            data: {
              studentId: student.id,
              type: 'CONSECUTIVE_ABSENCE',
              severity: 'WARNING',
              message: `Student has ${consecutiveAbsences} consecutive absences`,
              details: `Exceeded policy threshold of ${activePolicy.consecutiveAbsences} absences`,
            },
          }).catch(() => null);
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
    const { error } = await requireAuth(request);
    if (error) return error;

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
    const { error } = await requireAuth(request);
    if (error) return error;

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
