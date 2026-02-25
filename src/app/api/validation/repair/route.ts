import { NextRequest } from 'next/server';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-utils';
import { withAuth, withRateLimit, getAuthContext } from '@/middleware/apiAuth';
import {
  recalculateAllProgress,
  cleanupOrphanedRecords,
  syncRolloutPlans,
} from '@/lib/validation/dataIntegrityRepairs';

export const dynamic = 'force-dynamic';

type RepairAction = 'recalculate_progress' | 'cleanup_orphans' | 'sync_rollout';

async function handlePost(request: NextRequest) {
  try {
    const authContext = getAuthContext(request);
    if (!authContext?.user?.userId) {
      return errorResponse('Unauthorized', 401);
    }
    const { user } = authContext;

    const body = await request.json();
    const { action, dryRun = false, studentIds, groupIds } = body || {};

    if (!action) {
      return validationErrorResponse([
        { field: 'action', message: 'Repair action is required' },
      ]);
    }

    switch (action as RepairAction) {
      case 'recalculate_progress': {
        const result = await recalculateAllProgress({
          dryRun,
          studentIds,
          userId: user.userId,
        });
        return successResponse(result);
      }
      case 'cleanup_orphans': {
        const result = await cleanupOrphanedRecords({
          dryRun,
          userId: user.userId,
        });
        return successResponse(result);
      }
      case 'sync_rollout': {
        const result = await syncRolloutPlans({
          dryRun,
          groupIds,
          userId: user.userId,
        });
        return successResponse(result);
      }
      default:
        return validationErrorResponse([
          { field: 'action', message: 'Unsupported repair action' },
        ]);
    }
  } catch (error: any) {
    console.error('Data integrity repair error:', error);
    return errorResponse(error?.message || 'Repair failed', 500);
  }
}

export const POST = withAuth(withRateLimit(handlePost, 'strict'), ['ADMIN']);
