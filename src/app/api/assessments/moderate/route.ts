import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessmentId, moderationStatus, moderatorId, moderationNotes } = body;

    if (!assessmentId || !moderationStatus || !moderatorId) {
      return errorResponse('Missing required fields', 400);
    }

    const assessment = await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        moderationStatus,
        moderatedBy: moderatorId,
        moderatedDate: new Date(),
        moderationNotes,
      },
      include: {
        student: { include: { group: true } },
        unitStandard: true,
      },
    });

    // Update progress if approved as competent
    if (moderationStatus === 'APPROVED' && assessment.result === 'COMPETENT') {
      await updateUnitStandardProgress(
        assessment.studentId,
        assessment.unitStandardId,
        assessment.type
      );
      await updateStudentProgress(assessment.studentId);
    }

    return successResponse(assessment);
  } catch (error) {
    return handleApiError(error);
  }
}

async function updateUnitStandardProgress(
  studentId: string,
  unitStandardId: string | null,
  assessmentType: string
) {
  if (!unitStandardId) return;

  const progress = await prisma.unitStandardProgress.findUnique({
    where: { studentId_unitStandardId: { studentId, unitStandardId } },
  });

  const updates: any = {
    status: 'IN_PROGRESS',
  };

  if (assessmentType === 'FORMATIVE') {
    updates.formativesPassed = (progress?.formativesPassed || 0) + 1;
  } else if (assessmentType === 'SUMMATIVE' || assessmentType === 'INTEGRATED') {
    updates.summativePassed = true;
    updates.status = 'COMPLETED';
    updates.completionDate = new Date();
  }

  await prisma.unitStandardProgress.upsert({
    where: { studentId_unitStandardId: { studentId, unitStandardId } },
    update: updates,
    create: {
      studentId,
      unitStandardId,
      ...updates,
      startDate: new Date(),
    },
  });
}

async function updateStudentProgress(studentId: string) {
  const competentCount = await prisma.assessment.count({
    where: {
      studentId,
      result: 'COMPETENT',
      moderationStatus: 'APPROVED',
    },
  });

  const totalAssessments = await prisma.assessment.count({
    where: { studentId },
  });

  const progress = totalAssessments > 0
    ? Math.round((competentCount / totalAssessments) * 100)
    : 0;

  await prisma.student.update({
    where: { id: studentId },
    data: { progress },
  });
}
