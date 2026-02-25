import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

async function handlePost(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, description, dueDate, groupId } = body;

        if (!title || !groupId) {
            return NextResponse.json({ error: 'Title and groupId are required' }, { status: 400 });
        }

        const task = await prisma.facilitatorTask.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                groupId,
            },
        });

        return NextResponse.json({ success: true, data: task });
    } catch (error: any) {
        console.error('Error creating facilitator task:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function handlePatch(req: NextRequest) {
    try {
        const body = await req.json();
        const { taskId, completed } = body;

        if (!taskId) {
            return NextResponse.json({ error: 'TaskId is required' }, { status: 400 });
        }

        const task = await prisma.facilitatorTask.update({
            where: { id: taskId },
            data: {
                completed: Boolean(completed),
                completedAt: completed ? new Date() : null,
            },
        });

        return NextResponse.json({ success: true, data: task });
    } catch (error: any) {
        console.error('Error updating facilitator task:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withAuth(withRateLimit(handlePost, 'strict'), ['ADMIN', 'FACILITATOR']);
export const PATCH = withAuth(withRateLimit(handlePatch, 'moderate'), ['ADMIN', 'FACILITATOR']);
