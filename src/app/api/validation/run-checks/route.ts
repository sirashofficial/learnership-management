import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';
import {
  runAllDataIntegrityChecks,
  DATA_INTEGRITY_THRESHOLDS,
  DataIntegrityIssue,
} from '@/lib/validation/dataIntegrityChecks';

export const dynamic = 'force-dynamic';

function addRepairAction(issue: DataIntegrityIssue) {
  const repairActionMap: Record<string, string | null> = {
    student_progress: 'recalculate_progress',
    group_rollout: 'sync_rollout',
    attendance_rates: null,
    orphaned_records: 'cleanup_orphans',
  };

  return {
    ...issue,
    repairAction: repairActionMap[issue.checkType] || undefined,
  };
}

async function handleGet(request: NextRequest) {
  try {
    const inconsistencies = await runAllDataIntegrityChecks();
    const criticalCount = inconsistencies.filter((issue) => issue.severity === 'critical').length;
    const warningCount = inconsistencies.filter((issue) => issue.severity === 'warning').length;

    if (inconsistencies.length > 0) {
      await prisma.dataIntegrityLog.createMany({
        data: inconsistencies.map((issue) => ({
          checkType: issue.checkType,
          severity: issue.severity,
          description: issue.description,
          entityId: issue.entityId,
        })),
      });
    }

    const responseIssues = inconsistencies.map(addRepairAction);

    return successResponse({
      summary: {
        totalIssues: inconsistencies.length,
        critical: criticalCount,
        warnings: warningCount,
        timestamp: new Date().toISOString(),
      },
      thresholds: DATA_INTEGRITY_THRESHOLDS,
      inconsistencies: responseIssues,
    });
  } catch (error: any) {
    console.error('Data integrity run-checks error:', error);
    return errorResponse(error?.message || 'Failed to run data integrity checks', 500);
  }
}

export const GET = withAuth(withRateLimit(handleGet, 'strict'), ['ADMIN']);
