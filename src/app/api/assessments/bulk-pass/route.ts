import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';
import { updateProgressFromAssessment } from '@/lib/progress-calculator';

const ALLOWED_TYPES = ['FORMATIVE', 'SUMMATIVE', 'WORKPLACE'] as const;

type AssessmentType = typeof ALLOWED_TYPES[number];

async function handlePost(request: NextRequest) {
  try {

    const body = await request.json();
    const { unitStandardId, assessmentType, groupId, studentIds, result: bodyResult } = body as {
      unitStandardId?: string;
      assessmentType?: AssessmentType;
      groupId?: string;
      studentIds?: string[];
      result?: string;
    };

    // Support COMPETENT (default) or NOT_YET_COMPETENT
    const markResult: string =
      bodyResult === 'NOT_YET_COMPETENT' ? 'NOT_YET_COMPETENT' : 'COMPETENT';

    if (!unitStandardId) {
      return errorResponse('unitStandardId is required', 400);
    }

    if (!assessmentType || !ALLOWED_TYPES.includes(assessmentType)) {
      return errorResponse('assessmentType must be FORMATIVE, SUMMATIVE, or WORKPLACE', 400);
    }

    let targetStudentIds = Array.isArray(studentIds) ? studentIds.filter(Boolean) : [];

    if (groupId) {
      const groupStudents = await prisma.student.findMany({
        where: { groupId },
        select: { id: true },
      });
      targetStudentIds = groupStudents.map((student) => student.id);
    }

    if (targetStudentIds.length === 0) {
      return errorResponse('studentIds or groupId must be provided', 400);
    }

    const existingAssessments = await prisma.assessment.findMany({
      where: {
        studentId: { in: targetStudentIds },
        unitStandardId,
        type: assessmentType,
      },
      select: {
        id: true,
        studentId: true,
        result: true,
      },
    });

    const existingByStudent = new Map<string, { id: string; result: string | null }>();
    for (const assessment of existingAssessments) {
      existingByStudent.set(assessment.studentId, { id: assessment.id, result: assessment.result });
    }

    let updated = 0;
    let skipped = 0;
    const updatedIds: string[] = [];

    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    for (const studentId of targetStudentIds) {
      const existing = existingByStudent.get(studentId);

      if (existing) {
        // Update existing assessment (allows overwriting any previous result)
        const updatedAssessment = await prisma.assessment.update({
          where: { id: existing.id },
          data: {
            result: markResult,
            assessedDate: now,
            moderationStatus: 'PENDING',
          },
        });
        updated += 1;
        updatedIds.push(updatedAssessment.id);
        continue;
      }

      const created = await prisma.assessment.create({
        data: {
          studentId,
          unitStandardId,
          type: assessmentType,
          method: 'PRACTICAL',
          dueDate,
          result: markResult,
          assessedDate: now,
          attemptNumber: 1,
          moderationStatus: 'PENDING',
        },
        select: { id: true },
      });

      updated += 1;
      updatedIds.push(created.id);
    }

    if (updatedIds.length > 0) {
      await Promise.all(
        updatedIds.map((assessmentId) =>
          updateProgressFromAssessment(assessmentId).catch((err) => {
            console.error('Failed to update progress for assessment', assessmentId, err);
            return null;
          })
        )
      );
    }

    return successResponse({ updated, skipped });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = withAuth(
  withRateLimit(handlePost, 'strict'),
  ['ADMIN', 'FACILITATOR']
);
