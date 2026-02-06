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

// POST - Create or update an override
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    console.error('Error creating/updating override:', error);
    return NextResponse.json(
      { error: 'Failed to create/update override' },
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
