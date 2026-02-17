import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';
import { calculateRolloutPlan } from '@/lib/rolloutUtils';

// POST /api/groups/auto-rollout
// Generate default 12-month rollout plans for all groups without plans
export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { groupIds, overwrite } = body; // groupIds is optional; if not provided, process all

    // Get groups without rollout plans (or all if overwrite is true)
    const groups = await prisma.group.findMany({
      where: {
        status: 'ACTIVE',
        ...(groupIds && { id: { in: Array.isArray(groupIds) ? groupIds : [groupIds] } }),
      },
      include: { rolloutPlan: true },
    });

    const groupsToProcess = overwrite
      ? groups
      : groups.filter((g) => !g.rolloutPlan);

    if (groupsToProcess.length === 0) {
      return successResponse(
        { processed: 0, groups: [] },
        'No groups need rollout plans'
      );
    }

    // Generate rollout plans
    const results = await Promise.all(
      groupsToProcess.map(async (group) => {
        try {
          const startDate = new Date(group.startDate);
          const planData: any = { groupId: group.id };
          const modulePlan = calculateRolloutPlan(startDate);

          for (const module of modulePlan) {
            planData[`module${module.moduleNumber}StartDate`] = module.startDate;
            planData[`module${module.moduleNumber}EndDate`] = module.endDate;
          }

          const planEndDate = modulePlan[modulePlan.length - 1]?.endDate;
          if (group.endDate && planEndDate && planEndDate > group.endDate) {
            const adjustmentDays = Math.ceil(
              (planEndDate.getTime() - group.endDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            console.warn(
              `Group ${group.name}: Rollout extends ${adjustmentDays} days beyond group end date`
            );
          }

          // Upsert rollout plan
          const rolloutPlan = await prisma.groupRolloutPlan.upsert({
            where: { groupId: group.id },
            create: planData,
            update: planData,
          });

          return {
            groupId: group.id,
            groupName: group.name,
            status: 'success',
            startDate: new Date(startDate).toISOString().split('T')[0],
            endDate: planEndDate ? planEndDate.toISOString().split('T')[0] : new Date(startDate).toISOString().split('T')[0],
            rolloutPath: rolloutPlan.rolloutDocPath || 'Generated - NVC L2 Standard',
          };
        } catch (err) {
          return {
            groupId: group.id,
            groupName: group.name,
            status: 'error',
            error: String(err),
          };
        }
      })
    );

    const successful = results.filter((r) => r.status === 'success');
    const failed = results.filter((r) => r.status === 'error');

    return successResponse(
      {
        processed: groupsToProcess.length,
        successful: successful.length,
        failed: failed.length,
        groups: results,
      },
      `Generated rollout plans for ${successful.length} groups`
    );
  } catch (error) {
    console.error('Error generating rollout plans:', error);
    return handleApiError(error);
  }
}

// GET /api/groups/auto-rollout
// Check which groups are missing rollout plans
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const groups = await prisma.group.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        students: { select: { id: true } },
        rolloutPlan: {
          select: {
            id: true,
            module1StartDate: true,
            module6EndDate: true,
          },
        },
      },
    });

    const withoutPlans = groups.filter((g: any) => !g.rolloutPlan);
    const withPlans = groups.filter((g: any) => g.rolloutPlan);

    return successResponse(
      {
        total: groups.length,
        withPlans: withPlans.length,
        withoutPlans: withoutPlans.length,
        groupsMissingPlans: withoutPlans.map((g: any) => ({
          id: g.id,
          name: g.name,
          startDate: g.startDate,
          studentCount: g.students.length,
        })),
      },
      `${withoutPlans.length} groups missing rollout plans`
    );
  } catch (error) {
    console.error('Error checking rollout plans:', error);
    return handleApiError(error);
  }
}
