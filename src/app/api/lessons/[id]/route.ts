import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withRateLimit, getAuthContext } from '@/middleware/apiAuth';

// GET single lesson
async function handleGet(
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
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        return NextResponse.json({ data: lesson });
    } catch (error) {
        console.error('Error fetching lesson:', error);
        return NextResponse.json({ error: 'Failed to fetch lesson' }, { status: 500 });
    }
}

// PUT - Update lesson
async function handlePut(
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
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
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

        return NextResponse.json({ data: lesson });
    } catch (error) {
        console.error('Error updating lesson:', error);
        return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
    }
}

// DELETE - Delete lesson
async function handleDelete(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check if lesson exists
        const existing = await prisma.lessonPlan.findUnique({
            where: { id: params.id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        await prisma.lessonPlan.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true, message: 'Lesson deleted' });
    } catch (error) {
        console.error('Error deleting lesson:', error);
        return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
    }
}

export const GET = withAuth(withRateLimit(handleGet, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const PUT = withAuth(withRateLimit(handlePut, 'strict'), ['ADMIN', 'FACILITATOR']);
export const DELETE = withAuth(withRateLimit(handleDelete, 'strict'), ['ADMIN', 'FACILITATOR']);
