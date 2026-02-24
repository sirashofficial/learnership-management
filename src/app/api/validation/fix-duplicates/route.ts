import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * POST /api/validation/fix-duplicates
 * Identifies and removes duplicate assessments (same student, unit standard, and type)
 * Keeps the most recent assessment and deletes older duplicates
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { dryRun = false } = body;

    // Find all duplicate assessments using raw SQL
    const duplicates = await prisma.$queryRaw<
      Array<{
        studentId: string;
        unitStandardId: string;
        type: string;
        count: BigInt;
      }>
    >`
      SELECT studentId, unitStandardId, type, COUNT(*) as count
      FROM Assessment
      GROUP BY studentId, unitStandardId, type
      HAVING COUNT(*) > 1
    `;

    const duplicatesFixed: Array<{
      studentName: string;
      unitStandardCode: string;
      type: string;
      duplicatesRemoved: number;
    }> = [];

    for (const dup of duplicates) {
      // Get all assessments for this combination
      const assessments = await prisma.assessment.findMany({
        where: {
          studentId: dup.studentId,
          unitStandardId: dup.unitStandardId,
          type: dup.type,
        },
        include: {
          student: { select: { firstName: true, lastName: true } },
          unitStandard: { select: { code: true } },
        },
        orderBy: { createdAt: 'desc' }, // Most recent first
      });

      if (assessments.length <= 1) continue;

      const keepAssessment = assessments[0]; // Keep the most recent
      const toDelete = assessments.slice(1); // Delete the rest

      if (!dryRun) {
        // Delete duplicate assessments
        await prisma.assessment.deleteMany({
          where: {
            id: { in: toDelete.map((a) => a.id) },
          },
        });
      }

      duplicatesFixed.push({
        studentName: `${keepAssessment.student.firstName} ${keepAssessment.student.lastName}`,
        unitStandardCode: keepAssessment.unitStandard.code,
        type: keepAssessment.type,
        duplicatesRemoved: toDelete.length,
      });
    }

    return successResponse({
      dryRun,
      duplicatesFound: duplicates.length,
      duplicatesFixed: duplicatesFixed.length,
      totalRemoved: duplicatesFixed.reduce((sum, d) => sum + d.duplicatesRemoved, 0),
      fixes: duplicatesFixed,
    });
  } catch (err) {
    console.error('Fix duplicates error:', err);
    return errorResponse('Failed to fix duplicate assessments', 500);
  }
}
