import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
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
                status: 'PENDING',
            },
        });

        return NextResponse.json({ success: true, data: task });
    } catch (error: any) {
        console.error('Error creating facilitator task:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { taskId, status } = body;

        if (!taskId) {
            return NextResponse.json({ error: 'TaskId is required' }, { status: 400 });
        }

        const task = await prisma.facilitatorTask.update({
            where: { id: taskId },
            data: {
                status,
                completedAt: status === 'COMPLETED' ? new Date() : null,
            },
        });

        return NextResponse.json({ success: true, data: task });
    } catch (error: any) {
        console.error('Error updating facilitator task:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
