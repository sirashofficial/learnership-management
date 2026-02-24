/**
 * Centralized Cache Invalidation Library
 * 
 * This module provides helpers to invalidate SWR caches after data mutations,
 * ensuring data synchronization across all views in the application.
 * 
 * Usage:
 *   import { invalidateGroups, invalidateAttendance } from '@/lib/cache-invalidation';
 *   
 *   // After creating/updating a group:
 *   await invalidateGroups();
 *   
 *   // After marking attendance:
 *   await invalidateAttendance();
 */

import { mutate as globalMutate } from 'swr';

/**
 * Invalidates all group-related caches.
 * 
 * Use after: Creating, updating, deleting, merging groups, uploading bulk groups
 * Affects: Dashboard stats, group lists, group selectors, group progress metrics
 * 
 * Endpoints invalidated:
 * - /api/groups (all group lists)
 * - /api/groups/summary (lightweight group summary)
 * - /api/groups/progress (group performance metrics)
 * - /api/dashboard/stats (dashboard statistics)
 * - /api/dashboard/summary/lite (lightweight dashboard summary)
 */
export const invalidateGroups = async () => {
  try {
    await globalMutate('/api/groups');
    await globalMutate('/api/groups/summary'); // NEW: Lightweight API
    await globalMutate('/api/groups/progress');
    await globalMutate('/api/dashboard/stats');
    await globalMutate('/api/dashboard/summary/lite'); // NEW: Lightweight API
    console.log('✅ Groups cache invalidated (including summaries)');
  } catch (error) {
    console.error('❌ Error invalidating groups cache:', error);
  }
};

/**
 * Invalidates all student-related caches.
 * 
 * Use after: Creating, updating, deleting students, adjusting credits, bulk archiving
 * Affects: Student lists, group counts, dashboard metrics, group progress
 * 
 * Endpoints invalidated:
 * - /api/students (all student lists)
 * - /api/students/summary (lightweight student summary)
 * - /api/groups (group counts change when students added/removed)
 * - /api/groups/summary (lightweight group summary)
 * - /api/groups/progress (student changes affect group metrics)
 * - /api/dashboard/stats (dashboard statistics)
 * - /api/dashboard/summary/lite (lightweight dashboard summary)
 * - /api/dashboard/alerts (student-related alerts)
 */
export const invalidateStudents = async () => {
  try {
    await globalMutate('/api/students');
    await globalMutate('/api/students/summary'); // NEW: Lightweight API
    await globalMutate('/api/groups');
    await globalMutate('/api/groups/summary'); // NEW: Lightweight API
    await globalMutate('/api/groups/progress');
    await globalMutate('/api/dashboard/stats');
    await globalMutate('/api/dashboard/summary/lite'); // NEW: Lightweight API
    await globalMutate('/api/dashboard/alerts');
    console.log('✅ Students cache invalidated (including summaries)');
  } catch (error) {
    console.error('❌ Error invalidating students cache:', error);
  }
};

/**
 * Invalidates all assessment-related caches.
 * 
 * Use after: Creating assessments, marking competent/NYC, bulk generating, moderating
 * Affects: Assessment lists, student progress, group progress, dashboard metrics
 * 
 * Endpoints invalidated:
 * - /api/assessments/* (all assessment endpoints with wildcard)
 * - /api/assessments/detail (paginated assessment details)
 * - /api/students (student progress changes)
 * - /api/students/summary (lightweight student summary)
 * - /api/groups (group progress changes)
 * - /api/groups/summary (lightweight group summary)
 * - /api/groups/progress (group performance metrics)
 * - /api/dashboard/stats (dashboard statistics)
 * - /api/dashboard/summary/lite (lightweight dashboard summary)
 * - /api/dashboard/alerts (completion alerts)
 * - /api/dashboard/recent-activity (new assessment activity)
 */
export const invalidateAssessments = async () => {
  try {
    // Invalidate all assessment endpoints using wildcard pattern
    await globalMutate(
      (key: any) => typeof key === 'string' && key.startsWith('/api/assessments')
    );
    await globalMutate('/api/students');
    await globalMutate('/api/students/summary'); // NEW: Lightweight API
    await globalMutate('/api/groups');
    await globalMutate('/api/groups/summary'); // NEW: Lightweight API
    await globalMutate('/api/data/groups'); // GroupsContext + dashboard groups list
    await globalMutate('/api/groups/progress');
    await globalMutate('/api/dashboard/stats');
    await globalMutate('/api/dashboard/summary/lite'); // NEW: Lightweight API
    await globalMutate('/api/dashboard/alerts');
    await globalMutate('/api/dashboard/recent-activity');
    console.log('✅ Assessments cache invalidated (including summaries)');
  } catch (error) {
    console.error('❌ Error invalidating assessments cache:', error);
  }
};

/**
 * Invalidates all attendance-related caches.
 * 
 * Use after: Marking attendance, bulk attendance, updating policies, resolving alerts
 * Affects: Attendance stats, group attendance rates, compliance alerts, dashboard
 * 
 * Endpoints invalidated:
 * - /api/attendance/* (all attendance endpoints with wildcard)
 * - /api/groups (group attendance rates change)
 * - /api/groups/progress (attendance affects group metrics)
 * - /api/dashboard/stats (dashboard statistics)
 * - /api/dashboard/alerts (attendance alerts)
 */
