import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
// GET /api/timetable/[id] - Get lesson details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lesson = await prisma.lessonPlan.findUnique({
      where: { id: params.id },
      include: {
        module: true,
        facilitator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        group: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!lesson) {
      return errorResponse('Lesson not found', 404);
    }

    return successResponse(lesson);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/timetable/[id] - Update lesson
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const lesson = await prisma.lessonPlan.update({
      where: { id: params.id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.date && { date: new Date(body.date) }),
        ...(body.startTime && { startTime: body.startTime }),
        ...(body.endTime && { endTime: body.endTime }),
        ...(body.venue !== undefined && { venue: body.venue }),
        ...(body.objectives !== undefined && { objectives: body.objectives }),
        ...(body.materials !== undefined && { materials: body.materials }),
        ...(body.activities !== undefined && { activities: body.activities }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.moduleId && { moduleId: body.moduleId }),
        ...(body.groupId && { groupId: body.groupId }),
      },
      include: {
        module: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        facilitator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return successResponse(lesson, 'Lesson updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/timetable/[id] - Delete lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.lessonPlan.delete({
      where: { id: params.id },
    });

    return successResponse(null, 'Lesson deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
