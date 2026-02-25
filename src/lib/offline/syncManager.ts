/**
 * Offline Sync Manager
 * Handles uploading pending records to the server when connection is restored
 * Implements conflict resolution and retry logic
 */

import {
  getPendingAttendance,
  getPendingAssessments,
  markAttendanceSynced,
  markAssessmentSynced,
  markSyncError,
  updateSyncMetadata,
  getSyncStats,
  PendingAttendanceRecord,
  PendingAssessmentRecord,
} from './db';

interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

interface ConflictResolution {
  keep: 'local' | 'server';
  reason: string;
}

/**
 * Main sync function - uploads all pending records
 */
export async function syncPendingRecords(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    syncedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    // Update metadata to indicate sync in progress
    await updateSyncMetadata('last_sync', 'pending', 0);

    // Sync attendance records
    const attendanceResult = await syncAttendanceRecords();
    result.syncedCount += attendanceResult.syncedCount;
    result.failedCount += attendanceResult.failedCount;
    result.errors.push(...attendanceResult.errors);

    // Sync assessment records
    const assessmentResult = await syncAssessmentRecords();
    result.syncedCount += assessmentResult.syncedCount;
    result.failedCount += assessmentResult.failedCount;
    result.errors.push(...assessmentResult.errors);

    // Update final metadata
    const stats = await getSyncStats();
    if (result.failedCount === 0 && stats.totalPendingCount === 0) {
      result.success = true;
      await updateSyncMetadata('last_sync', 'success', 0);
    } else {
      result.success = false;
      await updateSyncMetadata(
        'last_sync',
        'error',
        stats.totalPendingCount,
        `Synced: ${result.syncedCount}, Failed: ${result.failedCount}`
      );
    }

    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    result.success = false;
    result.errors.push(errorMsg);
    await updateSyncMetadata('last_sync', 'error', 0, errorMsg);
    return result;
  }
}

/**
 * Sync attendance records
 */
