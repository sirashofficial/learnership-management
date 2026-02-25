import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/validation/cleanup-orphaned-progress
 * Removes UnitStandardProgress records that don't have matching assessments
 * for the student and unit standard combination
 */
async function handlePost(request: NextRequest) {
  try {

    const body = await request.json();
    const { dryRun = false } = body;

    // Get all progress records
    const progressRecords = await prisma.unitStandardProgress.findMany({
      include: {
        student: { select: { firstName: true, lastName: true } },
        unitStandard: { select: { code: true, title: true } },
      },
    });

    const orphanedProgress: Array<{
      progressId: string;
      studentName: string;
      unitStandardCode: string;
      unitStandardTitle: string;
      status: string;
    }> = [];

    for (const progress of progressRecords) {
      // Check if there are any assessments for this combination
      const assessmentCount = await prisma.assessment.count({
        where: {
          studentId: progress.studentId,
          unitStandardId: progress.unitStandardId,
        },
      });

      if (assessmentCount === 0) {
        orphanedProgress.push({
          progressId: progress.id,
          studentName: `${progress.student.firstName} ${progress.student.lastName}`,
          unitStandardCode: progress.unitStandard.code,
          unitStandardTitle: progress.unitStandard.title,
          status: progress.status,
        });
      }
    }

    if (!dryRun && orphanedProgress.length > 0) {
      // Delete orphaned progress records
      await prisma.unitStandardProgress.deleteMany({
        where: {
          id: { in: orphanedProgress.map((p) => p.progressId) },
        },
      });
    }

    return successResponse({
      dryRun,
      totalProgressRecords: progressRecords.length,
      orphanedFound: orphanedProgress.length,
      orphanedRemoved: dryRun ? 0 : orphanedProgress.length,
      orphanedRecords: orphanedProgress,
    });
  } catch (err) {
    console.error('Cleanup orphaned progress error:', err);
    return errorResponse('Failed to cleanup orphaned progress', 500);
  }
}

export const POST = withAuth(withRateLimit(handlePost, 'strict'), ['ADMIN']);
