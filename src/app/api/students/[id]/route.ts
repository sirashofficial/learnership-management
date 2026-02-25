import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { updateStudentSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/middleware';
import { enforceGroupAccess, getAuthContext, withAuth, withRateLimit, withValidation } from '@/middleware/apiAuth';
import { softDelete } from '@/lib/softDelete';
import { emitEvent } from '@/lib/events/eventBus';
// GET /api/students/[id] - Get single student
async function getStudentHandler(
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

    const authContext = getAuthContext(request);
    const accessError = enforceGroupAccess(student.groupId, authContext);
    if (accessError) return accessError;

    return successResponse(student);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/students/[id] - Update student
async function updateStudentHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, user: currentUser } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const validatedData = updateStudentSchema.parse(body);

    const authContext = getAuthContext(request);
    const accessError = enforceGroupAccess(validatedData.groupId, authContext);
    if (accessError) return accessError;

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
        // totalCreditsEarned is READ-ONLY - managed only via assessment marking
      },
      include: {
        group: true,
        facilitator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Emit event for cache invalidation (event-driven updates)
    // This triggers cache invalidation across all affected endpoints:
    // - /api/students/* (student lists and details)
    // - /api/groups/{groupId} (group member lists)
    // - /api/dashboard/* (dashboard stats)
    emitEvent('student:updated', {
      studentId: student.id,
      groupId: student.groupId || undefined,
      action: 'updated',
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email || undefined,
    });

    return successResponse(student, 'Student updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/students/[id] - Delete student
async function deleteStudentHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      select: { groupId: true },
    });

    if (!student) {
      return errorResponse('Student not found', 404);
    }

    const authContext = getAuthContext(request);
    const accessError = enforceGroupAccess(student.groupId, authContext);
    if (accessError) return accessError;

    // Soft delete the student
    await softDelete('student', params.id);

    // Emit event for cache invalidation (event-driven updates)
    // This triggers cache invalidation on student deletion
    emitEvent('student:updated', {
      studentId: params.id,
      groupId: student.groupId || undefined,
      action: 'deleted',
    });

    return successResponse(null, 'Student archived successfully. Can be restored within 30 days.');
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(withRateLimit(getStudentHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const PUT = withAuth(
  withRateLimit(withValidation(updateStudentHandler, updateStudentSchema), 'moderate'),
  ['ADMIN', 'FACILITATOR']
);
export const DELETE = withAuth(withRateLimit(deleteStudentHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
