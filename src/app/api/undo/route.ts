import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { withAuth, withRateLimit, getAuthContext } from '@/middleware/apiAuth';
import { addMinutes } from 'date-fns';

export const dynamic = 'force-dynamic';

// GET /api/undo — list recent undo-able actions for current user
async function handleGet(request: NextRequest) {
  try {
    const authContext = getAuthContext(request);
    if (!authContext) {
      return errorResponse('Unauthorized', 401);
    }

    const user = authContext.user;
    const records = await prisma.undoHistory.findMany({
      where: {
        userId: user.userId,
        canUndo: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return successResponse(records);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/undo — create a new undo checkpoint
async function handlePost(request: NextRequest) {
  try {
    const authContext = getAuthContext(request);
    if (!authContext) {
      return errorResponse('Unauthorized', 401);
    }

    const user = authContext.user;
    const body = await request.json();
    const { action, entityType, entityIds, previousState, newState, description, windowMinutes = 30 } = body as {
      action: string;
      entityType: string;
      entityIds: string[];
      previousState: any[];
      newState: any[];
      description?: string;
      windowMinutes?: number;
    };

    if (!action || !entityType || !Array.isArray(entityIds)) {
      return errorResponse('action, entityType, and entityIds are required', 400);
    }

    const record = await prisma.undoHistory.create({
      data: {
        userId: user.userId,
        action,
        entityType,
        entityIds: JSON.stringify(entityIds),
        previousState: JSON.stringify(previousState),
        newState: JSON.stringify(newState),
        description: description ?? `${action} on ${entityIds.length} ${entityType} record(s)`,
        canUndo: true,
        expiresAt: addMinutes(new Date(), windowMinutes),
      },
    });

    return successResponse({ id: record.id, expiresAt: record.expiresAt });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(withRateLimit(handleGet, 'moderate'), ['ADMIN', 'FACILITATOR', 'STUDENT']);
export const POST = withAuth(withRateLimit(handlePost, 'strict'), ['ADMIN', 'FACILITATOR']);
