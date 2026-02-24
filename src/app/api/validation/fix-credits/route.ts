import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

/**
 * POST /api/validation/fix-credits
 * Recalculates and fixes student totalCreditsEarned based on competent assessments
 * Uses atomic transaction to ensure consistency
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { studentIds, dryRun = false } = body;

    // Get students to fix (all active if none specified)
    const whereClause = studentIds
      ? { id: { in: studentIds } }
      : { status: 'ACTIVE' };

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        assessments: {
          where: { result: 'COMPETENT' },
          select: { unitStandardId: true },
        },
      },
    });

    // Get all unit standards for credit lookup
    const unitStandards = await prisma.unitStandard.findMany({
      select: { id: true, credits: true },
    });

    const creditMap = new Map(unitStandards.map((us) => [us.id, us.credits]));

    const fixes: Array<{
      studentId: string;
      name: string;
      oldCredits: number;
      newCredits: number;
      difference: number;
    }> = [];

    if (dryRun) {
      // Dry run: just report what would be changed
      for (const student of students) {
        const uniqueUSIds = new Set(
          student.assessments.map((a) => a.unitStandardId)
        );

        const calculatedCredits = Array.from(uniqueUSIds).reduce(
          (sum, usId) => sum + (creditMap.get(usId) || 0),
          0
        );

        if (calculatedCredits !== student.totalCreditsEarned) {
          fixes.push({
            studentId: student.studentId,
            name: `${student.firstName} ${student.lastName}`,
            oldCredits: student.totalCreditsEarned,
            newCredits: calculatedCredits,
            difference: calculatedCredits - student.totalCreditsEarned,
          });
        }
      }

      return successResponse({
        dryRun: true,
        studentsChecked: students.length,
        studentsNeedingFix: fixes.length,
        fixes,
      });
    }

    // Actual fix: update in transaction
    const results = await prisma.$transaction(async (tx) => {
      const updates: typeof fixes = [];

      for (const student of students) {
        const uniqueUSIds = new Set(
          student.assessments.map((a) => a.unitStandardId)
        );

        const calculatedCredits = Array.from(uniqueUSIds).reduce(
          (sum, usId) => sum + (creditMap.get(usId) || 0),
          0
        );

        if (calculatedCredits !== student.totalCreditsEarned) {
          await tx.student.update({
            where: { id: student.id },
            data: { totalCreditsEarned: calculatedCredits },
          });

          updates.push({
            studentId: student.studentId,
            name: `${student.firstName} ${student.lastName}`,
            oldCredits: student.totalCreditsEarned,
            newCredits: calculatedCredits,
            difference: calculatedCredits - student.totalCreditsEarned,
          });
        }
      }

      return updates;
    });

    return successResponse({
      dryRun: false,
      studentsChecked: students.length,
      studentsFixed: results.length,
      fixes: results,
    });
  } catch (err: any) {
    console.error('Credit fix error:', err);
    return errorResponse(err.message || 'Fix failed', 500);
  }
}
