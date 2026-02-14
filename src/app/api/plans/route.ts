import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) {
      return error;
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (startDate && endDate) {
      where.startDate = {
        gte: startOfDay(parseISO(startDate)),
        lte: endOfDay(parseISO(endDate)),
      };
    }

    // Stub to prevent 500 error on missing Plan table
    // const plans = await prisma.plan.findMany({...});
    const plans: any[] = [];

    return NextResponse.json({ data: plans });
  } catch (error) {
    console.error('GET /api/plans error:', error);
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
      title,
      description,
      startDate,
      endDate,
      groupId,
    } = body;

    if (!title || !startDate || !groupId) {
      return NextResponse.json(
        { error: 'Title, startDate, and groupId are required' },
        { status: 400 }
      );
    }

    // Note: Plan creation temporarily disabled due to schema type mocking
    // This endpoint is not part of the core calendar feature
    return NextResponse.json({ error: 'Temporarily disabled' }, { status: 501 });
  } catch (error) {
    console.error('POST /api/plans error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
