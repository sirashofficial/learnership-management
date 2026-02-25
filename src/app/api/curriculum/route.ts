import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

async function handleGet(request: NextRequest) {
  try {
    const modules = await prisma.module.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'NOT_STARTED' },
          { status: 'IN_PROGRESS' },
          { status: 'COMPLETED' }
        ]
      },
      include: {
        unitStandards: {
          include: {
            activities: true,
          },
        },
        documents: true,
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ data: modules });
  } catch (error) {
    console.error('Error fetching curriculum:', error);
    return NextResponse.json(
      { error: 'Failed to fetch curriculum' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(withRateLimit(handleGet, 'generous'), ['ADMIN', 'FACILITATOR']);
