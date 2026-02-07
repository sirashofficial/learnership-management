
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const completionSchema = z.object({
    studentId: z.string(),
    formativeId: z.string(),
    completedDate: z.string().optional(), // ISO string
    score: z.number().optional(),
    passed: z.boolean().optional(),
    moderationStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = completionSchema.parse(body);

        const completion = await prisma.formativeCompletion.upsert({
            where: {
                studentId_formativeId: {
                    studentId: validatedData.studentId,
                    formativeId: validatedData.formativeId,
                },
            },
            update: {
                completedDate: validatedData.completedDate ? new Date(validatedData.completedDate) : undefined,
                score: validatedData.score,
                passed: validatedData.passed,
                moderationStatus: validatedData.moderationStatus,
                notes: validatedData.notes,
            },
            create: {
                studentId: validatedData.studentId,
                formativeId: validatedData.formativeId,
                completedDate: validatedData.completedDate ? new Date(validatedData.completedDate) : new Date(),
                score: validatedData.score,
                passed: validatedData.passed || false,
                moderationStatus: validatedData.moderationStatus || 'PENDING',
                notes: validatedData.notes,
            },
        });

        return NextResponse.json({ success: true, data: completion });
    } catch (error) {
        console.error('Error updating formative completion:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update completion' },
            { status: 500 }
        );
    }
}
