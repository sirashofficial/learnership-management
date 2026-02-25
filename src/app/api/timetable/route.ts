import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getGroupColour } from '@/lib/groupColours';
import { enforceGroupAccess, getAuthContext, withAuth, withRateLimit } from '@/middleware/apiAuth';

async function getOrCreateDefaultModule() {
  const existing = await prisma.module.findFirst();
  if (existing) return existing;

  return prisma.module.create({
    data: {
      moduleNumber: 1,
      code: 'GEN001',
      name: 'General Training',
      fullName: 'General Training Module',
      purpose: 'General training and orientation',
      description: 'General training sessions',
      credits: 10,
      notionalHours: 40,
      classroomHours: 30,
      workplaceHours: 10,
      order: 1,
    },
  });
}

async function getDefaultFacilitator() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (admin) return admin;

  return prisma.user.findFirst();
}

function parseDateParam(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function getTimetableHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start') || searchParams.get('startDate');
    const endParam = searchParams.get('end') || searchParams.get('endDate');
    const groupId = searchParams.get('groupId') || undefined;

    const authContext = getAuthContext(request);
    if (authContext?.user.role === 'FACILITATOR') {
      if (groupId) {
        const accessError = enforceGroupAccess(groupId, authContext);
        if (accessError) return accessError;
      } else if (authContext.allowedGroupIds.length === 0) {
        return NextResponse.json({ data: [] });
      }
    }

    const start = parseDateParam(startParam);
    const end = parseDateParam(endParam);

    if (!start || !end) {
      return NextResponse.json(
        { error: 'start and end are required' },
        { status: 400 }
      );
    }

    const sessions = await prisma.lessonPlan.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        ...(groupId ? { groupId } : {}),
        ...(authContext?.user.role === 'FACILITATOR' && !groupId
          ? { groupId: { in: authContext.allowedGroupIds } }
          : {}),
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    const data = sessions.map((session) => ({
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
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching timetable sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timetable sessions' },
      { status: 500 }
    );
  }
}

async function createTimetableHandler(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || !body.date || !body.startTime || !body.endTime || !body.groupId) {
      return NextResponse.json(
        { error: 'title, date, startTime, endTime, and groupId are required' },
        { status: 400 }
      );
    }

    const authContext = getAuthContext(request);
    const accessError = enforceGroupAccess(body.groupId, authContext);
    if (accessError) return accessError;

    const module = body.moduleId
      ? await prisma.module.findUnique({ where: { id: body.moduleId } })
      : await getOrCreateDefaultModule();

    const facilitator = body.facilitatorId
      ? await prisma.user.findUnique({ where: { id: body.facilitatorId } })
      : await getDefaultFacilitator();

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 400 });
    }

    if (!facilitator) {
      return NextResponse.json(
        { error: 'Facilitator not found' },
        { status: 400 }
      );
    }

    const session = await prisma.lessonPlan.create({
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
        aiGenerated: Boolean(body.aiGenerated),
        moduleId: module.id,
        facilitatorId: facilitator.id,
        groupId: body.groupId,
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
    console.error('Error creating timetable session:', error);
    return NextResponse.json(
      { error: 'Failed to create timetable session' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(withRateLimit(getTimetableHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const POST = withAuth(withRateLimit(createTimetableHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
