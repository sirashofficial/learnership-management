import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) {
      return error;
    }

    const { id } = params;

    // Fetch the lesson to verify it exists
    const lesson = await prisma.lessonPlan.findUnique({
      where: { id },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Return empty audit log for now (model not available)
    return NextResponse.json({
      data: [],
      message: 'No audit logs available for this lesson',
    });
  } catch (error) {
    console.error('GET /api/timetable/[id]/audit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
