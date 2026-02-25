import { NextRequest, NextResponse } from 'next/server';
import { 
  refreshGroupStats, 
  refreshAllStats, 
  getLastRefreshTime 
} from '@/lib/calculations/materializedViewManager';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

/**
 * Admin endpoint to manually trigger materialized view refresh
 * 
 * POST /api/admin/refresh-stats
 * 
 * Query params:
 * - groupId: (optional) Refresh specific group only
 * - force: (optional) Force refresh even if recently updated
 * 
 * Examples:
 * - POST /api/admin/refresh-stats (refresh all groups)
 * - POST /api/admin/refresh-stats?groupId=abc123 (refresh specific group)
 * - POST /api/admin/refresh-stats?force=true (force full refresh)
 */
async function refreshStatsHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('groupId');
    const force = searchParams.get('force') === 'true';

    // Refresh specific group
    if (groupId) {
      // Validate group exists
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { id: true, name: true },
      });

      if (!group) {
        return errorResponse('Group not found', 404);
      }

      // Check if refresh needed (unless forced)
      if (!force) {
        const lastRefresh = await getLastRefreshTime(groupId);
        if (lastRefresh) {
          const tenMinutesAgo = new Date();
          tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
          
          if (lastRefresh > tenMinutesAgo) {
            return successResponse({
              message: 'Stats were recently refreshed',
              groupId,
              groupName: group.name,
              lastRefresh,
              skipped: true,
            });
          }
        }
      }

      const startTime = Date.now();
      await refreshGroupStats(groupId);
      const duration = Date.now() - startTime;

      const stats = await prisma.groupStats.findUnique({
        where: { groupId },
      });

      return successResponse({
        message: 'Group stats refreshed successfully',
        groupId,
        groupName: group.name,
        duration: `${duration}ms`,
        stats,
      });
    }

    // Refresh all groups
    const startTime = Date.now();
    await refreshAllStats();
    const duration = Date.now() - startTime;

    const totalGroups = await prisma.group.count();
    const statsCount = await prisma.groupStats.count();

    return successResponse({
      message: 'All stats refreshed successfully',
      duration: `${duration}ms`,
      totalGroups,
      statsRefreshed: statsCount,
    });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Get status of materialized views
 * 
 * GET /api/admin/refresh-stats
 * 
 * Returns information about cache status and last refresh times
 */
async function getRefreshStatsHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('groupId');

    // Get status for specific group
    if (groupId) {
      const [group, stats] = await Promise.all([
        prisma.group.findUnique({
          where: { id: groupId },
          select: { id: true, name: true },
        }),
        prisma.groupStats.findUnique({
          where: { groupId },
        }),
      ]);

      if (!group) {
        return errorResponse('Group not found', 404);
      }

      const lastRefresh = await getLastRefreshTime(groupId);
      const age = lastRefresh 
        ? Math.round((Date.now() - lastRefresh.getTime()) / 1000 / 60) // minutes
        : null;

      return successResponse({
        groupId,
        groupName: group.name,
        hasCachedStats: !!stats,
        lastRefresh,
        ageMinutes: age,
        stats,
      });
    }

    // Get overall status
    const [totalGroups, cachedGroups, oldestCache, newestCache] = await Promise.all([
      prisma.group.count(),
      prisma.groupStats.count(),
      prisma.groupStats.findFirst({
        orderBy: { lastCalculatedAt: 'asc' },
        select: { groupId: true, lastCalculatedAt: true },
      }),
      prisma.groupStats.findFirst({
        orderBy: { lastCalculatedAt: 'desc' },
        select: { groupId: true, lastCalculatedAt: true },
      }),
    ]);

    const cachePercentage = totalGroups > 0 
      ? Math.round((cachedGroups / totalGroups) * 100) 
      : 0;

    const oldestAge = oldestCache
      ? Math.round((Date.now() - oldestCache.lastCalculatedAt.getTime()) / 1000 / 60)
      : null;

    return successResponse({
      totalGroups,
      cachedGroups,
      cachePercentage,
      needsInitialization: cachedGroups === 0,
      oldestCache: oldestCache ? {
        groupId: oldestCache.groupId,
        lastCalculatedAt: oldestCache.lastCalculatedAt,
        ageMinutes: oldestAge,
      } : null,
      newestCache: newestCache ? {
        groupId: newestCache.groupId,
        lastCalculatedAt: newestCache.lastCalculatedAt,
      } : null,
    });

  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(withRateLimit(refreshStatsHandler, 'moderate'), ['ADMIN']);
export const GET = withAuth(withRateLimit(getRefreshStatsHandler, 'moderate'), ['ADMIN']);
