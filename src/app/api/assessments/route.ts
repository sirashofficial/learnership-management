import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  successPaginatedResponse, 
  successResponse,
  errorResponse, 
  handleApiError,
  getPaginationParams,
  createPagination,
} from '@/lib/api-utils';
import { updateStudentProgressUnified } from '@/lib/progress-calculator';
import { z } from 'zod';
import { requireAuth } from '@/lib/middleware';
import { enforceGroupAccess, getAuthContext, withAuth, withRateLimit, withValidation } from '@/middleware/apiAuth';
import { softDelete } from '@/lib/softDelete';

const createAssessmentSchema = z.object({
  studentId: z.string(),
  unitStandardId: z.string(), // Now required
  type: z.enum(['FORMATIVE', 'SUMMATIVE', 'WORKPLACE', 'INTEGRATED']),
  method: z.enum(['KNOWLEDGE', 'PRACTICAL', 'OBSERVATION', 'PORTFOLIO']),
  dueDate: z.string().transform(str => new Date(str)),
  notes: z.string().optional(),
  result: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
});

// GET /api/assessments
async function getAssessmentsHandler(request: NextRequest) {
  try {
    const { error, user: currentUser } = await requireAuth(request);
    if (error) return error;

    // Extract pagination parameters
    const { page, pageSize, skip } = getPaginationParams(request);
    
    // Limit pageSize to 50 for performance
    const limit = Math.min(pageSize, 50);

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const groupId = searchParams.get('groupId');
    const all = searchParams.get('all') === 'true';
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

    const authContext = getAuthContext(request);
    if (authContext?.user.role === 'FACILITATOR') {
      if (groupId) {
        const accessError = enforceGroupAccess(groupId, authContext);
        if (accessError) return accessError;
      }

      if (authContext.allowedGroupIds.length === 0) {
        const pagination = createPagination(page, limit, 0);
        return successPaginatedResponse([], pagination);
      }

      where.student = {
        ...(where.student || {}),
        groupId: { in: authContext.allowedGroupIds },
      };
    }

    // Get total count for pagination
    const total = await prisma.assessment.count({ where });

    const assessments = await prisma.assessment.findMany({
      where,
      select: {
        id: true,
        type: true,
        method: true,
        result: true,
        score: true,
        dueDate: true,
        assessedDate: true,
        notes: true,
        feedback: true,
        moderationStatus: true,
        attemptNumber: true,
        createdAt: true,
        studentId: true,
        unitStandardId: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        unitStandard: {
          select: {
            id: true,
            code: true,
            title: true,
            credits: true,
            moduleId: true,
            module: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...(all ? {} : { skip, take: limit }),
    });

    if (all) {
      return successResponse(assessments);
    }

    const pagination = createPagination(page, limit, total);
    return successPaginatedResponse(assessments, pagination);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/assessments
async function createAssessmentHandler(request: NextRequest) {
  try {
    const { error, user: currentUser } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const validatedData = createAssessmentSchema.parse(body);

    const authContext = getAuthContext(request);
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
      select: { groupId: true },
    });
    const accessError = enforceGroupAccess(student?.groupId, authContext);
    if (accessError) return accessError;

    // @ts-ignore - Prisma types need regeneration after schema migration, but code works at runtime
    const assessment = await prisma.assessment.create({
      data: {
        studentId: validatedData.studentId,
        unitStandardId: validatedData.unitStandardId,
        type: validatedData.type,
        method: validatedData.method,
        dueDate: validatedData.dueDate,
        notes: validatedData.notes || null,
        result: validatedData.result || 'PENDING',
        score: validatedData.score || null,
        feedback: validatedData.feedback || null,
        attemptNumber: 1,
        moderationStatus: 'PENDING',
      },
      include: {
        student: {
          include: { group: true },
        },
        unitStandard: {
          include: {
            module: true,
          },
        },
      },
    });

    return successResponse(assessment, 'Assessment created successfully');
  } catch (error) {
    console.error('Assessment creation error:', error);
    return handleApiError(error);
  }
}

// PUT /api/assessments - Mark/Update Assessment
async function updateAssessmentHandler(request: NextRequest) {
  try {
    const { error, user: currentUser } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { id, result, score, feedback, notes, assessedDate, moderationStatus } = body;

    if (!id) {
      return errorResponse('Assessment ID required', 400);
    }

    const existingAssessment = await prisma.assessment.findUnique({
      where: { id },
      select: { student: { select: { groupId: true } } },
    });

    const authContext = getAuthContext(request);
    const accessError = enforceGroupAccess(existingAssessment?.student?.groupId, authContext);
    if (accessError) return accessError;

    // Validate score if provided
    if (score !== undefined && (score < 0 || score > 100)) {
      return errorResponse('Score must be between 0 and 100', 400);
    }

    const update: any = {};

    if (result !== undefined) {
      update.result = result ?? 'PENDING';
    }
    if (score !== undefined) update.score = score;
    if (feedback) update.feedback = feedback;
    if (notes) update.notes = notes;
    if (assessedDate) update.assessedDate = new Date(assessedDate);
    if (moderationStatus) update.moderationStatus = moderationStatus;

    const isReset = result === 'PENDING' || result === null;
    if (isReset) {
      update.result = 'PENDING';
      update.assessedDate = null;
      update.moderationStatus = 'PENDING';
    } else if (result && !assessedDate) {
      // Set assessed date to now if not provided but result is being set
      update.assessedDate = new Date();
    }

    const assessment = await prisma.assessment.update({
      where: { id },
      data: update,
      include: {
        student: { include: { group: true } },
        unitStandard: {
          include: {
            module: true,
          },
        },
      },
    });

    console.log('✅ Assessment marked:', { assessmentId: id, result, score });

    // Atomically update student progress when assessments change
    if (result === 'COMPETENT' && assessment.moderationStatus === 'APPROVED') {
      await prisma.$transaction(async (tx) => {
        await updateStudentProgressUnified(tx, assessment.studentId, assessment.unitStandardId);
      });
    }
    if (isReset || result === 'NOT_YET_COMPETENT') {
      await prisma.$transaction(async (tx) => {
        await updateStudentProgressUnified(tx, assessment.studentId, assessment.unitStandardId);
      });
    }

    return successResponse(assessment, 'Assessment marked successfully');
  } catch (error) {
    console.error('Assessment marking error:', error);
    return handleApiError(error);
  }
}

// DELETE /api/assessments
async function deleteAssessmentHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Assessment ID is required', 400);
    }

    const existingAssessment = await prisma.assessment.findUnique({
      where: { id },
      select: { student: { select: { groupId: true } } },
    });

    const authContext = getAuthContext(request);
    const accessError = enforceGroupAccess(existingAssessment?.student?.groupId, authContext);
    if (accessError) return accessError;

    // Soft delete the assessment
    await softDelete('assessment', id);

    return successResponse(null, 'Assessment archived successfully. Can be restored within 30 days.');
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(withRateLimit(getAssessmentsHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const POST = withAuth(
  withRateLimit(withValidation(createAssessmentHandler, createAssessmentSchema), 'moderate'),
  ['ADMIN', 'FACILITATOR']
);
export const PUT = withAuth(withRateLimit(updateAssessmentHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const DELETE = withAuth(withRateLimit(deleteAssessmentHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
