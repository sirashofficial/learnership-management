import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';

// GET /api/timetable - Get lessons with filters
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupId = searchParams.get('groupId');
    const moduleId = searchParams.get('moduleId');
    const search = searchParams.get('search');

    const lessons = await prisma.lessonPlan.findMany({
      where: {
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        ...(groupId && { groupId }),
        ...(moduleId && { moduleId }),
        ...(search && {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
            { objectives: { contains: search } },
          ],
        }),
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
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return successResponse(lessons);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/timetable - Create new lesson
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.date || !body.startTime || !body.endTime || !body.groupId || !body.moduleId) {
      return errorResponse('Missing required fields', 400);
    }

    const lesson = await prisma.lessonPlan.create({
      data: {
        title: body.title,
        description: body.description || null,
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
        venue: body.venue || null,
        objectives: body.objectives || null,
        materials: body.materials || null,
        activities: body.activities || null,
        notes: body.notes || null,
        moduleId: body.moduleId,
        facilitatorId: body.facilitatorId || null,
        groupId: body.groupId,
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

    return successResponse(lesson, 'Lesson created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
