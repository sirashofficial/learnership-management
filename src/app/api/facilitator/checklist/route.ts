import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {
    successResponse,
    handleApiError,
} from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';
import { startOfDay, endOfDay, addDays } from 'date-fns';

// GET /api/facilitator/checklist - Get upcoming and current teaching tasks
export async function GET(request: NextRequest) {
    try {
        const { error, user } = await requireAuth(request);
        if (error) return error;

        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get('groupId');

        const today = startOfDay(new Date());
        const tomorrow = endOfDay(addDays(today, 1));

        // Get all rollouts for this group (or all groups if none specified)
        const whereClause: any = groupId ? { groupId } : {};

        const rollouts = await prisma.unitStandardRollout.findMany({
            where: whereClause,
            include: {
                unitStandard: {
                    include: {
                        module: true,
                    },
                },
                group: {
                    select: { name: true }
                }
            },
            orderBy: { startDate: 'asc' },
        });

        // Categorize rollouts based on facilitator completion and dates
        const todayTasks = rollouts.filter(r =>
            // @ts-ignore
            !r.facilitated &&
            r.startDate &&
            new Date(r.startDate) <= tomorrow &&
            (!r.endDate || new Date(r.endDate) >= today)
        );

        const overdueTasks = rollouts.filter(r =>
            // @ts-ignore
            !r.facilitated &&
            r.endDate &&
            new Date(r.endDate) < today
        );

        const upcomingTasks = rollouts.filter(r =>
            // @ts-ignore
            !r.facilitated &&
            r.startDate &&
            new Date(r.startDate) > tomorrow
        );

        // Get any manual tasks (Safe check for new model)
        let manualTasks = [];
        if ((prisma as any).facilitatorTask) {
            manualTasks = await (prisma as any).facilitatorTask.findMany({
                where: {
                    ...whereClause,
                    completed: false
                },
                include: {
                    group: { select: { name: true } }
                },
                orderBy: { dueDate: 'asc' }
            });
        }

        return successResponse({
            todayUnits: todayTasks,
            overdueUnits: overdueTasks,
            upcomingUnits: upcomingTasks,
            // Backwards compatibility for components expecting short names
            today: todayTasks,
            overdue: overdueTasks,
            upcoming: upcomingTasks,
            manualTasks,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// POST /api/facilitator/checklist - Mark a unit standard as "Done"
export async function POST(request: NextRequest) {
    try {
        const { error, user } = await requireAuth(request);
        if (error) return error;

        const body = await request.json();
        const { rolloutId, facilitated, notes } = body;

        if (!rolloutId) throw new Error('rolloutId is required');

        // @ts-ignore - prisma types might not be updated yet
        const updatedRollout = await prisma.unitStandardRollout.update({
            where: { id: rolloutId },
            data: {
                facilitated: facilitated ?? true,
                facilitatedAt: facilitated === false ? null : new Date(),
                facilitatorNotes: notes || undefined,
            },
        });

        return successResponse(updatedRollout);
    } catch (error) {
        return handleApiError(error);
    }
}
