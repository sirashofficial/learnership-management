
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { z } from 'zod';

// Validation schema for assigning a template to a group
const assignmentSchema = z.object({
    groupId: z.string().min(1, "Group ID is required"),
    templateId: z.string().min(1, "Template ID is required"),
    startDate: z.string().transform(str => new Date(str)),
    endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
});

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const groupId = searchParams.get('groupId');

        if (!groupId) {
            return errorResponse('Group ID is required', 400);
        }

        const whereClause = groupId === 'all' ? {} : { groupId };

        const schedules = await prisma.groupSchedule.findMany({
            where: whereClause,
            include: {
                template: true,
                group: true, // Include group info when fetching all
            },
            orderBy: { startDate: 'desc' },
        });

        return successResponse(schedules);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = assignmentSchema.parse(body);

        // Check if group already has an active schedule overlapping with this one
        // For simplicity in this iteration, we just allow creating it.
        // In a real app, logic would be needed to handle overlapping dates.

        const groupSchedule = await prisma.groupSchedule.create({
            data: {
                groupId: validatedData.groupId,
                templateId: validatedData.templateId,
                startDate: validatedData.startDate,
                endDate: validatedData.endDate,
            },
        });

        return successResponse(groupSchedule, "Schedule assigned successfully", 201);
    } catch (error) {
        return handleApiError(error);
    }
}
