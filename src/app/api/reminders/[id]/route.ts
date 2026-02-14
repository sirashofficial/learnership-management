import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function DELETE(
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
