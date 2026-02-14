import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch overrides for a date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const overrides = await prisma.recurringSessionOverride.findMany({
      where: {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(overrides);
  } catch (error) {
    console.error('Error fetching recurring session overrides:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overrides' },
      { status: 500 }
    );
  }
}

// POST - Create recurring sessions or update an override
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is for creating recurring sessions
    if (body.action === 'create-recurring' && body.groupId && body.title) {
      const {
        groupId,
        title,
        module,
        startTime,
        endTime,
        notes,
        facilitatorId,
        frequency = 'WEEKLY',
        scheduleEndDate,
        startDate = new Date(),
        skipWeekends = true
      } = body;

      if (!facilitatorId) {
        return NextResponse.json(
          { error: 'facilitatorId is required' },
          { status: 400 }
        );
      }

      // Default end date is 6 months from start
      const endDateForSchedule = scheduleEndDate ? new Date(scheduleEndDate) : new Date(new Date().setMonth(new Date().getMonth() + 6));
      const sessions = [];
      const currentDate = new Date(startDate);
      
      while (currentDate < endDateForSchedule) {
        const dayOfWeek = currentDate.getDay();
        if (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        const session = await prisma.session.create({
          data: {
            title,
            module,
            date: new Date(currentDate),
            startTime,
            endTime,
            notes: notes || `${frequency} recurring session`,
            groupId,
            facilitatorId
          }
        });

        sessions.push(session);

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
        message: `Created ${sessions.length} recurring sessions`,
        sessionCount: sessions.length,
        frequency,
        endDate: endDateForSchedule.toISOString(),
        sessions: sessions.slice(0, 5)
      });
    }

    // Otherwise, handle override creation
    const { date, groupName, venue, isCancelled, cancellationReason, notes, notificationEnabled, notificationTime } = body;

    if (!date || !groupName || !venue) {
      return NextResponse.json(
        { error: 'date, groupName, and venue are required' },
        { status: 400 }
      );
    }

    // Upsert (create or update) the override
    const override = await prisma.recurringSessionOverride.upsert({
      where: {
        date_groupName_venue: {
          date: new Date(date),
          groupName,
          venue,
        },
      },
      update: {
        isCancelled: isCancelled ?? false,
        cancellationReason,
        notes,
        notificationEnabled: notificationEnabled ?? true,
        notificationTime: notificationTime ?? 30,
      },
      create: {
        date: new Date(date),
        groupName,
        venue,
        isCancelled: isCancelled ?? false,
        cancellationReason,
        notes,
        notificationEnabled: notificationEnabled ?? true,
        notificationTime: notificationTime ?? 30,
      },
    });

    return NextResponse.json(override);
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an override
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const groupName = searchParams.get('groupName');
    const venue = searchParams.get('venue');

    if (!date || !groupName || !venue) {
      return NextResponse.json(
        { error: 'date, groupName, and venue are required' },
        { status: 400 }
      );
    }

    await prisma.recurringSessionOverride.delete({
      where: {
        date_groupName_venue: {
          date: new Date(date),
          groupName,
          venue,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting override:', error);
    return NextResponse.json(
      { error: 'Failed to delete override' },
      { status: 500 }
    );
  }
}
