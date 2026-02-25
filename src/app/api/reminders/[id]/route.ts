import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, withRateLimit, getAuthContext } from '@/middleware/apiAuth';

async function handleDelete(
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

    await prisma.reminder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/reminders/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const DELETE = withAuth(withRateLimit(handleDelete, 'strict'), ['ADMIN', 'FACILITATOR']);
