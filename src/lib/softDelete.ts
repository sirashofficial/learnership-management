/**
 * Soft Delete Utility
 * 
 * Provides soft delete functionality with 30-day recovery window.
 * Soft-deleted records are marked with deletedAt timestamp and isDeleted flag
 * instead of being permanently removed from the database.
 */

import { PrismaClient } from '@prisma/client';
import prisma from './prisma';

// Models that support soft delete
export type SoftDeletableModel = 'user' | 'group' | 'student' | 'assessment' | 'attendance';

// 30-day retention period before hard delete (in milliseconds)
export const SOFT_DELETE_RETENTION_DAYS = 30;
export const SOFT_DELETE_RETENTION_MS = SOFT_DELETE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Soft delete a record by setting deletedAt and isDeleted
 * @param model - The model name (lowercase)
 * @param id - The record ID
 * @returns The updated record
 */
export async function softDelete(model: SoftDeletableModel, id: string) {
  const now = new Date();
  
  // @ts-expect-error - Dynamic model access
  return await prisma[model].update({
    where: { id },
    data: {
      deletedAt: now,
      isDeleted: true,
      updatedAt: now,
    },
  });
}

/**
 * Soft delete multiple records
 * @param model - The model name (lowercase)
 * @param ids - Array of record IDs
 * @returns Count of updated records
 */
export async function softDeleteMany(model: SoftDeletableModel, ids: string[]) {
  const now = new Date();
  
  // @ts-expect-error - Dynamic model access
  return await prisma[model].updateMany({
    where: { 
      id: { in: ids },
      isDeleted: false, // Only delete records that aren't already deleted
    },
    data: {
      deletedAt: now,
      isDeleted: true,
      updatedAt: now,
    },
  });
}

/**
 * Restore a soft-deleted record
 * @param model - The model name (lowercase)
 * @param id - The record ID
 * @returns The restored record
 */
export async function restore(model: SoftDeletableModel, id: string) {
  // @ts-expect-error - Dynamic model access
  return await prisma[model].update({
    where: { id },
    data: {
      deletedAt: null,
      isDeleted: false,
      updatedAt: new Date(),
    },
  });
}

/**
 * Restore multiple soft-deleted records
 * @param model - The model name (lowercase)
 * @param ids - Array of record IDs
 * @returns Count of restored records
 */
export async function restoreMany(model: SoftDeletableModel, ids: string[]) {
  // @ts-expect-error - Dynamic model access
  return await prisma[model].updateMany({
    where: { 
      id: { in: ids },
      isDeleted: true,
    },
    data: {
      deletedAt: null,
      isDeleted: false,
      updatedAt: new Date(),
    },
  });
}

/**
 * Permanently delete a record (ADMIN only)
 * @param model - The model name (lowercase)
 * @param id - The record ID
 * @param userRole - The role of the user attempting deletion
 * @returns The deleted record
 * @throws Error if user is not ADMIN
 */
export async function hardDelete(model: SoftDeletableModel, id: string, userRole: string) {
  if (userRole !== 'ADMIN') {
    throw new Error('Only ADMIN users can permanently delete records');
  }
  
  // @ts-expect-error - Dynamic model access
  return await prisma[model].delete({
    where: { id },
  });
}

/**
 * Permanently delete multiple records (ADMIN only)
 * @param model - The model name (lowercase)
 * @param ids - Array of record IDs
 * @param userRole - The role of the user attempting deletion
 * @returns Count of deleted records
 * @throws Error if user is not ADMIN
 */
export async function hardDeleteMany(model: SoftDeletableModel, ids: string[], userRole: string) {
  if (userRole !== 'ADMIN') {
    throw new Error('Only ADMIN users can permanently delete records');
  }
  
  // @ts-expect-error - Dynamic model access
  return await prisma[model].deleteMany({
    where: { id: { in: ids } },
  });
}

/**
 * Find records including soft-deleted ones
 * @param model - The model name (lowercase)
 * @param where - Where clause (Prisma where object)
 * @returns Array of records including soft-deleted
 */
