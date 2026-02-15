import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';

// GET /api/groups/progress — Returns actual assessment progress for each group
// Used by Group Cards to show Projected vs Actual progress
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get('groupId');

        // Build query filter
        const groupFilter = groupId ? { id: groupId } : { status: { not: 'ARCHIVED' } };

        // Fetch all active groups with their students and competent assessments
        const groups = await prisma.group.findMany({
            where: groupFilter,
            select: {
                id: true,
                name: true,
                students: {
                    select: {
                        id: true,
                        totalCreditsEarned: true,
                        progress: true,
                        assessments: {
                            where: {
                                result: 'COMPETENT',
                            },
                            select: {
                                unitStandard: {
                                    select: {
                                        id: true,
                                        credits: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Calculate actual progress per group
        const progressData = groups.map(group => {
            const totalStudents = group.students.length;
            let totalCreditsEarned = 0;
            let totalUniqueUnitsPassed = 0;

            for (const student of group.students) {
                // Deduplicate assessments by unit standard
                const uniqueUnits = new Map<string, number>();
                for (const assessment of student.assessments) {
                    if (assessment.unitStandard) {
                        uniqueUnits.set(assessment.unitStandard.id, assessment.unitStandard.credits || 0);
                    }
                }
                const studentCredits = Array.from(uniqueUnits.values()).reduce((sum, c) => sum + c, 0);
                totalCreditsEarned += studentCredits;
                totalUniqueUnitsPassed += uniqueUnits.size;
            }

            // Average credits per student
            const avgCreditsPerStudent = totalStudents > 0
                ? Math.round(totalCreditsEarned / totalStudents)
                : 0;
            const avgProgressPercent = totalStudents > 0
                ? Math.round((avgCreditsPerStudent / 140) * 100)
                : 0;

            return {
                groupId: group.id,
                groupName: group.name,
                totalStudents,
                avgCreditsPerStudent,
                avgProgressPercent,
                totalCreditsEarned,
                totalUniqueUnitsPassed,
            };
        });

        return successResponse(progressData);
    } catch (error) {
        return handleApiError(error);
    }
}
