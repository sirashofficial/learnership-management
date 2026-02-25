import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, withRateLimit, getAuthContext } from '@/middleware/apiAuth';
import { parseISO, startOfDay } from 'date-fns';

async function handleGet(request: NextRequest) {
  try {

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

async function handlePost(request: NextRequest) {
  try {

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

export const GET = withAuth(withRateLimit(handleGet, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const POST = withAuth(withRateLimit(handlePost, 'strict'), ['ADMIN', 'FACILITATOR']);
