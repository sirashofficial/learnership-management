import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

// GET /api/attendance/history - Get attendance history with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const groupId = searchParams.get('groupId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period'); // 'today', 'week', 'month'
    const status = searchParams.get('status');

    let dateFilter = {};

    if (period) {
      const now = new Date();
      switch (period) {
        case 'today':
          dateFilter = { date: { gte: startOfDay(now), lte: endOfDay(now) } };
          break;
        case 'week':
          dateFilter = { date: { gte: startOfWeek(now), lte: endOfWeek(now) } };
          break;
        case 'month':
          dateFilter = { date: { gte: startOfMonth(now), lte: endOfMonth(now) } };
          break;
      }
    } else if (startDate && endDate) {
      dateFilter = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(groupId && { groupId }),
        ...(status && { status }),
        ...dateFilter,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
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
