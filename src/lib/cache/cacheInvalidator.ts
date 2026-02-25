/**
 * Cache Invalidator - Event-driven cache updates using SWR
 * 
 * Subscribes to events from eventBus and invalidates related SWR cache keys
 * using pattern matching. This ensures that when data changes, all affected
 * caches are immediately invalidated.
 * 
 * Replaces polling with push-based updates, reducing server load and improving
 * real-time data consistency.
 */

'use client';

import { mutate } from 'swr';
import {
  eventBus,
  AssessmentMarkedPayload,
  AttendanceBulkMarkedPayload,
  StudentUpdatedPayload,
  GroupModifiedPayload,
  ModuleCompletedPayload,
  EventPayload,
} from '../events/eventBus';

/**
 * Initialize event listeners for cache invalidation
 * Call this once at app startup (e.g., in middleware or root layout)
 */
export function initializeCacheInvalidation(): void {
  console.log('🔄 Initializing event-driven cache invalidation...');

  // Subscribe to student updates
  eventBus.on('student:updated', handleStudentUpdated as any);

  // Subscribe to assessment marked
  eventBus.on('assessment:marked', handleAssessmentMarked as any);

  // Subscribe to bulk attendance
  eventBus.on('attendance:bulk-marked', handleAttendanceBulkMarked as any);

  // Subscribe to group modifications
  eventBus.on('group:modified', handleGroupModified as any);

  // Subscribe to module completion
  eventBus.on('module:completed', handleModuleCompleted as any);

  console.log('✅ Cache invalidation listeners registered');
}

/**
 * Pattern-based cache invalidator
 * Invalidates all SWR cache keys matching the pattern
 */
async function invalidateCachePattern(pattern: string | RegExp | ((key: any) => boolean)): Promise<void> {
  try {
    await mutate(pattern);
  } catch (error) {
    console.error(`❌ Error invalidating cache pattern:`, error);
  }
}

/**
 * Handle student:updated events
 * When a student is created/updated/deleted, invalidate:
 * - Student lists and summaries
 * - Dashboard stats
 * - Group metrics
 */
async function handleStudentUpdated(payload: StudentUpdatedPayload): Promise<void> {
  console.log(`📤 Processing student:updated event for ${payload.studentId}`);

  try {
    // Invalidate student-specific endpoints
    await invalidateCachePattern((key: any) => 
      typeof key === 'string' && (
        key.startsWith('/api/students') ||
        key.includes(`studentId=${payload.studentId}`) ||
        key.includes(`/api/students/${payload.studentId}`)
      )
    );

    // If we have groupId, invalidate group metrics
    if (payload.groupId) {
      await invalidateCachePattern((key: any) => 
        typeof key === 'string' && (
          key.startsWith('/api/groups') ||
          key.includes(`groupId=${payload.groupId}`) ||
          key.includes(`/api/groups/${payload.groupId}`)
        )
      );
    }

    // Always invalidate dashboard stats (student count, progress)
    await invalidateCachePattern((key: any) => 
      typeof key === 'string' && key.startsWith('/api/dashboard')
    );

    console.log(`✅ Cache invalidated for student ${payload.studentId} (${payload.action})`);
  } catch (error) {
    console.error(`❌ Error handling student:updated event:`, error);
  }
}

/**
 * Handle assessment:marked events
 * When an assessment is marked, invalidate:
 * - Assessment lists
 * - Student progress data
 * - Group progress metrics
 * - Dashboard stats
 */
async function handleAssessmentMarked(payload: AssessmentMarkedPayload): Promise<void> {
  console.log(`📤 Processing assessment:marked event for ${payload.assessmentId}`);

  try {
    // Invalidate all assessment endpoints
    await invalidateCachePattern((key: any) => 
      typeof key === 'string' && key.startsWith('/api/assessments')
    );

    // Invalidate student progress (assessment affects student progress tracking)
    if (payload.studentId) {
      await invalidateCachePattern((key: any) => 
        typeof key === 'string' && (
          key.includes(`/api/students/${payload.studentId}`) ||
          key.includes(`studentId=${payload.studentId}`) ||
          key.includes('/api/progress')
        )
      );
    }

    // Invalidate group metrics (assessment affects group completion rates)
    if (payload.groupId) {
      await invalidateCachePattern((key: any) => 
        typeof key === 'string' && (
          key.includes(`/api/groups/${payload.groupId}`) ||
          key.includes(`groupId=${payload.groupId}`) ||
          key.includes('/api/groups/progress')
        )
      );
    }

    // Always invalidate dashboard stats
    await invalidateCachePattern((key: any) => 
      typeof key === 'string' && key.startsWith('/api/dashboard')
    );

    console.log(`✅ Cache invalidated for assessment ${payload.assessmentId} (${payload.result})`);
  } catch (error) {
    console.error(`❌ Error handling assessment:marked event:`, error);
  }
}

