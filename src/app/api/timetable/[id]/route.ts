import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getGroupColour } from '@/lib/groupColours';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.lessonPlan.findUnique({
      where: { id: params.id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!session) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    return Response.json({
      data: {
        id: session.id,
        title: session.title,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        venue: session.venue,
        groupId: session.groupId,
        group: session.group
          ? {
              id: session.group.id,
              name: session.group.name,
              colour: getGroupColour(session.group.name),
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching timetable session:', error);
    return Response.json(
      { error: 'Failed to fetch timetable session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const existing = await prisma.lessonPlan.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = await prisma.lessonPlan.update({
      where: { id: params.id },
      data: {
        title: body.title ?? existing.title,
        description: body.description ?? existing.description,
        date: body.date ? new Date(body.date) : existing.date,
        startTime: body.startTime ?? existing.startTime,
        endTime: body.endTime ?? existing.endTime,
        venue: body.venue ?? existing.venue,
        groupId: body.groupId ?? existing.groupId,
        notes: body.notes ?? existing.notes,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return Response.json({
      data: {
        id: session.id,
        title: session.title,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        venue: session.venue,
        groupId: session.groupId,
        group: session.group
          ? {
              id: session.group.id,
              name: session.group.name,
              colour: getGroupColour(session.group.name),
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error updating timetable session:', error);
    return Response.json(
      { error: 'Failed to update timetable session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.lessonPlan.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    await prisma.lessonPlan.delete({ where: { id: params.id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting timetable session:', error);
    return Response.json(
      { error: 'Failed to delete timetable session' },
      { status: 500 }
    );
  }
}