export const invalidateAttendance = async () => {
  try {
    // Invalidate all attendance endpoints using wildcard pattern
    await globalMutate(
      (key: any) => typeof key === 'string' && key.includes('/api/attendance')
    );
    await globalMutate('/api/groups');
    await globalMutate('/api/data/groups'); // GroupsContext + dashboard groups list
    await globalMutate('/api/groups/progress');
    await globalMutate('/api/dashboard/stats');
    await globalMutate('/api/dashboard/alerts');
    console.log('✅ Attendance cache invalidated');
  } catch (error) {
    console.error('❌ Error invalidating attendance cache:', error);
  }
};

/**
 * Invalidates all dashboard-specific caches.
 * 
 * Use after: Major data changes, manual refresh requests
 * Affects: Dashboard statistics, alerts, recent activity, schedule
 * 
 * Endpoints invalidated:
 * - /api/dashboard/stats (main dashboard statistics)
 * - /api/dashboard/alerts (alert notifications)
 * - /api/dashboard/recent-activity (activity feed)
 * - /api/dashboard/schedule (upcoming schedule)
 */
export const invalidateDashboard = async () => {
  try {
    await globalMutate('/api/dashboard/stats');
    await globalMutate('/api/dashboard/alerts');
    await globalMutate('/api/dashboard/recent-activity');
    await globalMutate('/api/dashboard/schedule');
    console.log('✅ Dashboard cache invalidated');
  } catch (error) {
    console.error('❌ Error invalidating dashboard cache:', error);
  }
};

/**
 * Invalidates ALL application caches.
 * 
 * Use sparingly: Only for critical operations or emergency full refresh
 * Causes significant API traffic as all data is refetched
 * 
 * Better practice: Use specific invalidation functions above
 */
export const invalidateAll = async () => {
  try {
    console.warn('⚠️ Performing full cache invalidation - this triggers many API calls');
    await invalidateGroups();
    await invalidateStudents();
    await invalidateAssessments();
    await invalidateAttendance();
    await invalidateDashboard();
    console.log('✅ All caches invalidated');
  } catch (error) {
    console.error('❌ Error invalidating all caches:', error);
  }
};

/**
 * Type-safe cache key helper for custom invalidations
 */
export type CacheKey = string | RegExp | ((key: any) => boolean);

/**
 * Custom cache invalidation with specific key pattern
 * 
 * @param keyPattern - String, regex, or function to match cache keys
 * @param additionalKeys - Additional specific keys to invalidate
 * 
 * @example
 * // Invalidate specific student and their group
 * await invalidateCustom(
 *   (key) => key.includes('/api/students/123'),
 *   ['/api/groups/abc']
 * );
 */
export const invalidateCustom = async (
  keyPattern: CacheKey,
  additionalKeys: string[] = []
) => {
  try {
    if (typeof keyPattern === 'function') {
      await globalMutate(keyPattern);
    } else if (keyPattern instanceof RegExp) {
      await globalMutate((key: any) => typeof key === 'string' && keyPattern.test(key));
    } else {
      await globalMutate(keyPattern);
    }

    for (const key of additionalKeys) {
      await globalMutate(key);
    }

    console.log('✅ Custom cache invalidation completed');
  } catch (error) {
    console.error('❌ Error in custom cache invalidation:', error);
  }
};

/**
 * CENTRALIZED Cache Invalidation by Event Type
 * 
 * This is the MAIN FUNCTION to use for all mutations.
 * It automatically determines which caches to invalidate based on the event type.
 * 
 * @param event - The type of mutation that occurred
 * 
 * Supported event types:
 * - 'assessment:mark' - Mark assessment as competent/NYC
 * - 'assessment:create' - Create new assessment
 * - 'assessment:delete' - Delete assessment
 * - 'assessment:moderate' - Moderate assessment
 * - 'student:add' - Add new learner to group
 * - 'student:update' - Update student details
 * - 'student:delete' - Delete/archive student
 * - 'student:bulk-archive' - Bulk archive students
 * - 'attendance:record' - Record session attendance
 * - 'attendance:bulk' - Bulk mark attendance
 * - 'attendance:update' - Update attendance record
 * - 'group:create' - Create new group
 * - 'group:update' - Update group
 * - 'group:delete' - Delete/archive group
 * - 'group:merge' - Merge groups
 * 
 * @example
 * // After marking an assessment
 * await invalidateRelatedCache('assessment:mark');
 * 
 * // After adding a student
 * await invalidateRelatedCache('student:add');
 * 
 * // After recording attendance
 * await invalidateRelatedCache('attendance:record');
 */
