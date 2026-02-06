import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

// GET /api/assessments/export - Export assessment results
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formatType = searchParams.get('format') || 'csv';
    const groupId = searchParams.get('groupId');
    const moduleId = searchParams.get('moduleId');
    const result = searchParams.get('result');

    const where: any = {};
    if (groupId) where.student = { groupId };
    if (result) where.result = result;

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        student: {
          select: {
            studentId: true,
            firstName: true,
            lastName: true,
            email: true,
            group: {
              select: {
                name: true,
              },
            },
          },
        },
        unitStandardRef: {
          select: {
            code: true,
            title: true,
          },
        },
      },
      orderBy: [{ student: { lastName: 'asc' } }, { dueDate: 'asc' }],
    });

    if (formatType === 'csv') {
      const headers = [
        'Student ID',
        'First Name',
        'Last Name',
        'Group',
        'Unit Standard',
        'Module',
        'Type',
        'Method',
        'Result',
        'Score',
        'Due Date',
        'Assessed Date',
        'Attempt',
        'Moderation Status',
        'Feedback',
      ];

      const rows = assessments.map((assessment: any) => [
        assessment.student.studentId,
        assessment.student.firstName,
        assessment.student.lastName,
        assessment.student.group?.name || '',
        assessment.unitStandard,
        assessment.module,
        assessment.type,
        assessment.method,
        assessment.result || 'PENDING',
        assessment.score || '',
        format(new Date(assessment.dueDate), 'yyyy-MM-dd'),
        assessment.assessedDate ? format(new Date(assessment.assessedDate), 'yyyy-MM-dd') : '',
        assessment.attemptNumber,
        assessment.moderationStatus,
        assessment.feedback || '',
      ]);

      const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="assessments-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
        },
      });
    }

    if (formatType === 'json') {
      return new NextResponse(JSON.stringify(assessments, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="assessments-${format(new Date(), 'yyyy-MM-dd')}.json"`,
        },
      });
    }

    return errorResponse('Unsupported format', 400);
  } catch (error) {
    return handleApiError(error);
  }
}
