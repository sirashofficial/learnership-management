import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/assessments/bulk-generate
 * Generate all required assessments for a student
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { studentId } = body;

        if (!studentId) {
            return NextResponse.json(
                { error: 'studentId is required' },
                { status: 400 }
            );
        }

        // Verify student exists
        const student = await prisma.student.findUnique({
            where: { id: studentId }
        });

        if (!student) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404 }
            );
        }

        // Get all modules with their unit standards
        const modules = await prisma.module.findMany({
            include: {
                unitStandards: true
            },
            orderBy: {
                moduleNumber: 'asc'
            }
        });

        // Check which assessments already exist
        const existingAssessments = await prisma.assessment.findMany({
            where: { studentId },
            select: { unitStandardId: true }
        });

        const existingUnitStandardIds = new Set(
            existingAssessments.map(a => a.unitStandardId)
        );

        // Generate assessments for missing unit standards
        const assessmentsToCreate = [];
        let totalCredits = 0;

        for (const module of modules) {
            for (const unitStandard of module.unitStandards) {
                // Skip if assessment already exists
                if (existingUnitStandardIds.has(unitStandard.id)) {
                    continue;
                }

                assessmentsToCreate.push({
                    studentId,
                    unitStandardId: unitStandard.id,
                    type: 'FORMATIVE',
                    method: 'KNOWLEDGE',
                    result: 'PENDING',
                    dueDate: new Date(),
                    attemptNumber: 1,
                    moderationStatus: 'PENDING'
                });

                totalCredits += unitStandard.credits;
            }
        }

        // Bulk create assessments
        if (assessmentsToCreate.length > 0) {
            // @ts-ignore - Prisma types need regeneration
            await prisma.assessment.createMany({
                data: assessmentsToCreate
            });
        }

        return NextResponse.json({
            success: true,
            message: `Generated ${assessmentsToCreate.length} assessments`,
            created: assessmentsToCreate.length,
            alreadyExisted: existingAssessments.length,
            totalCredits,
            breakdown: modules.map(m => ({
                module: m.name,
                unitStandards: m.unitStandards.length,
                credits: m.credits
            }))
        }, { status: 201 });

    } catch (error) {
        console.error('Error generating assessments:', error);
        return NextResponse.json(
            { error: 'Failed to generate assessments', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