export const invalidateRelatedCache = async (event: string) => {
  console.log(`🔄 Invalidating cache for event: ${event}`);

  try {
    // Map of events to their related cache keys
    const eventMap: { [key: string]: (string | ((key: any) => boolean))[] } = {
      // ===== ASSESSMENT EVENTS =====
      'assessment:mark': [
        '/api/assessments',
        (key: any) => typeof key === 'string' && key.startsWith('/api/assessments'),
        '/api/students',
        '/api/groups',
        '/api/groups/progress',
        '/api/dashboard/stats',
        '/api/dashboard/alerts',
        '/api/dashboard/recent-activity',
      ],
      'assessment:create': [
        '/api/assessments',
        (key: any) => typeof key === 'string' && key.startsWith('/api/assessments'),
        '/api/students',
        '/api/groups',
        '/api/groups/progress',
        '/api/dashboard/stats',
        '/api/dashboard/alerts',
        '/api/dashboard/recent-activity',
      ],
      'assessment:delete': [
        '/api/assessments',
        (key: any) => typeof key === 'string' && key.startsWith('/api/assessments'),
        '/api/students',
        '/api/groups',
        '/api/groups/progress',
        '/api/dashboard/stats',
        '/api/dashboard/alerts',
        '/api/dashboard/recent-activity',
      ],
      'assessment:moderate': [
        '/api/assessments',
        (key: any) => typeof key === 'string' && key.startsWith('/api/assessments'),
        '/api/dashboard/alerts',
        '/api/dashboard/recent-activity',
      ],

      // ===== STUDENT EVENTS =====
      'student:add': [
        '/api/students',
        (key: any) => typeof key === 'string' && key.startsWith('/api/students'),
        '/api/groups',
        '/api/groups/progress',
        '/api/dashboard/stats',
        '/api/dashboard/alerts',
        '/api/dashboard/recent-activity',
      ],
      'student:update': [
        '/api/students',
        (key: any) => typeof key === 'string' && key.startsWith('/api/students'),
        '/api/groups/progress',
        '/api/dashboard/stats',
      ],
      'student:delete': [
        '/api/students',
        (key: any) => typeof key === 'string' && key.startsWith('/api/students'),
        '/api/groups',
        '/api/groups/progress',
        '/api/dashboard/stats',
        '/api/dashboard/alerts',
        '/api/dashboard/recent-activity',
      ],
      'student:bulk-archive': [
        '/api/students',
        (key: any) => typeof key === 'string' && key.startsWith('/api/students'),
        '/api/groups',
        '/api/groups/progress',
        '/api/dashboard/stats',
        '/api/dashboard/alerts',
      ],

      // ===== ATTENDANCE EVENTS =====
      'attendance:record': [
        '/api/attendance',
        (key: any) => typeof key === 'string' && key.includes('/api/attendance'),
        '/api/groups',
        '/api/groups/progress',
        '/api/dashboard/stats',
        '/api/dashboard/alerts',
        '/api/dashboard/recent-activity',
      ],
      'attendance:bulk': [
        '/api/attendance',
        (key: any) => typeof key === 'string' && key.includes('/api/attendance'),
        '/api/groups',
        '/api/groups/progress',
        '/api/dashboard/stats',
        '/api/dashboard/alerts',
        '/api/dashboard/recent-activity',
      ],
      'attendance:update': [
        '/api/attendance',
        (key: any) => typeof key === 'string' && key.includes('/api/attendance'),
        '/api/dashboard/stats',
        '/api/dashboard/alerts',
      ],

      // ===== GROUP EVENTS =====
      'group:create': [
        '/api/groups',
        (key: any) => typeof key === 'string' && key.startsWith('/api/groups'),
        '/api/groups/progress',
        '/api/dashboard/stats',
        '/api/dashboard/alerts',
        '/api/dashboard/recent-activity',
      ],
      'group:update': [
        '/api/groups',
        (key: any) => typeof key === 'string' && key.startsWith('/api/groups'),
        '/api/groups/progress',
        '/api/dashboard/stats',
      ],
      'group:delete': [
        '/api/groups',
        (key: any) => typeof key === 'string' && key.startsWith('/api/groups'),
        '/api/groups/progress',
        '/api/dashboard/stats',
        '/api/dashboard/alerts',
      ],
      'group:merge': [
        '/api/groups',
        (key: any) => typeof key === 'string' && key.startsWith('/api/groups'),
        '/api/groups/progress',
        '/api/students',
        '/api/assessments',
        (key: any) => typeof key === 'string' && key.startsWith('/api/assessments'),
        '/api/dashboard/stats',
        '/api/dashboard/alerts',
        '/api/dashboard/recent-activity',
      ],
    };

    // Get the cache keys for this event
    const keysToInvalidate = eventMap[event] || [];

    if (keysToInvalidate.length === 0) {
      console.warn(`⚠️ Unknown event type: ${event}`);
      return;
    }

    // Invalidate each key
    for (const key of keysToInvalidate) {
      if (typeof key === 'function') {
        await globalMutate(key);
      } else {
        await globalMutate(key);
      }
    }

    console.log(`✅ Cache invalidated for event: ${event} (${keysToInvalidate.length} keys)`);
  } catch (error) {
    console.error(`❌ Error invalidating cache for event ${event}:`, error);
  }
};
