/**
 * Example: Using the caching and transaction utilities
 * 
 * This file demonstrates best practices for:
 * 1. Caching frequently accessed data
 * 2. Using transactional operations for data integrity
 * 3. Optimized query patterns
 */

import prisma from '../src/lib/prisma';
import { CurriculumCache, UnitStandardsCache, CacheKeys } from '../src/lib/cache';
import { bulkAssessmentMarking, transferStudent } from '../src/lib/db/transactionManager';

/**
 * Example 1: Caching curriculum data
 * This data rarely changes, so we cache it for 1 hour
 */
export async function getModulesWithCache() {
  return CurriculumCache.wrap(
    CacheKeys.modules(),
    async () => {
      return prisma.module.findMany({
        orderBy: { moduleNumber: 'asc' },
        select: {
          id: true,
          moduleNumber: true,
          name: true,
          code: true,
          credits: true,
        },
      });
    },
    { ttl: 3600 } // 1 hour
  );
}

/**
 * Example 2: Caching unit standards with eager loading
 * Reduces N+1 queries by including module data upfront
 */
export async function getUnitStandardsByModule(moduleId: string) {
  return UnitStandardsCache.wrap(
    CacheKeys.unitStandardsByModule(moduleId),
    async () => {
      return prisma.unitStandard.findMany({
        where: { moduleId },
        include: {
          module: {
            select: {
              id: true,
              name: true,
              moduleNumber: true,
            },
          },
        },
        orderBy: { code: 'asc' },
      });
    },
    { ttl: 86400 } // 24 hours
  );
}

/**
 * Example 3: Bulk assessment marking with transactions
 * Ensures all updates happen atomically
 */
export async function markAssessmentsBulk() {
  const updates = [
    {
      assessmentId: 'assessment-1',
      result: 'COMPETENT' as const,
      score: 85,
      feedback: 'Well done!',
      assessedDate: new Date(),
    },
    {
      assessmentId: 'assessment-2',
      result: 'COMPETENT' as const,
      score: 90,
      feedback: 'Excellent work!',
      assessedDate: new Date(),
    },
  ];

  const result = await bulkAssessmentMarking(updates, 'moderator-user-id');
  
  console.log(`✅ Updated: ${result.updated}`);
  console.log(`❌ Failed: ${result.failed}`);
  console.log(`🔄 Progress recalculated for: ${result.progressRecalculated.join(', ')}`);

  // Important: Invalidate related caches after mutations
  // (Not implemented in this example, but should be added based on your needs)

  return result;
}

/**
 * Example 4: Transfer student with transaction
 * All related data moves atomically
 */
export async function transferStudentBetweenGroups() {
  const result = await transferStudent({
    studentId: 'student-123',
    fromGroupId: 'group-a',
    toGroupId: 'group-b',
    transferDate: new Date(),
    notes: 'Transfer requested by coordinator',
    transferredBy: 'admin-user-id',
  });

  if (result.success) {
    console.log('✅ Student transferred successfully');
    console.log(`   Student: ${result.studentId}`);
    console.log(`   Records updated:`, result.recordsUpdated);
  } else {
    console.error('❌ Transfer failed:', result.error);
  }

  return result;
}

/**
 * Example 5: Optimized group dashboard query with eager loading
 * Avoids N+1 queries by including all related data upfront
 */
export async function getGroupDashboardData(groupId: string) {
  // Single query with all relations included
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      students: {
        where: { status: { not: 'WITHDRAWN' } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          progress: true,
          totalCreditsEarned: true,
          status: true,
        },
      },
      unitStandardRollouts: {
        include: {
          unitStandard: {
            select: {
              id: true,
              code: true,
              title: true,
              credits: true,
              moduleId: true,
            },
          },
        },
      },
      rolloutPlans: {
        include: {
          module: {
            select: {
              id: true,
              name: true,
              moduleNumber: true,
            },
          },
        },
      },
    },
  });

  // All data loaded in one query - no N+1 problem
  return group;
}

/**
 * Example 6: Batch query optimization
 * Use Promise.all for parallel queries when no dependencies exist
 */
export async function getStudentDetailsFast(studentId: string) {
  // Execute all queries in parallel
  const [student, assessments, attendance, progress] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: {
        group: { select: { id: true, name: true } },
        currentModule: { select: { id: true, name: true, moduleNumber: true } },
      },
    }),
    
    prisma.assessment.findMany({
      where: { studentId },
      include: {
        unitStandard: {
          select: { code: true, title: true, credits: true },
        },
      },
      orderBy: { assessedDate: 'desc' },
      take: 20,
    }),
    
    prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 30,
    }),
    
    prisma.moduleProgress.findMany({
      where: { studentId },
      include: {
        module: {
          select: { id: true, name: true, moduleNumber: true, credits: true },
        },
      },
      orderBy: {
        module: { moduleNumber: 'asc' },
      },
    }),
  ]);

  return { student, assessments, attendance, progress };
}
