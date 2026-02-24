import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { updateStudentProgress } from '@/lib/progress-calculator';
import { z } from 'zod';
import { requireAuth } from '@/lib/middleware';

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
    const { error, user: currentUser } = await requireAuth(request);
    if (error) return error;

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
      await updateStudentProgress(studentId, unitStandardId);
    }

    return successResponse({ count: assessments.length }, `Successfully awarded credits to ${assessments.length} students`);
  } catch (error) {
    console.error('Bulk assessment error:', error);
    return handleApiError(error);
  }
}
