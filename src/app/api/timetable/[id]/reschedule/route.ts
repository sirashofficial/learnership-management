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
    const { newDate, newTime, newEndTime, reason } = body;

    if (!newDate || !newTime) {
      return NextResponse.json(
        { error: 'newDate and newTime are required' },
        { status: 400 }
      );
    }

    // Fetch the lesson
    const lesson = await prisma.lessonPlan.findUnique({
      where: { id },
      include: {
        group: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Check for conflicts - same venue at same time
    const conflictingLesson = await prisma.lessonPlan.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          { date: parseISO(newDate) },
          { startTime: newTime },
          { venue: lesson.venue },
        ],
      },
    });

    if (conflictingLesson) {
      return NextResponse.json(
        {
          error: 'Time slot conflict: Another lesson is scheduled at this venue and time',
        },
        { status: 409 }
      );
    }

    // Update the lesson
    const updated = await prisma.lessonPlan.update({
      where: { id },
      data: {
        date: parseISO(newDate),
        startTime: newTime,
        endTime: newEndTime || lesson.endTime,
      },
      include: {
        group: true,
        module: true,
        facilitator: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PATCH /api/timetable/[id]/reschedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
