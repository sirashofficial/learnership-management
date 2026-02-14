import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) {
      return error;
    }

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
