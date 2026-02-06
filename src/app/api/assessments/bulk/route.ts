import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

// POST /api/assessments/bulk - Bulk create assessments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentIds, unitStandard, module, type, method, dueDate, unitStandardId, notes } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return errorResponse('Student IDs are required', 400);
    }

    if (!unitStandard || !module || !type || !method || !dueDate) {
      return errorResponse('All required fields must be provided', 400);
    }

    // Create assessments for all students
    const assessments = await Promise.all(
      studentIds.map((studentId: string) =>
        prisma.assessment.create({
          data: {
            studentId,
            unitStandard,
            module,
            type,
            method,
            dueDate: new Date(dueDate),
            unitStandardId,
            notes,
            attemptNumber: 1,
            moderationStatus: 'PENDING',
          },
          include: {
            student: {
              include: { group: true },
            },
            unitStandardRef: true,
          },
        })
      )
    );

    return successResponse(assessments, `Created ${assessments.length} assessments`);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/assessments/bulk - Bulk update assessment results
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { assessmentIds, result, score, feedback, notes } = body;

    if (!assessmentIds || !Array.isArray(assessmentIds) || assessmentIds.length === 0) {
      return errorResponse('Assessment IDs are required', 400);
    }

    const updated = await Promise.all(
      assessmentIds.map((id: string) =>
        prisma.assessment.update({
          where: { id },
          data: {
            result,
            score,
            feedback,
            notes,
            assessedDate: new Date(),
            moderationStatus: result ? 'PENDING' : undefined,
          },
          include: {
            student: true,
          },
        })
      )
    );

    return successResponse(updated, `Updated ${updated.length} assessments`);
  } catch (error) {
    return handleApiError(error);
  }
}
