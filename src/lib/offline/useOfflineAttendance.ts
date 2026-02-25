/**
 * Hook for offline attendance marking
 * Stores attendance marks locally when offline, syncs when online
 */

'use client';

import { useState, useCallback } from 'react';
import { useIsOnline } from './useOfflineStatus';
import {
  addPendingAttendance,
  cacheStudents,
  CachedStudent,
  getSyncStats,
} from '@/lib/offline/db';

export interface AttendanceMarkResult {
  success: boolean;
  synced: boolean;
  pendingSync: boolean;
  error?: string;
}

/**
 * useOfflineAttendance: Handle marking attendance with offline support
 */
export function useOfflineAttendance() {
  const isOnline = useIsOnline();
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const stats = await getSyncStats();
    setPendingCount(stats.pendingAttendanceCount);
  }, []);

  /**
   * Mark attendance with offline fallback
   */
  const markAttendance = useCallback(
    async (
      studentId: string,
      groupId: string,
      sessionDate: string,
      status: 'present' | 'absent' | 'late' | 'excused',
      reason?: string
    ): Promise<AttendanceMarkResult> => {
      try {
        if (isOnline) {
          // Try online API first
          try {
            const response = await fetch('/api/attendance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studentId,
                groupId,
                sessionDate,
                status,
                reason,
              }),
            });

            if (response.ok) {
              setError(null);
              return { success: true, synced: true, pendingSync: false };
            } else {
              // Fall through to offline storage
              throw new Error('API error');
            }
          } catch (apiErr) {
            // Network error - store locally
            console.warn('[Attendance] API failed, storing locally:', apiErr);
          }
        }

        // Store locally (offline or API failed)
        await addPendingAttendance({
          studentId,
          groupId,
          sessionDate,
          status,
          reason,
          markedAt: Date.now(),
          synced: false,
        });

        await updatePendingCount();
        setError(null);

        return {
          success: true,
          synced: false,
          pendingSync: true,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to mark attendance';
        setError(errorMsg);
        return {
          success: false,
          synced: false,
          pendingSync: false,
          error: errorMsg,
        };
      }
    },
    [isOnline, updatePendingCount]
  );

  /**
   * Cache student roster for offline access
   */
  const cacheStudentRoster = useCallback(
    async (students: any[]) => {
      try {
        const cachedStudents: CachedStudent[] = students.map((s) => ({
          id: s.id,
          name: s.name || '',
          surname: s.surname || '',
          email: s.email || '',
          phone: s.phone,
          groupIds: s.groupIds || [],
          cachedAt: Date.now(),
        }));

        await cacheStudents(cachedStudents);
        console.log('[Attendance] Cached', cachedStudents.length, 'students');
      } catch (err) {
        console.error('[Attendance] Failed to cache students:', err);
      }
    },
    []
  );

  return {
    markAttendance,
    cacheStudentRoster,
    isOnline,
    error,
    pendingCount,
    updatePendingCount,
  };
}

/**
 * Hook for offline assessment marking
 */
export function useOfflineAssessment() {
  const isOnline = useIsOnline();
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const updatePendingCount = useCallback(async () => {
    const stats = await getSyncStats();
    setPendingCount(stats.pendingAssessmentCount);
  }, []);

  const recordAssessment = useCallback(
    async (
      studentId: string,
      groupId: string,
      assessmentId: string,
      score: number,
      feedback?: string
    ): Promise<AttendanceMarkResult> => {
      try {
        if (isOnline) {
          try {
            const response = await fetch('/api/assessments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studentId,
                groupId,
                assessmentId,
                score,
                feedback,
              }),
            });

            if (response.ok) {
              setError(null);
              return { success: true, synced: true, pendingSync: false };
            } else {
              throw new Error('API error');
            }
          } catch (apiErr) {
            console.warn('[Assessment] API failed, storing locally:', apiErr);
          }
        }

        // Import here to avoid circular dependency
        const { addPendingAssessment } = await import('@/lib/offline/db');

        await addPendingAssessment({
          studentId,
          groupId,
          assessmentId,
          score,
          feedback,
          recordedAt: Date.now(),
          synced: false,
        });

        await updatePendingCount();
        setError(null);

        return {
          success: true,
          synced: false,
          pendingSync: true,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to record assessment';
        setError(errorMsg);
        return {
          success: false,
          synced: false,
          pendingSync: false,
          error: errorMsg,
        };
      }
    },
    [isOnline, updatePendingCount]
  );

  return {
    recordAssessment,
    isOnline,
    error,
    pendingCount,
    updatePendingCount,
  };
}
