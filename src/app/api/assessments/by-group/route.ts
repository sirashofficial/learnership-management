import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/assessments/by-group
 * Get all assessments organized by module and unit standard for a group
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get('groupId');
        const moduleId = searchParams.get('moduleId');

        if (!groupId) {
            return NextResponse.json(
                { error: 'groupId is required' },
                { status: 400 }
            );
        }

        // Get all students in the group
        const students = await prisma.student.findMany({
            where: { groupId },
            select: {
                id: true,
                studentId: true,
                firstName: true,
                lastName: true
            },
            orderBy: [
                { firstName: 'asc' },
                { lastName: 'asc' }
            ]
        });

        if (students.length === 0) {
            return NextResponse.json({
                modules: [],
                message: 'No students in this group'
            });
        }

        // Get modules with unit standards
        const moduleWhere: any = {};
        if (moduleId) {
            moduleWhere.id = moduleId;
        }

        const modules = await prisma.module.findMany({
            where: moduleWhere,
            include: {
                unitStandards: {
                    orderBy: { code: 'asc' }
                }
            },
            orderBy: { moduleNumber: 'asc' }
        });

        // Get all assessments for these students
        const studentIds = students.map(s => s.id);
        const assessments = await prisma.assessment.findMany({
            where: {
                studentId: { in: studentIds },
                type: 'FORMATIVE'
            },
            select: {
                id: true,
                studentId: true,
                unitStandardId: true,
                result: true,
                assessedDate: true,
                dueDate: true
            }
        });

        // Organize data hierarchically
        const result = modules.map(module => ({
            moduleId: module.id,
            moduleNumber: module.moduleNumber,
            moduleName: module.name,
            moduleCode: module.code,
            totalCredits: module.credits,
            unitStandards: module.unitStandards.map(unitStandard => {
                // Get assessments for this unit standard
                const unitStandardAssessments = assessments.filter(
                    a => a.unitStandardId === unitStandard.id
                );

                // Map to students
                const studentAssessments = students.map(student => {
                    const assessment = unitStandardAssessments.find(
                        a => a.studentId === student.id
                    );

                    return {
                        studentId: student.id,
                        studentNumber: student.studentId,
                        studentName: `${student.firstName} ${student.lastName}`,
                        assessmentId: assessment?.id || null,
                        result: assessment?.result || 'PENDING',
                        assessedDate: assessment?.assessedDate || null,
                        dueDate: assessment?.dueDate || null,
                        isComplete: assessment?.result === 'COMPETENT'
                    };
                });

                // Calculate completion stats
                const completedCount = studentAssessments.filter(sa => sa.isComplete).length;
                const totalCount = studentAssessments.length;
                const completionPercentage = totalCount > 0
                    ? Math.round((completedCount / totalCount) * 100)
                    : 0;

                return {
                    unitStandardId: unitStandard.id,
                    code: unitStandard.code,
                    title: unitStandard.title,
                    credits: unitStandard.credits,
                    completedCount,
                    totalCount,
                    completionPercentage,
                    students: studentAssessments
                };
            })
        }));

        return NextResponse.json({
            groupId,
            studentCount: students.length,
            modules: result
        });

    } catch (error) {
        console.error('Error fetching assessments by group:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assessments', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
