import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { parseISO, startOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) {
      return error;
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date'); // optional date filter

    const where: any = {};

    if (date) {
      const dateObj = parseISO(date);
      where.scheduledAt = {
        gte: startOfDay(dateObj),
        lte: new Date(dateObj.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        plan: true,
      },
    });

    return NextResponse.json({ data: reminders });
  } catch (error) {
    console.error('GET /api/reminders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) {
      return error;
    }

    const body = await request.json();
    const {
      planId,
      message,
      venue,
      sendTo,
      scheduledAt,
    } = body;

    if (!planId || !scheduledAt) {
      return NextResponse.json(
        { error: 'planId and scheduledAt are required' },
        { status: 400 }
      );
    }

    const reminder = await prisma.reminder.create({
      data: {
        planId,
        scheduledAt: parseISO(scheduledAt),
      },
      include: {
        plan: true,
      },
    });

    return NextResponse.json({ data: reminder }, { status: 201 });
  } catch (error) {
    console.error('POST /api/reminders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
