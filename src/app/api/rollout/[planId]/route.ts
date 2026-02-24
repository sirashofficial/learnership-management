import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';
import { enrichRolloutPlanWithStatus } from '@/lib/rollout-status';

// PATCH /api/rollout/[planId] — update actual dates and status for a rollout plan entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    const { planId } = params;
    const body = await request.json();

    const {
      actualStartDate,
      actualEndDate,
      actualSummativeDate,
      actualAssessmentDate,
      projectedStartDate,
      projectedEndDate,
      projectedSummativeDate,
      projectedAssessmentDate,
      notes,
    } = body;

    const existing = await prisma.rolloutPlan.findUnique({ where: { id: planId } });
    if (!existing) return errorResponse('Rollout plan not found', 404);

    // Build update object — only include fields that are explicitly provided
    const updateData: Record<string, any> = {};
    if (actualStartDate !== undefined) updateData.actualStartDate = actualStartDate ? new Date(actualStartDate) : null;
    if (actualEndDate !== undefined) updateData.actualEndDate = actualEndDate ? new Date(actualEndDate) : null;
    if (actualSummativeDate !== undefined) updateData.actualSummativeDate = actualSummativeDate ? new Date(actualSummativeDate) : null;
    if (actualAssessmentDate !== undefined) updateData.actualAssessmentDate = actualAssessmentDate ? new Date(actualAssessmentDate) : null;
    if (projectedStartDate !== undefined) updateData.projectedStartDate = new Date(projectedStartDate);
    if (projectedEndDate !== undefined) updateData.projectedEndDate = new Date(projectedEndDate);
    if (projectedSummativeDate !== undefined) updateData.projectedSummativeDate = projectedSummativeDate ? new Date(projectedSummativeDate) : null;
    if (projectedAssessmentDate !== undefined) updateData.projectedAssessmentDate = projectedAssessmentDate ? new Date(projectedAssessmentDate) : null;
    if (notes !== undefined) updateData.notes = notes;
    // NOTE: status field is no longer accepted — it's computed from dates

    const updated = await prisma.rolloutPlan.update({
      where: { id: planId },
      data: updateData,
      include: { module: true },
    });

    // Compute and enrich with status
    const enriched = enrichRolloutPlanWithStatus(updated);

    return successResponse(enriched);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/rollout/[planId] — delete a rollout plan entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    await prisma.rolloutPlan.delete({ where: { id: params.planId } });
    return successResponse(null, 'Rollout plan entry deleted');
  } catch (error) {
    return handleApiError(error);
  }
}
