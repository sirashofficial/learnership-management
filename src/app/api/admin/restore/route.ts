/**
 * /api/admin/restore - Restore soft-deleted records
 * ADMIN only endpoint for recovering accidentally deleted records within the 30-day window
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';
import { 
  restore, 
  restoreMany, 
  canRestore, 
  cascadeRestoreGroup,
  SoftDeletableModel,
  findUniqueWithDeleted,
  SOFT_DELETE_RETENTION_DAYS
} from '@/lib/softDelete';

// POST /api/admin/restore - Restore a soft-deleted record
async function handleRestore(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, id, ids } = body;

    // Validate entity type
    const validEntityTypes: SoftDeletableModel[] = ['user', 'group', 'student', 'assessment', 'attendance'];
    if (!validEntityTypes.includes(entityType)) {
      return errorResponse(
        `Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`,
        400
      );
    }

    // Handle batch restore
    if (ids && Array.isArray(ids)) {
      // Restore multiple records
      const result = await restoreMany(entityType, ids);
      return successResponse(
        { count: result.count },
        `Successfully restored ${result.count} ${entityType}(s)`
      );
    }

    // Handle single record restore
    if (!id) {
      return errorResponse('Either "id" or "ids" must be provided', 400);
    }

    // Check if record can be restored (within 30-day window)
    const canBeRestored = await canRestore(entityType, id);
    if (!canBeRestored) {
      return errorResponse(
        `This ${entityType} cannot be restored. It may not be deleted, or it has exceeded the ${SOFT_DELETE_RETENTION_DAYS}-day recovery window.`,
        400
      );
    }

    // Special handling for groups - cascade restore to students
    if (entityType === 'group') {
      const result = await cascadeRestoreGroup(id);
      return successResponse(
        { 
          group: result.group,
          studentsRestored: result.studentsRestored 
        },
        `Group and ${result.studentsRestored} student(s) restored successfully`
      );
    }

    // Restore single record
    const restored = await restore(entityType, id);
    
    return successResponse(
      restored,
      `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} restored successfully`
    );
  } catch (error) {
    console.error('Restore error:', error);
    return handleApiError(error);
  }
}

// GET /api/admin/restore - Get list of soft-deleted records that can be restored
async function handleGetRestorableRecords(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') as SoftDeletableModel;

    if (!entityType) {
      return errorResponse('entityType query parameter is required', 400);
    }

    const validEntityTypes: SoftDeletableModel[] = ['user', 'group', 'student', 'assessment', 'attendance'];
    if (!validEntityTypes.includes(entityType)) {
      return errorResponse(
        `Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`,
        400
      );
    }

    // Calculate the cutoff date (30 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - SOFT_DELETE_RETENTION_DAYS);

    // Import prisma dynamically to avoid circular dependencies
    const prisma = (await import('@/lib/prisma')).default;

    // Get soft-deleted records within restoration window
    // @ts-expect-error - Dynamic model access
    const records = await prisma[entityType].findMany({
      where: {
        isDeleted: true,
        deletedAt: {
          gte: cutoffDate,
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
      take: 100, // Limit to 100 most recent records
    });

    return successResponse({
      entityType,
      count: records.length,
      retentionDays: SOFT_DELETE_RETENTION_DAYS,
      records,
    });
  } catch (error) {
    console.error('Get restorable records error:', error);
    return handleApiError(error);
  }
}

// Export handlers wrapped with auth and rate limiting (ADMIN only)
export const POST = withAuth(withRateLimit(handleRestore, 'strict'), ['ADMIN']);
export const GET = withAuth(withRateLimit(handleGetRestorableRecords, 'moderate'), ['ADMIN']);
