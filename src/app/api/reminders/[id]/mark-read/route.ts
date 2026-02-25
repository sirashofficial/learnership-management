import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, withRateLimit, getAuthContext } from '@/middleware/apiAuth';

async function handlePatch(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    const { id } = params;

    const reminder = await prisma.reminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {},
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PATCH /api/reminders/[id]/mark-read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const PATCH = withAuth(withRateLimit(handlePatch, 'strict'), ['ADMIN', 'FACILITATOR']);
