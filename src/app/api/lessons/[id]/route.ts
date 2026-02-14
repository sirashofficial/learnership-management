import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// GET single lesson
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const lesson = await prisma.lessonPlan.findUnique({
            where: { id: params.id },
            include: {
                module: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                facilitator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!lesson) {
            return Response.json({ error: 'Lesson not found' }, { status: 404 });
        }

        return Response.json({ data: lesson });
    } catch (error) {
        console.error('Error fetching lesson:', error);
        return Response.json({ error: 'Failed to fetch lesson' }, { status: 500 });
    }
}

// PUT - Update lesson
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        // Check if lesson exists
        const existing = await prisma.lessonPlan.findUnique({
            where: { id: params.id },
        });

        if (!existing) {
            return Response.json({ error: 'Lesson not found' }, { status: 404 });
        }

        const lesson = await prisma.lessonPlan.update({
            where: { id: params.id },
            data: {
                title: body.title,
                description: body.description || null,
                date: body.date ? new Date(body.date) : undefined,
                startTime: body.startTime,
                endTime: body.endTime,
                venue: body.venue || null,
                objectives: body.objectives ? JSON.stringify(body.objectives) : null,
                materials: body.materials ? JSON.stringify(body.materials) : null,
                activities: body.activities ? JSON.stringify(body.activities) : null,
                notes: body.notes || null,
                moduleId: body.moduleId,
                facilitatorId: body.facilitatorId,
                groupId: body.groupId || null,
            },
            include: {
                module: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                facilitator: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                group: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return Response.json({ data: lesson });
    } catch (error) {
        console.error('Error updating lesson:', error);
        return Response.json({ error: 'Failed to update lesson' }, { status: 500 });
    }
}

// DELETE - Delete lesson
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check if lesson exists
        const existing = await prisma.lessonPlan.findUnique({
            where: { id: params.id },
        });

        if (!existing) {
            return Response.json({ error: 'Lesson not found' }, { status: 404 });
        }

        await prisma.lessonPlan.delete({
            where: { id: params.id },
        });

        return Response.json({ success: true, message: 'Lesson deleted' });
    } catch (error) {
        console.error('Error deleting lesson:', error);
        return Response.json({ error: 'Failed to delete lesson' }, { status: 500 });
    }
}