export async function findWithDeleted(model: SoftDeletableModel, where: any = {}) {
  // @ts-expect-error - Dynamic model access
  return await prisma[model].findMany({
    where: {
      ...where,
      // Don't filter by isDeleted - include all records
    },
  });
}

/**
 * Find a single record including soft-deleted ones
 * @param model - The model name (lowercase)
 * @param where - Where clause (Prisma where object)
 * @returns Single record or null
 */
export async function findUniqueWithDeleted(model: SoftDeletableModel, where: any) {
  // @ts-expect-error - Dynamic model access
  return await prisma[model].findFirst({
    where: {
      ...where,
      // Don't filter by isDeleted
    },
  });
}

/**
 * Check if a record is soft-deleted
 * @param model - The model name (lowercase)
 * @param id - The record ID
 * @returns Boolean indicating if record is soft-deleted
 */
export async function isSoftDeleted(model: SoftDeletableModel, id: string): Promise<boolean> {
  // @ts-expect-error - Dynamic model access
  const record = await prisma[model].findUnique({
    where: { id },
    select: { isDeleted: true },
  });
  
  return record?.isDeleted ?? false;
}

/**
 * Check if a record can be restored (within 30-day window)
 * @param model - The model name (lowercase)
 * @param id - The record ID
 * @returns Boolean indicating if record can be restored
 */
export async function canRestore(model: SoftDeletableModel, id: string): Promise<boolean> {
  // @ts-expect-error - Dynamic model access
  const record = await prisma[model].findUnique({
    where: { id },
    select: { isDeleted: true, deletedAt: true },
  });
  
  if (!record || !record.isDeleted || !record.deletedAt) {
    return false;
  }
  
  const now = new Date();
  const deletedDate = new Date(record.deletedAt);
  const timeSinceDeletion = now.getTime() - deletedDate.getTime();
  
  return timeSinceDeletion <= SOFT_DELETE_RETENTION_MS;
}

/**
 * Get all soft-deleted records that are past the retention period
 * and ready for permanent deletion
 * @param model - The model name (lowercase)
 * @returns Array of record IDs ready for permanent deletion
 */
export async function getExpiredSoftDeletedRecords(model: SoftDeletableModel): Promise<string[]> {
  const expirationDate = new Date(Date.now() - SOFT_DELETE_RETENTION_MS);
  
  // @ts-expect-error - Dynamic model access
  const records = await prisma[model].findMany({
    where: {
      isDeleted: true,
      deletedAt: {
        lte: expirationDate,
      },
    },
    select: { id: true },
  });
  
  return records.map((r: any) => r.id);
}

/**
 * Cascade soft delete for Group -> Students
 * When a group is soft-deleted, also soft-delete all its students
 * @param groupId - The group ID
 * @returns Object with counts of deleted records
 */
export async function cascadeSoftDeleteGroup(groupId: string) {
  const now = new Date();
  
  // Soft delete the group
  const group = await softDelete('group', groupId);
  
  // Soft delete all students in the group
  const students = await prisma.student.updateMany({
    where: {
      groupId,
      isDeleted: false,
    },
    data: {
      deletedAt: now,
      isDeleted: true,
      updatedAt: now,
    },
  });
  
  return {
    group,
    studentsDeleted: students.count,
  };
}

/**
 * Cascade restore for Group -> Students
 * When a group is restored, also restore all its soft-deleted students
 * @param groupId - The group ID
 * @returns Object with counts of restored records
 */
export async function cascadeRestoreGroup(groupId: string) {
  const now = new Date();
  
  // Restore the group
  const group = await restore('group', groupId);
  
  // Restore all students in the group that were deleted at the same time or after the group
  const groupDeletedAt = (group as any).deletedAt;
  
  const students = await prisma.student.updateMany({
    where: {
      groupId,
      isDeleted: true,
      deletedAt: {
        gte: groupDeletedAt || new Date(0),
      },
    },
    data: {
      deletedAt: null,
      isDeleted: false,
      updatedAt: now,
    },
  });
  
  return {
    group,
    studentsRestored: students.count,
  };
}