async function syncAttendanceRecords(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    syncedCount: 0,
    failedCount: 0,
    errors: [],
  };

  const pendingRecords = await getPendingAttendance(false);

  if (pendingRecords.length === 0) {
    return result;
  }

  // Group records by group ID for batch processing
  const grouped = groupRecordsByGroupId(pendingRecords);

  for (const [groupId, records] of Object.entries(grouped)) {
    try {
      const response = await fetch('/api/attendance/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          records: records.map((r) => ({
            studentId: r.studentId,
            sessionDate: r.sessionDate,
            status: r.status,
            reason: r.reason,
            markedAt: r.markedAt,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle conflicts if any
      if (data.conflicts && data.conflicts.length > 0) {
        await handleConflicts(records, data.conflicts);
      }

      // Mark successfully synced records
      const successIds = records
        .filter((r) => {
          const conflict = data.conflicts?.find(
            (c: any) => c.studentId === r.studentId
          );
          return !conflict;
        })
        .map((r) => r.id!);

      if (successIds.length > 0) {
        await markAttendanceSynced(successIds);
        result.syncedCount += successIds.length;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      result.failedCount += records.length;
      result.errors.push(
        `Group ${groupId} attendance sync failed: ${errorMsg}`
      );

      // Mark records with error
      const recordIds = records.map((r) => r.id!);
      await markSyncError('attendance', recordIds, errorMsg);
    }
  }

  return result;
}

/**
 * Sync assessment records
 */
async function syncAssessmentRecords(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    syncedCount: 0,
    failedCount: 0,
    errors: [],
  };

  const pendingRecords = await getPendingAssessments(false);

  if (pendingRecords.length === 0) {
    return result;
  }

  // Group records by group ID
  const grouped = groupRecordsByGroupId(pendingRecords);

  for (const [groupId, records] of Object.entries(grouped)) {
    try {
      const response = await fetch('/api/assessments/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          records: records.map((r) => ({
            studentId: r.studentId,
            assessmentId: r.assessmentId,
            score: r.score,
            feedback: r.feedback,
            recordedAt: r.recordedAt,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle conflicts if any
      if (data.conflicts && data.conflicts.length > 0) {
        await handleConflicts(records, data.conflicts);
      }

      // Mark successfully synced records
      const successIds = records
        .filter((r) => {
          const conflict = data.conflicts?.find(
            (c: any) => c.studentId === r.studentId
          );
          return !conflict;
        })
        .map((r) => r.id!);

      if (successIds.length > 0) {
        await markAssessmentSynced(successIds);
        result.syncedCount += successIds.length;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      result.failedCount += records.length;
      result.errors.push(
        `Group ${groupId} assessment sync failed: ${errorMsg}`
      );

      // Mark records with error
      const recordIds = records.map((r) => r.id!);
      await markSyncError('assessment', recordIds, errorMsg);
    }
  }

  return result;
}

/**
 * Handle conflicting records using timestamps
 * Server wins if newer, otherwise prompt user
 */
async function handleConflicts(
  localRecords: (PendingAttendanceRecord | PendingAssessmentRecord)[],
  serverConflicts: any[]
): Promise<void> {
  for (const conflict of serverConflicts) {
    const localRecord = localRecords.find(
      (r) => r.studentId === conflict.studentId
    );

    if (!localRecord) continue;

    const localTimestamp = 'markedAt' in localRecord 
      ? localRecord.markedAt 
      : localRecord.recordedAt;

    const resolution = resolveConflict(
      localTimestamp || 0,
      conflict.serverTimestamp || 0
    );

    if (resolution.keep === 'server') {
      // Server version is newer - discard local changes
      const recordId = localRecord.id!;
      if ('sessionDate' in localRecord) {
        await markAttendanceSynced([recordId]);
      } else {
        await markAssessmentSynced([recordId]);
      }
    } else {
      // Same timestamp or local is newer - keep local and requeue
      console.warn(
        `Conflict not resolved - requeuing local version: ${localRecord.studentId}`
      );
    }
  }
}

/**
 * Resolve timestamp conflicts
 * Returns which version to keep
 */
function resolveConflict(
  localTimestamp: number,
  serverTimestamp: number
): ConflictResolution {
  const timeDiff = Math.abs(localTimestamp - serverTimestamp);

  // If timestamps differ by more than 1 second, server wins if newer
  if (timeDiff > 1000) {
    if (serverTimestamp > localTimestamp) {
      return {
        keep: 'server',
        reason: 'Server version is newer',
      };
    }
  }

  // Same minute - alert user (would be handled by UI)
  if (timeDiff < 60000) {
    return {
      keep: 'local',
      reason: 'Same minute - user intervention may be needed',
    };
  }

  // Default to local
  return {
    keep: 'local',
    reason: 'Local version kept',
  };
}

/**
 * Group records by group ID for batch processing
 */
function groupRecordsByGroupId<T extends { groupId: string }>(
  records: T[]
): Record<string, T[]> {
  return records.reduce(
    (acc, record) => {
      const groupId = record.groupId;
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(record);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Start polling for sync when online
 * Falls back to manually triggered sync or polling if background sync unavailable
 */
export function startSyncPolling(intervalMs: number = 30000): () => void {
  let pollId: NodeJS.Timeout | null = null;

  const poll = async () => {
    if (navigator.onLine) {
      console.log('[Sync] Polling - connection online, syncing...');
      await syncPendingRecords();
    }
  };

  // Start polling
  pollId = setInterval(poll, intervalMs);

  // Return cleanup function
  return () => {
    if (pollId) {
      clearInterval(pollId);
      pollId = null;
      console.log('[Sync] Polling stopped');
    }
  };
}

/**
 * Register background sync if supported
 */
export async function registerBackgroundSync(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.warn('[Sync] Background Sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if ((registration as any).sync) {
      await (registration as any).sync.register('sync-pending-records');
      console.log('[Sync] Background sync registered');
      return true;
    }
  } catch (err) {
    console.error('[Sync] Failed to register background sync:', err);
  }

  return false;
}

/**
 * Callback for when online/offline status changes
 */
export function setupOnlineStatusListener(
  callback: (isOnline: boolean) => void
): () => void {
  const handleOnline = () => {
    console.log('[Sync] Online - initiating sync');
    callback(true);
  };

  const handleOffline = () => {
    console.log('[Sync] Offline - sync paused');
    callback(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
