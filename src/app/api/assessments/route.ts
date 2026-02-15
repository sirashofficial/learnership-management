import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { z } from 'zod';
import { requireAuth } from '@/lib/middleware';

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
export async function GET(request: NextRequest) {
  try {
    const { error, user: currentUser } = await requireAuth(request);
    if (error) return error;

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
        unitStandard: {
          include: {
            module: true,
          },
        },
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
    const { error, user: currentUser } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const validatedData = createAssessmentSchema.parse(body);

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
export async function PUT(request: NextRequest) {
  try {
    const { error, user: currentUser } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { id, result, score, feedback, notes, assessedDate, moderationStatus } = body;

    if (!id) {
      return errorResponse('Assessment ID required', 400);
    }

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

    // Update student progress when assessments change
    if (result === 'COMPETENT' && assessment.moderationStatus === 'APPROVED') {
      await updateStudentProgress(assessment.studentId, assessment.unitStandardId);
    }
    if (isReset || result === 'NOT_YET_COMPETENT') {
      await updateStudentProgress(assessment.studentId, assessment.unitStandardId);
    }

    return successResponse(assessment, 'Assessment marked successfully');
  } catch (error) {
    console.error('Assessment marking error:', error);
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

// Helper function to update student progress based on NVC Level 2 credits
async function updateStudentProgress(studentId: string, unitStandardId?: string | null) {
  try {
    // 1. Mark Unit Standard as COMPLETED if it wasn't already
    if (unitStandardId) {
      await prisma.unitStandardProgress.upsert({
        where: {
          studentId_unitStandardId: {
            studentId,
            unitStandardId
          }
        },
        create: {
          studentId,
          unitStandardId,
          status: 'COMPLETED',
          completionDate: new Date(),
          summativePassed: true
        },
        update: {
          status: 'COMPLETED',
          completionDate: new Date(),
          summativePassed: true
        }
      });
    }

    // 2. Get all competent/approved assessments for this student
    const approvedAssessments = await prisma.assessment.findMany({
      where: {
        studentId,
        result: 'COMPETENT',
        moderationStatus: 'APPROVED',
      },
      include: {
        unitStandard: true
      }
    });

    // 3. Calculate total credits earned (deduplicate by unit standard)
    const uniqueUnitStandards = new Set<string>();
    let totalCreditsEarned = 0;

    for (const assessment of approvedAssessments) {
      if (assessment.unitStandard && !uniqueUnitStandards.has(assessment.unitStandardId!)) {
        uniqueUnitStandards.add(assessment.unitStandardId!);
        totalCreditsEarned += assessment.unitStandard.credits || 0;
      }
    }

    // 4. Update student record
    const totalCreditsRequired = 138;
    const progressPercentage = Math.round((totalCreditsEarned / totalCreditsRequired) * 100);

    await prisma.student.update({
      where: { id: studentId },
      data: {
        totalCreditsEarned,
        progress: progressPercentage // Keep 'progress' for legacy UI support
      }
    });

    // 5. Update Module Progress for affected modules
    // Fetch unique modules involved
    const affectedModuleIds = new Set<string>();
    for (const assessment of approvedAssessments) {
      if (assessment.unitStandard) {
        affectedModuleIds.add(assessment.unitStandard.moduleId);
      }
    }

    for (const moduleId of affectedModuleIds) {
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
        include: { unitStandards: true }
      });

      if (!module) continue;

      // Calculate credits for this module
      let moduleCreditsEarned = 0;
      let completedCount = 0;

      for (const us of module.unitStandards) {
        if (uniqueUnitStandards.has(us.id)) {
          moduleCreditsEarned += us.credits;
          completedCount++;
        }
      }

      const modulePercentage = Math.round((moduleCreditsEarned / module.credits) * 100);
      const isCompleted = completedCount === module.unitStandards.length;

      await prisma.moduleProgress.upsert({
        where: {
          studentId_moduleId: {
            studentId,
            moduleId
          }
        },
        create: {
          studentId,
          moduleId,
          creditsEarned: moduleCreditsEarned,
          progress: modulePercentage,
          status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          startDate: new Date(),
          completionDate: isCompleted ? new Date() : null
        },
        update: {
          creditsEarned: moduleCreditsEarned,
          progress: modulePercentage,
          status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          completionDate: isCompleted ? new Date() : null
        }
      });
    }

  } catch (error) {
    console.error('Error in updateStudentProgress:', error);
  }
}
