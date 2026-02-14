import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Schedule recurring group sessions on calendar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      groupId,
      facilitatorId,
      startDate = new Date(),
      endDate,
      frequency = 'WEEKLY',
      dayOfWeek = 1, // 0=Sunday, 1=Monday, etc.
      startTime = '09:00',
      endTime = '16:00'
    } = body;

    if (!groupId || !facilitatorId) {
      return NextResponse.json(
        { error: 'groupId and facilitatorId are required' },
        { status: 400 }
      );
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Default end date is end of current group
    const scheduleEndDate = endDate ? new Date(endDate) : (group.endDate || new Date());

    const sessions = [];
    let currentDate = new Date(startDate);

    // Find the first occurrence of the desired day of week
    const offset = (dayOfWeek - currentDate.getDay() + 7) % 7;
    currentDate.setDate(currentDate.getDate() + (offset === 0 ? 0 : offset));

    while (currentDate <= scheduleEndDate) {
      // Create timetable session
      const session = await prisma.session.create({
        data: {
          title: `${group.name} - Teaching Session`,
          module: 'NVC Level 2',
          date: new Date(currentDate),
          startTime,
          endTime,
          notes: `${frequency} recurring group session`,
          groupId,
          facilitatorId
        }
      });

      sessions.push({
        id: session.id,
        date: session.date,
        time: `${startTime}-${endTime}`
      });

      // Move to next occurrence based on frequency
      switch (frequency) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'BIWEEKLY':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'MONTHLY':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          currentDate.setDate(currentDate.getDate() + 7);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Scheduled ${sessions.length} sessions for ${group.name}`,
      groupName: group.name,
      frequency,
      sessionsCreated: sessions.length,
      dateRange: {
        start: startDate,
        end: scheduleEndDate
      },
      preview: sessions.slice(0, 10)
    });

  } catch (error) {
    console.error('Schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule sessions' },
      { status: 500 }
    );
  }
}

// GET - Fetch calendar events for groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const whereClause: any = {};

    if (groupId) {
      whereClause.groupId = groupId;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
      include: {
        group: { select: { id: true, name: true } },
        facilitator: { select: { name: true } },
        attendance: {
          select: {
            id: true,
            studentId: true,
            status: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    const calendarEvents = sessions.map(session => ({
      id: session.id,
      title: session.title,
      start: session.date,
      end: new Date(new Date(session.date).setHours(
        parseInt(session.endTime.split(':')[0]),
        parseInt(session.endTime.split(':')[1])
      )),
      groupId: session.groupId,
      groupName: session.group.name,
      facilitator: session.facilitator.name,
      startTime: session.startTime,
      endTime: session.endTime,
      attendanceCount: session.attendance.length,
      attendanceRecorded: session.attendance.some(a => a.status),
      module: session.module,
      notes: session.notes
    }));

    return NextResponse.json({
      success: true,
      events: calendarEvents,
      totalSessions: calendarEvents.length
    });

  } catch (error) {
    console.error('Get calendar error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a scheduled session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    await prisma.session.delete({ where: { id: sessionId } });

    return NextResponse.json({
      success: true,
      message: 'Session cancelled'
    });

  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
