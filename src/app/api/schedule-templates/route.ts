
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { z } from 'zod';

// Validation schema for creating/updating templates
const templateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    schedule: z.string().min(1, "Schedule definition is required"), // JSON string
});

export async function GET(request: NextRequest) {
    try {
        const templates = await prisma.scheduleTemplate.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { groups: true }
                }
            }
        });

        return successResponse(templates);
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = templateSchema.parse(body);

        const template = await prisma.scheduleTemplate.create({
            data: validatedData,
        });

        return successResponse(template, "Template created successfully", 201);
    } catch (error) {
        return handleApiError(error);
    }
}