/**
 * Handle attendance:bulk-marked events
 * When bulk attendance is marked, invalidate:
 * - Attendance records
 * - Group attendance rates
 * - Dashboard attendance metrics
 */
async function handleAttendanceBulkMarked(payload: AttendanceBulkMarkedPayload): Promise<void> {
  console.log(`📤 Processing attendance:bulk-marked event for ${payload.count} records`);

  try {
    // Invalidate all attendance endpoints
    await invalidateCachePattern((key: any) => 
      typeof key === 'string' && key.includes('/api/attendance')
    );

    // Invalidate group metrics (attendance is part of group metrics)
    if (payload.groupId) {
      await invalidateCachePattern((key: any) => 
        typeof key === 'string' && (
          key.includes(`/api/groups/${payload.groupId}`) ||
          key.includes(`groupId=${payload.groupId}`)
        )
      );
    }

    // Always invalidate dashboard stats and alerts
    await invalidateCachePattern((key: any) => 
      typeof key === 'string' && (
        key.startsWith('/api/dashboard') ||
        key.includes('/api/alerts')
      )
    );

    console.log(`✅ Cache invalidated for bulk attendance (${payload.count} records)`);
  } catch (error) {
    console.error(`❌ Error handling attendance:bulk-marked event:`, error);
  }
}

/**
 * Handle group:modified events
 * When a group is created/updated/deleted, invalidate:
 * - Group lists
 * - Group details
 * - Dashboard stats
 */
async function handleGroupModified(payload: GroupModifiedPayload): Promise<void> {
  console.log(`📤 Processing group:modified event for ${payload.groupId}`);

  try {
    // Invalidate all group endpoints
    await invalidateCachePattern((key: any) => 
      typeof key === 'string' && (
        key.startsWith('/api/groups') ||
        key.includes(`groupId=${payload.groupId}`) ||
        key.includes(`/api/groups/${payload.groupId}`)
      )
    );

    // Always invalidate dashboard stats
    await invalidateCachePattern((key: any) => 
      typeof key === 'string' && key.startsWith('/api/dashboard')
    );

    console.log(`✅ Cache invalidated for group ${payload.groupId} (${payload.action})`);
  } catch (error) {
    console.error(`❌ Error handling group:modified event:`, error);
  }
}

/**
 * Handle module:completed events
 * When a module is marked complete, invalidate:
 * - Student progress
 * - Group progress
 * - Dashboard stats
 */
async function handleModuleCompleted(payload: ModuleCompletedPayload): Promise<void> {
  console.log(`📤 Processing module:completed event for ${payload.moduleId}`);

  try {
    // Invalidate student progress endpoints
    if (payload.studentId) {
      await invalidateCachePattern((key: any) => 
        typeof key === 'string' && (
          key.includes(`/api/students/${payload.studentId}`) ||
          key.includes(`studentId=${payload.studentId}`) ||
          key.includes('/api/progress')
        )
      );
    }

    // Invalidate group progress
    if (payload.groupId) {
      await invalidateCachePattern((key: any) => 
        typeof key === 'string' && (
          key.includes(`/api/groups/${payload.groupId}`) ||
          key.includes('/api/groups/progress')
        )
      );
    }

    // Always invalidate dashboard stats
    await invalidateCachePattern((key: any) => 
      typeof key === 'string' && key.startsWith('/api/dashboard')
    );

    console.log(`✅ Cache invalidated for module completion ${payload.moduleId}`);
  } catch (error) {
    console.error(`❌ Error handling module:completed event:`, error);
  }
}

/**
 * Export helper for manual cache invalidation if needed
 * This maintains backward compatibility with existing code
 */
export const manualInvalidate = {
  /**
   * Invalidate all student-related caches
   * Keep existing API for backward compatibility
   */
  students: async () => {
    await invalidateCachePattern((key: any) => 
      typeof key === 'string' && (
        key.startsWith('/api/students') ||
        key.startsWith('/api/dashboard')
      )
    );
  },

  /**
   * Invalidate all assessment-related caches
   */
  assessments: async () => {
    await invalidateCachePattern((key: any) => 
      typeof key === 'string' && (
        key.startsWith('/api/assessments') ||
        key.startsWith('/api/dashboard')
      )
    );
  },

  /**
   * Invalidate all attendance-related caches
   */
  attendance: async () => {
    await invalidateCachePattern((key: any) => 
      typeof key === 'string' && (
        key.includes('/api/attendance') ||
        key.startsWith('/api/dashboard')
      )
    );
  },

  /**
   * Invalidate all group-related caches
   */
  groups: async () => {
    await invalidateCachePattern((key: any) => 
      typeof key === 'string' && (
        key.startsWith('/api/groups') ||
        key.startsWith('/api/dashboard')
      )
    );
  },

  /**
   * Invalidate everything
   */
  all: async () => {
    await mutate(() => true);
  },
};
