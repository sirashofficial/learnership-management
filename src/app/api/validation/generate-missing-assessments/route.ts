import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/validation/generate-missing-assessments
 * Generates missing assessments for students based on their group's rollout plan
 */
async function handlePost(request: NextRequest) {
  try {

    const body = await request.json();
    const { studentIds, groupId, dryRun = false } = body;

    // Build where clause
    let whereClause: any = { status: 'ACTIVE' };
    if (studentIds) {
      whereClause.id = { in: studentIds };
    } else if (groupId) {
      whereClause.groupId = groupId;
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        assessments: {
          select: { unitStandardId: true, type: true },
        },
        group: {
          include: {
            unitStandardRollouts: {
              include: {
                unitStandard: {
                  select: { id: true, code: true, title: true, credits: true },
                },
              },
            },
          },
        },
      },
    });

    const assessmentsToCreate: Array<{
      studentId: string;
      studentName: string;
      unitStandardCode: string;
      unitStandardTitle: string;
      type: string;
    }> = [];

    const assessmentData: any[] = [];

    for (const student of students) {
      if (!student.group?.unitStandardRollouts) continue;

      // Get existing assessments for this student
      const existingAssessments = new Set(
        student.assessments.map((a) => `${a.unitStandardId}:${a.type}`)
      );

      // Check each required unit standard
      for (const rollout of student.group.unitStandardRollouts) {
        const usId = rollout.unitStandard.id;

        // Check if FORMATIVE assessment exists
        if (!existingAssessments.has(`${usId}:FORMATIVE`)) {
          assessmentsToCreate.push({
            studentId: student.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            unitStandardCode: rollout.unitStandard.code,
            unitStandardTitle: rollout.unitStandard.title,
            type: 'FORMATIVE',
          });

          if (!dryRun) {
            assessmentData.push({
              studentId: student.id,
              unitStandardId: usId,
              type: 'FORMATIVE',
              method: 'KNOWLEDGE',
              result: 'PENDING',
              dueDate: rollout.endDate || new Date(),
              attemptNumber: 1,
              moderationStatus: 'PENDING',
            });
          }
        }
      }
    }

    if (dryRun) {
      return successResponse({
        dryRun: true,
        studentsChecked: students.length,
        assessmentsToGenerate: assessmentsToCreate.length,
        details: assessmentsToCreate.slice(0, 20), // First 20 for preview
      });
    }

    // Actually create assessments in transaction
    const created = await prisma.$transaction(async (tx) => {
      if (assessmentData.length === 0) return { count: 0 };

      // Batch create assessments
      const result = await tx.assessment.createMany({
        data: assessmentData,
      });

      return result;
    });

    return successResponse({
      dryRun: false,
      studentsProcessed: students.length,
      assessmentsCreated: created.count,
      preview: assessmentsToCreate.slice(0, 20),
    });
  } catch (err: any) {
    console.error('Generate missing assessments error:', err);
    return errorResponse(err.message || 'Generation failed', 500);
  }
}

export const POST = withAuth(withRateLimit(handlePost, 'strict'), ['ADMIN']);
