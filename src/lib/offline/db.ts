/**
 * Offline Database Module
 * Manages local IndexedDB storage for offline-first functionality
 * Stores pending attendance, assessments, and cached student/curriculum data
 */

import Dexie, { Table } from 'dexie';

export interface PendingAttendanceRecord {
  id?: number;
  studentId: string;
  groupId: string;
  sessionDate: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  reason?: string;
  markedAt: number; // timestamp
  synced: boolean;
  syncedAt?: number;
  syncError?: string;
}

export interface PendingAssessmentRecord {
  id?: number;
  studentId: string;
  groupId: string;
  assessmentId: string;
  score: number;
  feedback?: string;
  recordedAt: number; // timestamp
  synced: boolean;
  syncedAt?: number;
  syncError?: string;
}

export interface CachedStudent {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  groupIds: string[];
  cachedAt: number;
}

export interface CachedCurriculumItem {
  id: string;
  name: string;
  groupId: string;
  code: string;
  level: number;
  cachedAt: number;
}

export interface SyncMetadata {
  key: string;
  lastSyncTime: number;
  lastSyncStatus: 'success' | 'error' | 'pending';
  lastError?: string;
  pendingCount: number;
}

/**
 * Offline Database for PWA
 * Stores: pending attendance/assessments, cached student/curriculum data, sync metadata
 */
class OfflineDB extends Dexie {
  pendingAttendance!: Table<PendingAttendanceRecord>;
  pendingAssessments!: Table<PendingAssessmentRecord>;
  cachedStudents!: Table<CachedStudent>;
  cachedCurriculum!: Table<CachedCurriculumItem>;
  syncMetadata!: Table<SyncMetadata>;

  constructor() {
    super('YEHAOfflineDB');
    this.version(1).stores({
      pendingAttendance:
        '++id, studentId, groupId, sessionDate, synced, markedAt',
      pendingAssessments:
        '++id, studentId, groupId, assessmentId, synced, recordedAt',
      cachedStudents: 'id, &email',
      cachedCurriculum: 'id, groupId, code',
      syncMetadata: 'key',
    });
  }
}

// Export singleton instance
export const offlineDB = new OfflineDB();

/**
 * Clear all offline data (useful for logout/reset)
 */
export async function clearOfflineData(): Promise<void> {
  await offlineDB.pendingAttendance.clear();
  await offlineDB.pendingAssessments.clear();
  await offlineDB.cachedStudents.clear();
  await offlineDB.cachedCurriculum.clear();
  await offlineDB.syncMetadata.clear();
}

/**
 * Get sync metadata for a specific sync type
 */
export async function getSyncMetadata(key: string): Promise<SyncMetadata | undefined> {
  return offlineDB.syncMetadata.get(key);
}

/**
 * Update sync metadata
 */
export async function updateSyncMetadata(
  key: string,
  status: 'success' | 'error' | 'pending',
  pendingCount: number,
  error?: string
): Promise<void> {
  await offlineDB.syncMetadata.put({
    key,
    lastSyncTime: Date.now(),
    lastSyncStatus: status,
    lastError: error,
    pendingCount,
  });
}

/**
 * Get all pending attendance records
 */
export async function getPendingAttendance(
  synced: boolean = false
): Promise<PendingAttendanceRecord[]> {
  return offlineDB.pendingAttendance
    .where('synced')
    .equals(synced)
    .toArray();
}

/**
 * Get all pending assessment records
 */
export async function getPendingAssessments(
  synced: boolean = false
): Promise<PendingAssessmentRecord[]> {
  return offlineDB.pendingAssessments
    .where('synced')
    .equals(synced)
    .toArray();
}

/**
 * Add pending attendance record
 */
export async function addPendingAttendance(
  record: Omit<PendingAttendanceRecord, 'id'>
): Promise<number> {
  return offlineDB.pendingAttendance.add(record);
}

/**
 * Add pending assessment record
 */
export async function addPendingAssessment(
  record: Omit<PendingAssessmentRecord, 'id'>
): Promise<number> {
  return offlineDB.pendingAssessments.add(record);
}

/**
 * Mark attendance records as synced
 */
export async function markAttendanceSynced(
  ids: number[],
  syncedAt: number = Date.now()
): Promise<void> {
  await offlineDB.pendingAttendance.bulkUpdate(
    ids.map((id) => ({
      key: id,
      changes: { synced: true, syncedAt, syncError: undefined },
    }))
  );
}

/**
 * Mark assessment records as synced
 */
export async function markAssessmentSynced(
  ids: number[],
  syncedAt: number = Date.now()
): Promise<void> {
  await offlineDB.pendingAssessments.bulkUpdate(
    ids.map((id) => ({
      key: id,
      changes: { synced: true, syncedAt, syncError: undefined },
    }))
  );
}

/**
 * Mark records with sync error
 */
export async function markSyncError(
  type: 'attendance' | 'assessment',
  ids: number[],
  error: string
): Promise<void> {
  const table =
    type === 'attendance'
      ? offlineDB.pendingAttendance
      : offlineDB.pendingAssessments;

  await table.bulkUpdate(
    ids.map((id) => ({
      key: id,
      changes: { syncError: error },
    }))
  );
}

/**
 * Cache student roster
 */
export async function cacheStudents(students: CachedStudent[]): Promise<void> {
  await offlineDB.cachedStudents.bulkPut(students);
}

/**
 * Cache curriculum items
 */
export async function cacheCurriculum(
  items: CachedCurriculumItem[]
): Promise<void> {
  await offlineDB.cachedCurriculum.bulkPut(items);
}

/**
 * Get cached students for a group
 */
export async function getCachedStudentsByGroup(
  groupId: string
): Promise<CachedStudent[]> {
  return offlineDB.cachedStudents
    .filter((student) => student.groupIds.includes(groupId))
    .toArray();
}

/**
 * Get all cached students
 */
export async function getAllCachedStudents(): Promise<CachedStudent[]> {
  return offlineDB.cachedStudents.toArray();
}

/**
 * Get cached curriculum for a group
 */
export async function getCachedCurriculumByGroup(
  groupId: string
): Promise<CachedCurriculumItem[]> {
  return offlineDB.cachedCurriculum
    .where('groupId')
    .equals(groupId)
    .toArray();
}

/**
 * Get sync statistics for UI display
 */
export async function getSyncStats(): Promise<{
  pendingAttendanceCount: number;
  pendingAssessmentCount: number;
  totalPendingCount: number;
  lastSyncTime?: number;
  lastSyncStatus?: 'success' | 'error' | 'pending';
}> {
  const attendance = await getPendingAttendance(false);
  const assessments = await getPendingAssessments(false);

  const metadata = await getSyncMetadata('last_sync');

  return {
    pendingAttendanceCount: attendance.length,
    pendingAssessmentCount: assessments.length,
    totalPendingCount: attendance.length + assessments.length,
    lastSyncTime: metadata?.lastSyncTime,
    lastSyncStatus: metadata?.lastSyncStatus,
  };
}
