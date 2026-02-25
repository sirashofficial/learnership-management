import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';
import { addDays } from 'date-fns';
import { enrichRolloutPlansWithStatus } from '@/lib/rollout-status';
import { enforceGroupAccess, getAuthContext, withAuth, withRateLimit } from '@/middleware/apiAuth';

export const dynamic = 'force-dynamic';

// GET /api/rollout?groupId=xxx — fetch rollout plan for a group
async function getRolloutHandler(request: NextRequest) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) return errorResponse('groupId is required', 400);

    const authContext = getAuthContext(request);
    const accessError = enforceGroupAccess(groupId, authContext);
    if (accessError) return accessError;

    const plans = await prisma.rolloutPlan.findMany({
      where: { groupId },
      include: {
        module: {
          include: { unitStandards: true },
        },
      },
      orderBy: { moduleNumber: 'asc' },
    });

    // Compute status dynamically for each plan
    const enriched = enrichRolloutPlansWithStatus(plans);

    return successResponse(enriched);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/rollout/generate — auto-generate rollout plan for a group
async function createRolloutHandler(request: NextRequest) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { groupId, startDate: startDateStr, moduleDurations } = body as {
      groupId: string;
      startDate: string;
      moduleDurations?: Record<string, number>; // moduleId -> durationWeeks
    };

    if (!groupId) return errorResponse('groupId is required', 400);
    if (!startDateStr) return errorResponse('startDate is required', 400);

    const authContext = getAuthContext(request);
    const accessError = enforceGroupAccess(groupId, authContext);
    if (accessError) return accessError;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, name: true, startDate: true },
    });
    if (!group) return errorResponse('Group not found', 404);

    const modules = await prisma.module.findMany({
      select: { id: true, moduleNumber: true, name: true, credits: true, notionalHours: true, classroomHours: true },
      orderBy: { moduleNumber: 'asc' },
    });

    const startDate = new Date(startDateStr);
    let currentDate = startDate;
    const created: any[] = [];

    for (const mod of modules) {
      // Duration: use provided override or calculate from notional hours (assuming 6 hours/day, 5 days/week)
      const durationWeeks =
        moduleDurations?.[mod.id] ??
        Math.ceil((mod.classroomHours || mod.notionalHours || 40) / 30); // ~30h/week

      const projectedStartDate = new Date(currentDate);
      const projectedEndDate = addDays(projectedStartDate, durationWeeks * 7);
      const projectedSummativeDate = addDays(projectedEndDate, -3); // 3 days before end
      const projectedAssessmentDate = projectedEndDate;

      const plan = await prisma.rolloutPlan.upsert({
        where: { groupId_moduleId: { groupId, moduleId: mod.id } },
        create: {
          groupId,
          moduleId: mod.id,
          moduleNumber: mod.moduleNumber,
          projectedStartDate,
          projectedEndDate,
          projectedSummativeDate,
          projectedAssessmentDate,
          credits: mod.credits,
        },
        update: {
          moduleNumber: mod.moduleNumber,
          projectedStartDate,
          projectedEndDate,
          projectedSummativeDate,
          projectedAssessmentDate,
          credits: mod.credits,
        },
      });

      created.push(plan);
      currentDate = addDays(projectedEndDate, 1); // Next module starts day after
    }

    return successResponse(created, `Rollout plan generated for ${created.length} modules`);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(withRateLimit(getRolloutHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const POST = withAuth(withRateLimit(createRolloutHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
