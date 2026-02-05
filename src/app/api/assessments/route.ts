import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { z } from 'zod';

const createAssessmentSchema = z.object({
  studentId: z.string(),
  unitStandard: z.string(),
  module: z.string(),
  type: z.enum(['FORMATIVE', 'SUMMATIVE', 'INTEGRATED']),
  method: z.enum(['KNOWLEDGE', 'PRACTICAL', 'OBSERVATION', 'PORTFOLIO']),
  dueDate: z.string().transform(str => new Date(str)),
  unitStandardId: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/assessments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const groupId = searchParams.get('groupId');
    const result = searchParams.get('result');
    const type = searchParams.get('type');
    const method = searchParams.get('method');
    const moderationStatus = searchParams.get('moderationStatus');

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (groupId) where.student = { groupId };
    if (result) where.result = result;
    if (type) where.type = type;
    if (method) where.method = method;
    if (moderationStatus) where.moderationStatus = moderationStatus;

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        student: {
          include: {
            group: true,
          },
        },
        unitStandardRef: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    return successResponse(assessments);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/assessments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createAssessmentSchema.parse(body);

    const assessment = await prisma.assessment.create({
      data: {
        ...validatedData,
        attemptNumber: 1,
        moderationStatus: 'PENDING',
      },
      include: {
        student: {
          include: { group: true },
        },
        unitStandardRef: true,
      },
    });

    return successResponse(assessment, 'Assessment created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/assessments
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, result, score, feedback, notes, assessedDate } = body;

    if (!id) {
      return errorResponse('Assessment ID required', 400);
    }

    const assessment = await prisma.assessment.update({
      where: { id },
      data: {
        result,
        score,
        feedback,
        notes,
        assessedDate: assessedDate ? new Date(assessedDate) : new Date(),
        moderationStatus: result ? 'PENDING' : undefined,
      },
      include: {
        student: { include: { group: true } },
        unitStandardRef: true,
      },
    });

    // Update student progress if competent and approved
    if (result === 'COMPETENT' && assessment.moderationStatus === 'APPROVED') {
      await updateStudentProgress(assessment.studentId);
    }

    return successResponse(assessment, 'Assessment updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/assessments
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Assessment ID is required', 400);
    }

    await prisma.assessment.delete({
      where: { id },
    });

    return successResponse(null, 'Assessment deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// Helper function to update student progress
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
