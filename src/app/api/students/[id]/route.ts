import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { updateStudentSchema } from '@/lib/validations';
// GET /api/students/[id] - Get single student
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        group: true,
        facilitator: {
          select: { id: true, name: true, email: true },
        },
        attendance: {
          include: { session: true },
          orderBy: { date: 'desc' },
          take: 10,
        },
        assessments: {
          orderBy: { dueDate: 'desc' },
        },
      },
    });

    if (!student) {
      return errorResponse('Student not found', 404);
    }

    return successResponse(student);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/students/[id] - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        studentId: body.studentId,
        idNumber: body.idNumber,
        email: body.email,
        phone: body.phone,
        groupId: body.groupId,
        status: body.status,
        progress: body.progress,
        totalCreditsEarned: body.totalCreditsEarned,
      },
      include: {
        group: true,
        facilitator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return successResponse(student, 'Student updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/students/[id] - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.student.delete({
      where: { id: params.id },
    });

    return successResponse(null, 'Student deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
