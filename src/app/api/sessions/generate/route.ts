import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';
import { addDays, addWeeks, differenceInDays, getDay, format } from 'date-fns';

// NVC L2 Module structure with unit standards and durations
const NVC_L2_MODULES = [
  {
    moduleNum: 1,
    name: 'Numeracy',
    credits: 16,
    durationDays: 30,
    unitStandards: ['7480', '9008', '9007', '7469', '9009'],
  },
  {
    moduleNum: 2,
    name: 'HIV/AIDS & Communications',
    credits: 24,
    durationDays: 45,
    unitStandards: ['13915', '8963', '8964', '8962', '8967'],
  },
  {
    moduleNum: 3,
    name: 'Market Requirements',
    credits: 22,
    durationDays: 45,
    unitStandards: ['119673', '119669', '119672', '114974'],
  },
  {
    moduleNum: 4,
    name: 'Business Sector & Industry',
    credits: 26,
    durationDays: 45,
    unitStandards: ['119667', '119712', '119671'],
  },
  {
    moduleNum: 5,
    name: 'Financial Requirements',
    credits: 26,
    durationDays: 60,
    unitStandards: ['119666', '119670', '119674'],
  },
  {
    moduleNum: 6,
    name: 'Business Operations',
    credits: 26,
    durationDays: 60,
    unitStandards: ['119668', '13932', '13929', '13930', '114959', '113924'],
  },
];

// Skip weekends - move to next Monday if date falls on weekend
function getNextBusinessDay(date: Date): Date {
  const d = new Date(date);
  const dayOfWeek = getDay(d);
  if (dayOfWeek === 0) {
    // Sunday - move to Monday
    d.setDate(d.getDate() + 1);
  } else if (dayOfWeek === 6) {
    // Saturday - move to Monday
    d.setDate(d.getDate() + 2);
  }
  return d;
}

// POST /api/sessions/generate - Generate sessions for a group based on rollout plan
export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { groupId } = body;

    if (!groupId) {
      return errorResponse('groupId is required', 400);
    }

    // Get group with rollout plan
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { rolloutPlan: true, students: true },
    });

    if (!group) {
      return errorResponse('Group not found', 404);
    }

    if (!group.rolloutPlan) {
      return errorResponse('Group has no rollout plan', 400);
    }

    // Get or create facilitator (default to group owner or create generic one)
    let facilitator = await prisma.user.findFirst({
      where: { role: 'FACILITATOR' },
    });

    if (!facilitator) {
      facilitator = await prisma.user.create({
        data: {
          email: `facilitator-${Date.now()}@lms.local`,
          name: 'Default Facilitator',
          password: 'temp',
          role: 'FACILITATOR',
        },
      });
    }

    // Generate sessions for each module
    const sessionsCreated = [];
    const rolloutPlan = group.rolloutPlan;

    for (const module of NVC_L2_MODULES) {
      const startDateKey = `module${module.moduleNum}StartDate`;
      const endDateKey = `module${module.moduleNum}EndDate`;

      const moduleStartDate = (rolloutPlan as any)[startDateKey];
      const moduleEndDate = (rolloutPlan as any)[endDateKey];

      if (!moduleStartDate || !moduleEndDate) {
        console.warn(
          `Module ${module.moduleNum} missing dates for group ${group.id}`
        );
        continue;
      }

      // Create sessions for this module (2-3 sessions per week, Mon-Fri only)
      let currentDate = new Date(moduleStartDate);
      const endDate = new Date(moduleEndDate);
      let sessionCount = 0;

      while (currentDate <= endDate && sessionCount < 12) {
        currentDate = getNextBusinessDay(currentDate);

        if (currentDate > endDate) break;

        // Create session
        const session = await prisma.session.create({
          data: {
            groupId: group.id,
            facilitatorId: facilitator.id,
            date: currentDate,
            startTime: '09:00',
            endTime: '16:00',
            title: `${module.name} - Session ${sessionCount + 1}`,
            module: `Module ${module.moduleNum}`,
            notes: `Auto-generated from rollout plan`,
          },
        });

        sessionsCreated.push(session);

        // Mark attendance for all students
        await prisma.attendance.create({
          data: {
            studentId: group.students[0]?.id || '',
            sessionId: session.id,
            status: 'MARKED',
            date: session.date,
            markedAt: new Date(),
          },
        });

        // Move to next session (every 2-3 days)
        currentDate = addDays(currentDate, Math.random() < 0.5 ? 2 : 3);
        sessionCount++;
      }

      console.log(
        `Created ${sessionCount} sessions for Module ${module.moduleNum}`
      );
    }

    return successResponse(
      {
        groupId,
        groupName: group.name,
        sessionsCreated: sessionsCreated.length,
        sessions: sessionsCreated,
      },
      `Generated ${sessionsCreated.length} sessions for group`
    );
  } catch (error) {
    console.error('Error generating sessions:', error);
    return handleApiError(error);
  }
}

// GET /api/sessions/weekly - Get weekly schedule (Mon-Fri)
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const weekStartStr = searchParams.get('weekStart'); // ISO string
    const groupId = searchParams.get('groupId');

    if (!weekStartStr || !groupId) {
      return errorResponse('weekStart and groupId are required', 400);
    }

    const weekStart = new Date(weekStartStr);
    const weekEnd = addDays(weekStart, 4); // Monday to Friday

    // Get all sessions for the week/group
    const sessions = await prisma.session.findMany({
      where: {
        groupId: groupId,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: {
        facilitator: {
          select: { id: true, name: true },
        },
        group: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Group sessions by day (Mon-Fri)
    const weekSchedule: Record<string, any[]> = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
    };

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    sessions.forEach((session) => {
      const dayName = dayNames[getDay(new Date(session.date))];
      if (dayName && weekSchedule[dayName] !== undefined) {
        weekSchedule[dayName].push({
          id: session.id,
          time: session.startTime,
          topic: session.title, // Map title to topic for UI
          facilitator: session.facilitator?.name,
          status: 'SCHEDULED',
        });
      }
    });

    return successResponse(
      {
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        schedule: weekSchedule,
        totalSessions: sessions.length,
      },
      'Weekly schedule retrieved'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
