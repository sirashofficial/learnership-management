import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

async function handleGet(request: NextRequest) {
  try {
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

async function handlePost(request: NextRequest) {
  try {
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

export const GET = withAuth(withRateLimit(handleGet, 'generous'), ['ADMIN', 'FACILITATOR']);
export const POST = withAuth(withRateLimit(handlePost, 'strict'), ['ADMIN', 'FACILITATOR']);
