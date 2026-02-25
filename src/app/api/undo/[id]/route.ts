import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { withAuth, withRateLimit, getAuthContext } from '@/middleware/apiAuth';
import { isAfter } from 'date-fns';

// POST /api/undo/[id] — execute undo (revert changes)
async function handlePost(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authContext = getAuthContext(request);
    if (!authContext) {
      return errorResponse('Unauthorized', 401);
    }

    const record = await prisma.undoHistory.findUnique({ where: { id: params.id } });

    if (!record) return errorResponse('Undo record not found', 404);
    if (record.userId !== authContext.user.userId) return errorResponse('Forbidden', 403);
    if (!record.canUndo) return errorResponse('This action has already been undone', 400);
    if (isAfter(new Date(), record.expiresAt)) {
      return errorResponse('Undo window has expired', 400);
    }

    const previousState: any[] = JSON.parse(record.previousState);
    const entityIds: string[] = JSON.parse(record.entityIds);

    let revertedCount = 0;

    // Revert based on entity type
    if (record.entityType === 'Assessment') {
      for (const state of previousState) {
        if (state.existed) {
          // Record existed before — restore to previous state
          await prisma.assessment.update({
            where: { id: state.id },
            data: {
              result: state.result,
              assessedDate: state.assessedDate ? new Date(state.assessedDate) : null,
              moderationStatus: state.moderationStatus,
            },
          });
        } else {
          // Record was newly CREATED by bulk action — delete it
          await prisma.assessment.delete({ where: { id: state.id } }).catch(() => null);
        }
        revertedCount++;
      }
    } else if (record.entityType === 'Attendance') {
      for (const state of previousState) {
        if (state.existed) {
          await prisma.attendance.update({
            where: { id: state.id },
            data: {
              status: state.status,
              notes: state.notes,
            },
          });
        } else {
          await prisma.attendance.delete({ where: { id: state.id } }).catch(() => null);
        }
        revertedCount++;
      }
    }

    // Mark as undone
    await prisma.undoHistory.update({
      where: { id: params.id },
      data: { canUndo: false, undoneAt: new Date() },
    });

    return successResponse(
      { revertedCount },
      `Successfully undone ${record.action}: ${revertedCount} record(s) reverted`
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(withRateLimit(handlePost, 'strict'), ['ADMIN', 'FACILITATOR']);
