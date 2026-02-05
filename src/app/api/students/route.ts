import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { createStudentSchema, updateStudentSchema } from '@/lib/validations';

// GET /api/students - Get all students or export CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status');
    const format = searchParams.get('format'); // csv or json

    const students = await prisma.student.findMany({
      where: {
        ...(groupId && { groupId }),
        ...(status && { status: status as any }),
      },
      include: {
        group: true,
        facilitator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Export as CSV if requested
    if (format === 'csv') {
      const Papa = require('papaparse');
      
      const csvData = students.map((student: any) => ({
        'Student ID': student.studentId,
        'First Name': student.firstName,
        'Last Name': student.lastName,
        'ID Number': student.idNumber,
        'Email': student.email || '',
        'Phone': student.phone || '',
        'Group': student.group?.name || '',
        'Status': student.status,
        'Progress': student.progress || 0,
        'Facilitator': student.facilitator?.name || '',
        'Created Date': new Date(student.createdAt).toLocaleDateString(),
      }));

      const csv = Papa.unparse(csvData);
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="students-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return successResponse(students);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createStudentSchema.parse(body);
    
    // For now, use a default facilitator ID (you'll get this from auth later)
    const facilitatorId = body.facilitatorId || 'default-facilitator-id';

    const student = await prisma.student.create({
      data: {
        ...validatedData,
        facilitatorId,
      },
      include: {
        group: true,
        facilitator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return successResponse(student, 'Student created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
