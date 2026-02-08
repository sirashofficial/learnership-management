import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { updateStudentSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/middleware';
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
    const { error, user: currentUser } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const validatedData = updateStudentSchema.parse(body);

    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        studentId: validatedData.studentId,
        idNumber: validatedData.idNumber,
        email: validatedData.email,
        phone: validatedData.phone,
        groupId: validatedData.groupId,
        status: validatedData.status,
        progress: validatedData.progress,
        totalCreditsEarned: validatedData.totalCreditsEarned,
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
