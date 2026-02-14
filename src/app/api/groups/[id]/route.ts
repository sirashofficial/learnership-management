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
        rolloutPlan: true,
        unitStandardRollouts: {
          include: {
            unitStandard: true
          },
          orderBy: {
            startDate: 'asc'
          }
        },
        lessonPlans: {
          orderBy: {
            date: 'asc'
          }
        }
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
    // Get group with student count
    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });

    if (!group) {
      return errorResponse('Group not found', 404);
    }

    // Delete the group (students will be disconnected automatically via the relation)
    await prisma.group.delete({
      where: { id: params.id },
    });

    return successResponse(
      { id: params.id, studentCount: group._count.students },
      'Group deleted successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
