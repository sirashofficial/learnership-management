import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseISO } from 'date-fns';
import { withAuth, withRateLimit, getAuthContext } from '@/middleware/apiAuth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

async function handlePatch(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Verify ownership
    const authContext = getAuthContext(request);
    const plan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!plan || (authContext && plan.facilitatorId !== authContext.user.userId)) {
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

async function handleDelete(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verify ownership
    const authContext = getAuthContext(request);
    const plan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!plan || (authContext && plan.facilitatorId !== authContext.user.userId)) {
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

export const PATCH = withAuth(withRateLimit(handlePatch, 'strict'), ['ADMIN', 'FACILITATOR']);
export const DELETE = withAuth(withRateLimit(handleDelete, 'strict'), ['ADMIN']);
