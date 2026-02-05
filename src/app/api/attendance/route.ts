import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { markAttendanceSchema } from '@/lib/validations';

// GET /api/attendance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const studentId = searchParams.get('studentId');
    const date = searchParams.get('date');

    const attendance = await prisma.attendance.findMany({
      where: {
        ...(sessionId && { sessionId }),
        ...(studentId && { studentId }),
        ...(date && { date: new Date(date) }),
      },
      include: {
        student: true,
        session: {
          include: { group: true },
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
    const validatedData = markAttendanceSchema.parse(body);

    const attendance = await prisma.attendance.create({
      data: {
        ...validatedData,
        date: new Date(),
      },
      include: {
        student: true,
        session: true,
      },
    });

    return successResponse(attendance, 'Attendance marked successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
