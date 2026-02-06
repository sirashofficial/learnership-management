import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

// GET /api/attendance/export - Export attendance data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formatType = searchParams.get('format') || 'csv';
    const groupId = searchParams.get('groupId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!groupId || !startDate || !endDate) {
      return errorResponse('Group ID, start date, and end date are required', 400);
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        groupId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        student: {
          select: {
            studentId: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        session: {
          select: {
            title: true,
            module: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { student: { lastName: 'asc' } }],
    });

    if (formatType === 'csv') {
      // Generate CSV
      const headers = [
        'Date',
        'Student ID',
        'First Name',
        'Last Name',
        'Email',
        'Status',
        'Session',
        'Module',
        'Notes',
        'Marked By',
      ];

      const rows = attendance.map((record: any) => [
        format(new Date(record.date), 'yyyy-MM-dd'),
        record.student.studentId,
        record.student.firstName,
        record.student.lastName,
        record.student.email || '',
        record.status,
        record.session?.title || 'Manual Entry',
        record.session?.module || '',
        record.notes || '',
        record.markedBy || '',
      ]);

      const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="attendance-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
        },
      });
    }

    if (formatType === 'json') {
      // Generate JSON
      const jsonData = attendance.map((record: any) => ({
        date: format(new Date(record.date), 'yyyy-MM-dd'),
        studentId: record.student.studentId,
        firstName: record.student.firstName,
        lastName: record.student.lastName,
        email: record.student.email,
        status: record.status,
        session: record.session?.title || 'Manual Entry',
        module: record.session?.module || '',
        notes: record.notes,
        markedBy: record.markedBy,
      }));

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="attendance-${format(new Date(), 'yyyy-MM-dd')}.json"`,
        },
      });
    }

    return errorResponse('Unsupported format. Use csv or json', 400);
  } catch (error) {
    return handleApiError(error);
  }
}
