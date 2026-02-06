import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
// GET /api/groups/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            status: true,
          },
        },
        sessions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: {
          select: { students: true, sessions: true },
        },
      },
    });

    if (!group) {
      return errorResponse('Group not found', 404);
    }

    return successResponse(group);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/groups/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const group = await prisma.group.update({
      where: { id: params.id },
      data: {
        name: body.name,
        location: body.location,
        coordinator: body.coordinator,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        status: body.status,
        notes: body.notes,
        companyId: body.companyId,
      },
      include: {
        company: true,
      },
    });

    return successResponse(group, 'Group updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/groups/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if group has students
    const studentCount = await prisma.student.count({
      where: { groupId: params.id },
    });

    if (studentCount > 0) {
      return errorResponse(
        `Cannot delete group. There are ${studentCount} students assigned to this group.`,
        400
      );
    }

    await prisma.group.delete({
      where: { id: params.id },
    });

    return successResponse(null, 'Group deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
