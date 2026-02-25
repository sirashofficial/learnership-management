import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getGroupColour } from '@/lib/groupColours';
import { enforceGroupAccess, getAuthContext, withAuth, withRateLimit } from '@/middleware/apiAuth';

async function getTimetableEntryHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authContext = getAuthContext(request);

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
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const accessError = enforceGroupAccess(session.groupId ?? null, authContext);
    if (accessError) return accessError;

    return NextResponse.json({
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
    return NextResponse.json(
      { error: 'Failed to fetch timetable session' },
      { status: 500 }
    );
  }
}

async function updateTimetableEntryHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const authContext = getAuthContext(request);

    const existing = await prisma.lessonPlan.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const accessError = enforceGroupAccess(existing.groupId ?? null, authContext);
    if (accessError) return accessError;

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

    return NextResponse.json({
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
    return NextResponse.json(
      { error: 'Failed to update timetable session' },
      { status: 500 }
    );
  }
}

async function deleteTimetableEntryHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authContext = getAuthContext(request);

    const existing = await prisma.lessonPlan.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const accessError = enforceGroupAccess(existing.groupId ?? null, authContext);
    if (accessError) return accessError;

    await prisma.lessonPlan.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting timetable session:', error);
    return NextResponse.json(
      { error: 'Failed to delete timetable session' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(withRateLimit(getTimetableEntryHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const PATCH = withAuth(withRateLimit(updateTimetableEntryHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const DELETE = withAuth(withRateLimit(deleteTimetableEntryHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
