/**
 * React Hook for Event-Driven SWR Cache Invalidation
 * 
 * This hook integrates real-time event streaming with SWR cache invalidation,
 * allowing components to automatically refresh when relevant data changes.
 * 
 * Usage:
 *   useEventDrivenCache({
 *     'assessment:marked': (data) => ['/api/dashboard', '/api/assessments'],
 *     'attendance:bulk-marked': (data) => [`/api/groups/${data.groupId}`],
 *   });
 */

'use client';

import { useEffect } from 'react';
import { mutate as globalMutate } from 'swr';
import { useEventStream, StreamEvent } from './useEventStream';

export interface CacheInvalidationMap {
  [eventType: string]: (eventData: any) => string[] | RegExp[];
}

/**
 * Hook to automatically invalidate SWR caches based on events
 * 
 * @param invalidationMap - Map of event types to cache key patterns to invalidate
 */
export function useEventDrivenCache(invalidationMap: CacheInvalidationMap): void {
  const events = useEventStream();

  useEffect(() => {
    // Register event listeners for cache invalidation
    Object.entries(invalidationMap).forEach(([eventType, getKeys]) => {
      events.on(eventType, async (streamEvent: StreamEvent) => {
        try {
          const keys = getKeys(streamEvent.data);

          console.log(`🔄 Invalidating cache for ${eventType}:`, keys);

          // Invalidate each key
          for (const key of keys) {
            if (typeof key === 'string') {
              // String key - exact match
              await globalMutate(key);
            } else {
              // RegExp - pattern match
              await globalMutate((k: any) => typeof k === 'string' && key.test(k));
            }
          }
        } catch (error) {
          console.error(`Error invalidating cache for ${eventType}:`, error);
        }
      });
    });
  }, [events, invalidationMap]);
}

/**
 * Higher-level hook for common invalidation patterns
 * Automatically handles most use cases without custom mapping
 */
export function useAutoInvalidateSWRCache(): void {
  const events = useEventStream();

  useEffect(() => {
    // Student updated - invalidate student and group caches
    events.on('student:updated', async ({ data }) => {
      console.log('🔄 Invalidating student cache:', data.studentId);
      await globalMutate((key: any) =>
        typeof key === 'string' && (
          key.includes('/api/students') ||
          key.includes('/api/dashboard')
        )
      );

      if (data.groupId) {
        await globalMutate((key: any) =>
          typeof key === 'string' && key.includes(`/api/groups/${data.groupId}`)
        );
      }
    });

    // Assessment marked - invalidate assessment, student, and group caches
    events.on('assessment:marked', async ({ data }) => {
      console.log('🔄 Invalidating assessment cache:', data.assessmentId);
      await globalMutate((key: any) =>
        typeof key === 'string' && (
          key.includes('/api/assessments') ||
          key.includes(`/api/students/${data.studentId}`) ||
          key.includes('/api/dashboard')
        )
      );

      if (data.groupId) {
        await globalMutate((key: any) =>
          typeof key === 'string' && key.includes(`/api/groups/${data.groupId}`)
        );
      }
    });

    // Attendance bulk marked - invalidate attendance and group caches
    events.on('attendance:bulk-marked', async ({ data }) => {
      console.log('🔄 Invalidating attendance cache:', data.count, 'records');
      await globalMutate((key: any) =>
        typeof key === 'string' && (
          key.includes('/api/attendance') ||
          key.includes('/api/dashboard')
        )
      );

      if (data.groupId) {
        await globalMutate((key: any) =>
          typeof key === 'string' && key.includes(`/api/groups/${data.groupId}`)
        );
      }
    });

    // Group modified - invalidate group and dashboard caches
    events.on('group:modified', async ({ data }) => {
      console.log('🔄 Invalidating group cache:', data.groupId);
      await globalMutate((key: any) =>
        typeof key === 'string' && (
          key.includes('/api/groups') ||
          key.includes('/api/dashboard')
        )
      );
    });

    // Module completed - invalidate student and group caches
    events.on('module:completed', async ({ data }) => {
      console.log('🔄 Invalidating module cache:', data.moduleId);
      await globalMutate((key: any) =>
        typeof key === 'string' && (
          key.includes(`/api/students/${data.studentId}`) ||
          key.includes('/api/dashboard')
        )
      );

      if (data.groupId) {
        await globalMutate((key: any) =>
          typeof key === 'string' && key.includes(`/api/groups/${data.groupId}`)
        );
      }
    });
  }, [events]);
}

/**
 * Example usage in a component:
 * 
 * function Dashboard() {
 *   // Automatically invalidate caches on events
 *   useAutoInvalidateSWRCache();
 * 
 *   const { data: stats } = useSWR('/api/dashboard/stats');
 * 
 *   return <div>Dashboard with auto-invalidating cache</div>;
 * }
 */
