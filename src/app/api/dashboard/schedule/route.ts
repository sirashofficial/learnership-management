/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get all lesson plans for the next 7 days
    const lessonPlans = await prisma.lessonPlan.findMany({
      where: {
        date: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        module: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        facilitator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: { students: true },
            },
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // Get sessions for the next 7 days
    const sessions = await prisma.session.findMany({
      where: {
        date: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        facilitator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: { students: true },
            },
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // Combine and format schedule items
    const scheduleItems = [
      ...lessonPlans.map((lesson: any) => ({
        id: lesson.id,
        type: 'LESSON_PLAN',
        title: lesson.title,
        date: lesson.date,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        courseName: lesson.module.name,
        courseCode: lesson.module.code,
        groups: lesson.group ? [{
          id: lesson.group.id,
          name: lesson.group.name,
          companyName: lesson.group.company?.name || null,
          studentCount: lesson.group._count.students,
        }] : [],
        instructor: {
          id: lesson.facilitator.id,
          name: lesson.facilitator.name,
          email: lesson.facilitator.email,
        },
        venue: lesson.venue || null,
        description: lesson.description || null,
        isPast: new Date(`${lesson.date.toISOString().split('T')[0]}T${lesson.endTime}`) < now,
      })),
      ...sessions.map((session: any) => ({
        id: session.id,
        type: 'SESSION',
        title: session.title,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        courseName: session.module,
        courseCode: null,
        groups: [{
          id: session.group.id,
          name: session.group.name,
          companyName: session.group.company?.name || null,
          studentCount: session.group._count.students,
        }],
        instructor: {
          id: session.facilitator.id,
          name: session.facilitator.name,
          email: session.facilitator.email,
        },
        venue: null,
        description: session.notes || null,
        isPast: new Date(`${session.date.toISOString().split('T')[0]}T${session.endTime}`) < now,
      })),
    ].sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    return successResponse({ schedule: scheduleItems });
  } catch (error) {
    return handleApiError(error);
  }
}
