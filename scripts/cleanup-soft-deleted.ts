/**
 * Scheduled Cleanup Task for Soft-Deleted Records
 * 
 * This script should be run daily to permanently delete soft-deleted records
 * that are past the 30-day retention window.
 * 
 * Setup:
 * 1. Add to cron job (Linux/Mac): 0 2 * * * node cleanup-soft-deleted.ts
 * 2. Add to Task Scheduler (Windows): Daily at 2:00 AM
 * 3. Or use a service like Vercel Cron or AWS EventBridge
 */

import prisma from '../src/lib/prisma';
import { 
  getExpiredSoftDeletedRecords, 
  hardDeleteMany,
  SoftDeletableModel,
  SOFT_DELETE_RETENTION_DAYS 
} from '../src/lib/softDelete';

const MODELS_TO_CLEAN: SoftDeletableModel[] = [
  'attendance',
  'assessment',
  'student',
  'group',
  'user',
];

async function cleanupExpiredRecords() {
  console.log(`[Cleanup] Starting soft-delete cleanup at ${new Date().toISOString()}`);
  console.log(`[Cleanup] Retention period: ${SOFT_DELETE_RETENTION_DAYS} days`);

  const results: Record<string, number> = {};
  let totalDeleted = 0;

  for (const model of MODELS_TO_CLEAN) {
    try {
      console.log(`[Cleanup] Checking ${model} records...`);
      
      // Get expired records
      const expiredIds = await getExpiredSoftDeletedRecords(model);
      
      if (expiredIds.length === 0) {
        console.log(`[Cleanup] No expired ${model} records found`);
        results[model] = 0;
        continue;
      }

      console.log(`[Cleanup] Found ${expiredIds.length} expired ${model} record(s)`);
      
      // Permanently delete expired records (ADMIN role required)
      const result = await hardDeleteMany(model, expiredIds, 'ADMIN');
      results[model] = result.count;
      totalDeleted += result.count;
      
      console.log(`[Cleanup] Permanently deleted ${result.count} ${model} record(s)`);
    } catch (error) {
      console.error(`[Cleanup] Error cleaning up ${model}:`, error);
      results[model] = -1; // Indicate error
    }
  }

  console.log('\n[Cleanup] Summary:');
  console.log('==================');
  Object.entries(results).forEach(([model, count]) => {
    if (count === -1) {
      console.log(`  ${model}: ERROR`);
    } else {
      console.log(`  ${model}: ${count} deleted`);
    }
  });
  console.log(`  TOTAL: ${totalDeleted} records permanently deleted`);
  console.log('==================\n');

  // Log cleanup to audit trail
  try {
    await prisma.auditLog.create({
      data: {
        userId: 'SYSTEM',
        action: 'CLEANUP_SOFT_DELETED',
        entityType: 'SYSTEM',
        entityId: null,
        timestamp: new Date(),
        ipAddress: 'INTERNAL',
        metadata: {
          results,
          totalDeleted,
          retentionDays: SOFT_DELETE_RETENTION_DAYS,
        },
      },
    });
  } catch (error) {
    console.error('[Cleanup] Failed to log audit entry:', error);
  }

  return results;
}

// Check if running as standalone script
if (require.main === module) {
  cleanupExpiredRecords()
    .then((results) => {
      console.log('[Cleanup] Completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Cleanup] Fatal error:', error);
      process.exit(1);
    });
}

export { cleanupExpiredRecords };
