import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

// POST /api/groups/[id]/rollout
// Body: { rolloutPlan: { module1StartDate, module1EndDate, ... } }
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { rolloutPlan } = body;

        if (!rolloutPlan) {
            return errorResponse('Rollout plan data is required', 400);
        }

        const updatedPlan = await prisma.groupRolloutPlan.upsert({
            where: { groupId: params.id },
            update: {
                module1StartDate: rolloutPlan.module1StartDate ? new Date(rolloutPlan.module1StartDate) : null,
                module1EndDate: rolloutPlan.module1EndDate ? new Date(rolloutPlan.module1EndDate) : null,
                module2StartDate: rolloutPlan.module2StartDate ? new Date(rolloutPlan.module2StartDate) : null,
                module2EndDate: rolloutPlan.module2EndDate ? new Date(rolloutPlan.module2EndDate) : null,
                module3StartDate: rolloutPlan.module3StartDate ? new Date(rolloutPlan.module3StartDate) : null,
                module3EndDate: rolloutPlan.module3EndDate ? new Date(rolloutPlan.module3EndDate) : null,
                module4StartDate: rolloutPlan.module4StartDate ? new Date(rolloutPlan.module4StartDate) : null,
                module4EndDate: rolloutPlan.module4EndDate ? new Date(rolloutPlan.module4EndDate) : null,
                module5StartDate: rolloutPlan.module5StartDate ? new Date(rolloutPlan.module5StartDate) : null,
                module5EndDate: rolloutPlan.module5EndDate ? new Date(rolloutPlan.module5EndDate) : null,
                module6StartDate: rolloutPlan.module6StartDate ? new Date(rolloutPlan.module6StartDate) : null,
                module6EndDate: rolloutPlan.module6EndDate ? new Date(rolloutPlan.module6EndDate) : null,
            },
            create: {
                groupId: params.id,
                module1StartDate: rolloutPlan.module1StartDate ? new Date(rolloutPlan.module1StartDate) : null,
                module1EndDate: rolloutPlan.module1EndDate ? new Date(rolloutPlan.module1EndDate) : null,
                module2StartDate: rolloutPlan.module2StartDate ? new Date(rolloutPlan.module2StartDate) : null,
                module2EndDate: rolloutPlan.module2EndDate ? new Date(rolloutPlan.module2EndDate) : null,
                module3StartDate: rolloutPlan.module3StartDate ? new Date(rolloutPlan.module3StartDate) : null,
                module3EndDate: rolloutPlan.module3EndDate ? new Date(rolloutPlan.module3EndDate) : null,
                module4StartDate: rolloutPlan.module4StartDate ? new Date(rolloutPlan.module4StartDate) : null,
                module4EndDate: rolloutPlan.module4EndDate ? new Date(rolloutPlan.module4EndDate) : null,
                module5StartDate: rolloutPlan.module5StartDate ? new Date(rolloutPlan.module5StartDate) : null,
                module5EndDate: rolloutPlan.module5EndDate ? new Date(rolloutPlan.module5EndDate) : null,
                module6StartDate: rolloutPlan.module6StartDate ? new Date(rolloutPlan.module6StartDate) : null,
                module6EndDate: rolloutPlan.module6EndDate ? new Date(rolloutPlan.module6EndDate) : null,
                rolloutDocPath: 'docs/Curriculumn and data process/Roll out Plans/Generic_Rollout.pdf'
            },
        });

        return successResponse(updatedPlan, 'Rollout plan updated successfully');
    } catch (error) {
        return handleApiError(error);
    }
}
