import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { parseISO } from 'date-fns';

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
    const body = await request.json();

    // Verify ownership
    const plan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!plan || plan.facilitatorId !== user!.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.startDate !== undefined) updateData.startDate = parseISO(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? parseISO(body.endDate) : null;
    if (body.startTime !== undefined) updateData.startTime = body.startTime;
    if (body.endTime !== undefined) updateData.endTime = body.endTime;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.isPrivate !== undefined) updateData.isPrivate = body.isPrivate;

    const updated = await prisma.plan.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PATCH /api/plans/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Verify ownership
    const plan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!plan || plan.facilitatorId !== user!.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Delete associated reminders
    await prisma.reminder.deleteMany({
      where: { planId: id },
    });

    await prisma.plan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/plans/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
