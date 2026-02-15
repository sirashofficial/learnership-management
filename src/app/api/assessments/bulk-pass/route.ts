import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';
import { updateProgressFromAssessment } from '@/lib/progress-calculator';

const ALLOWED_TYPES = ['FORMATIVE', 'SUMMATIVE', 'WORKPLACE'] as const;

type AssessmentType = typeof ALLOWED_TYPES[number];

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { unitStandardId, assessmentType, groupId, studentIds } = body as {
      unitStandardId?: string;
      assessmentType?: AssessmentType;
      groupId?: string;
      studentIds?: string[];
    };

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
        if (existing.result === 'NOT_YET_COMPETENT' || existing.result === 'COMPETENT') {
          skipped += 1;
          continue;
        }

        const updatedAssessment = await prisma.assessment.update({
          where: { id: existing.id },
          data: {
            result: 'COMPETENT',
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
          result: 'COMPETENT',
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
