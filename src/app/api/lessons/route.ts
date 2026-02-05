import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: any = {};

    if (from || to) {
      where.date = {};
      if (from) {
        where.date.gte = startOfDay(new Date(from));
      }
      if (to) {
        where.date.lte = endOfDay(new Date(to));
      }
    }

    const lessons = await prisma.lessonPlan.findMany({
      where,
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
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return Response.json({ data: lessons });
  } catch (error) {
    console.error('Error fetching lesson plans:', error);
    return Response.json(
      { error: 'Failed to fetch lesson plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const lesson = await prisma.lessonPlan.create({
      data: {
        title: body.title,
        description: body.description || null,
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
        venue: body.venue || null,
        objectives: body.objectives ? JSON.stringify(body.objectives) : null,
        materials: body.materials ? JSON.stringify(body.materials) : null,
        activities: body.activities ? JSON.stringify(body.activities) : null,
        notes: body.notes || null,
        aiGenerated: body.aiGenerated || false,
        moduleId: body.moduleId,
        facilitatorId: body.facilitatorId,
        groupId: body.groupId || null,
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
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return Response.json({ data: lesson }, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson plan:', error);
    return Response.json(
      { error: 'Failed to create lesson plan' },
      { status: 500 }
    );
  }
}
