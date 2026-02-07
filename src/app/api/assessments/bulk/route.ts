import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { z } from 'zod';

const bulkAssessmentSchema = z.object({
  studentIds: z.array(z.string()),
  unitStandardId: z.string(),
  result: z.string(),
  type: z.enum(['FORMATIVE', 'SUMMATIVE', 'INTEGRATED']),
  method: z.enum(['KNOWLEDGE', 'PRACTICAL', 'OBSERVATION', 'PORTFOLIO']),
  assessedDate: z.string().transform(str => new Date(str)),
  notes: z.string().optional(),
});

// POST /api/assessments/bulk - Mass award credits/results
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = bulkAssessmentSchema.parse(body);
    const { studentIds, unitStandardId, result, type, method, assessedDate, notes } = validatedData;

    if (studentIds.length === 0) {
      return errorResponse('No students selected', 400);
    }

    // 1. Create Assessment records for all students
    const assessments = await Promise.all(studentIds.map(async (studentId) => {
      return prisma.assessment.create({
        data: {
          studentId,
          unitStandardId,
          type,
          method,
          dueDate: assessedDate, // For bulk award, due date is set to assessment date
          assessedDate,
          result,
          moderationStatus: 'APPROVED', // Bulk award implies pre-approved
          attemptNumber: 1,
          notes: notes || 'Bulk credit award',
        },
        include: {
          unitStandard: true
        }
      });
    }));

    // 2. Update progress for all affected students
    for (const studentId of studentIds) {
      await updateStudentProgressAfterBulk(studentId, unitStandardId);
    }

    return successResponse({ count: assessments.length }, `Successfully awarded credits to ${assessments.length} students`);
  } catch (error) {
    console.error('Bulk assessment error:', error);
    return handleApiError(error);
  }
}

// Helper function to update student progress after bulk marking
async function updateStudentProgressAfterBulk(studentId: string, unitStandardId: string) {
  try {
    // A. Update Unit Standard Progress
    await prisma.unitStandardProgress.upsert({
      where: {
        studentId_unitStandardId: { studentId, unitStandardId }
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

    // B. Get all competent/approved assessments
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

    // C. Calculate total credits
    const uniqueUnitStandards = new Set<string>();
    let totalCreditsEarned = 0;
    const affectedModuleIds = new Set<string>();

    for (const assessment of approvedAssessments) {
      if (assessment.unitStandard && !uniqueUnitStandards.has(assessment.unitStandardId)) {
        uniqueUnitStandards.add(assessment.unitStandardId);
        totalCreditsEarned += assessment.unitStandard.credits || 0;
        affectedModuleIds.add(assessment.unitStandard.moduleId);
      }
    }

    // D. Update Student
    const totalCreditsRequired = 138;
    await prisma.student.update({
      where: { id: studentId },
      data: {
        totalCreditsEarned,
        progress: Math.round((totalCreditsEarned / totalCreditsRequired) * 100)
      }
    });

    // E. Update Module Progress
    for (const moduleId of affectedModuleIds) {
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
        include: { unitStandards: true }
      });

      if (!module) continue;

      let moduleCreditsEarned = 0;
      let completedCount = 0;

      for (const us of module.unitStandards) {
        if (uniqueUnitStandards.has(us.id)) {
          moduleCreditsEarned += us.credits;
          completedCount++;
        }
      }

      const isCompleted = completedCount === module.unitStandards.length;
      const progress = Math.round((moduleCreditsEarned / module.credits) * 100);

      await prisma.moduleProgress.upsert({
        where: { studentId_moduleId: { studentId, moduleId } },
        create: {
          studentId,
          moduleId,
          creditsEarned: moduleCreditsEarned,
          progress,
          status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          startDate: new Date(),
          completionDate: isCompleted ? new Date() : null
        },
        update: {
          creditsEarned: moduleCreditsEarned,
          progress,
          status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          completionDate: isCompleted ? new Date() : null
        }
      });
    }
  } catch (error) {
    console.error(`Error updating progress for student ${studentId}:`, error);
  }
}
