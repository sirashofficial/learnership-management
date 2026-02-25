import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { startOfDay, endOfDay } from 'date-fns';
import { enforceGroupAccess, getAuthContext, withAuth, withRateLimit } from '@/middleware/apiAuth';

/**
 * GET /api/sessions
 * Fetch sessions with optional filtering
 * 
 * Query params:
 *   - groupId: Filter by group
 *   - date: Filter by specific date (YYYY-MM-DD)
 *   - from: Start date range
 *   - to: End date range
 *   - facilitatorId: Filter by facilitator
 */
async function getSessionsHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const date = searchParams.get('date');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const facilitatorId = searchParams.get('facilitatorId');

    const where: any = {};

    const authContext = getAuthContext(request);
    if (authContext?.user.role === 'FACILITATOR') {
      if (groupId) {
        const accessError = enforceGroupAccess(groupId, authContext);
        if (accessError) return accessError;
      } else if (authContext.allowedGroupIds.length === 0) {
        return successResponse([], 'Found 0 sessions');
      } else {
        where.groupId = { in: authContext.allowedGroupIds };
      }
    }

    // Filter by group
    if (groupId) {
      where.groupId = groupId;
    }

    // Filter by facilitator
    if (facilitatorId) {
      where.facilitatorId = facilitatorId;
    }

    // Filter by date
    if (date) {
      const targetDate = new Date(date);
      where.date = {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate),
      };
    } else if (from || to) {
      where.date = {};
      if (from) {
        where.date.gte = startOfDay(new Date(from));
      }
      if (to) {
        where.date.lte = endOfDay(new Date(to));
      }
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        facilitator: {
          select: {
            id: true,
            name: true,
          },
        },
        attendance: {
          select: {
            id: true,
            status: true,
            studentId: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    // Add attendance stats to each session
    const sessionsWithStats = sessions.map(session => {
      const attendanceCount = session.attendance.length;
      const presentCount = session.attendance.filter(a => a.status === 'PRESENT').length;
      const absentCount = session.attendance.filter(a => a.status === 'ABSENT').length;
      const lateCount = session.attendance.filter(a => a.status === 'LATE').length;

      return {
        id: session.id,
        title: session.title,
        module: session.module,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        notes: session.notes,
        groupId: session.groupId,
        facilitatorId: session.facilitatorId,
        group: session.group,
        facilitator: session.facilitator,
        attendanceStats: {
          total: attendanceCount,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
        },
      };
    });

    return successResponse(sessionsWithStats, `Found ${sessions.length} sessions`);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return errorResponse('Failed to fetch sessions', 500);
  }
}

/**
 * POST /api/sessions
 * Create a new session
 * 
 * Body: {
 *   title: string
 *   module: string
 *   date: string (ISO date)
 *   startTime: string (HH:MM)
 *   endTime: string (HH:MM)
 *   groupId: string
 *   facilitatorId: string
 *   notes?: string
 * }
 */
async function createSessionHandler(request: NextRequest) {
  try {
    const body = await request.json();

    const { title, module, date, startTime, endTime, groupId, facilitatorId, notes } = body;

    // Validate required fields
    if (!title || !module || !date || !startTime || !endTime || !groupId || !facilitatorId) {
      return errorResponse('Missing required fields', 400);
    }

    const authContext = getAuthContext(request);
    const accessError = enforceGroupAccess(groupId, authContext);
    if (accessError) return accessError;

    // Create session
    const session = await prisma.session.create({
      data: {
        title,
        module,
        date: new Date(date),
        startTime,
        endTime,
        groupId,
        facilitatorId,
        notes: notes || null,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        facilitator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return successResponse(session, 'Session created successfully');
  } catch (error) {
    console.error('Error creating session:', error);
    return errorResponse('Failed to create session', 500);
  }
}

/**
 * DELETE /api/sessions
 * Delete sessions by IDs
 * 
 * Body: {
 *   ids: string[]
 * }
 */
async function deleteSessionsHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse('ids array is required', 400);
    }

    const authContext = getAuthContext(request);
    if (authContext?.user.role === 'FACILITATOR') {
      const sessions = await prisma.session.findMany({
        where: { id: { in: ids } },
        select: { groupId: true },
      });

      for (const session of sessions) {
        const accessError = enforceGroupAccess(session.groupId, authContext);
        if (accessError) return accessError;
      }
    }

    // Delete sessions
    const result = await prisma.session.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return successResponse(
      { deletedCount: result.count },
      `Deleted ${result.count} sessions`
    );
  } catch (error) {
    console.error('Error deleting sessions:', error);
    return errorResponse('Failed to delete sessions', 500);
  }
}

export const GET = withAuth(withRateLimit(getSessionsHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const POST = withAuth(withRateLimit(createSessionHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const DELETE = withAuth(withRateLimit(deleteSessionsHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
