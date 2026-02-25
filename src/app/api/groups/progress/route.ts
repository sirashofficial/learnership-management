import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';
import { enforceGroupAccess, getAuthContext, withAuth, withRateLimit } from '@/middleware/apiAuth';

// Force dynamic rendering for this route (requires request.url for query params)
export const dynamic = 'force-dynamic';

// GET /api/groups/progress — Returns actual assessment progress for each group
// Used by Group Cards to show Projected vs Actual progress
async function getGroupProgressHandler(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get('groupId');

        const authContext = getAuthContext(request);
        if (authContext?.user.role === 'FACILITATOR') {
            if (groupId) {
                const accessError = enforceGroupAccess(groupId, authContext);
                if (accessError) return accessError;
            } else if (authContext.allowedGroupIds.length === 0) {
                return successResponse([]);
            }
        }

        // Build query filter
                const groupFilter = groupId
                        ? { id: groupId }
                        : authContext?.user.role === 'FACILITATOR'
                            ? { id: { in: authContext.allowedGroupIds } }
                            : { status: { not: 'ARCHIVED' } };

        // Fetch all active groups with their students and assessments
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
                            select: {
                                result: true,
                                assessedDate: true,
                                createdAt: true,
                                updatedAt: true,
                                score: true,
                                unitStandard: {
                                    select: {
                                        id: true,
                                        credits: true,
                                        module: {
                                            select: {
                                                moduleNumber: true,
                                            },
                                        },
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
            let latestAssessmentModule = 0;
            let latestAssessmentAt: Date | null = null;

            for (const student of group.students) {
                // Deduplicate COMPETENT assessments by unit standard for credit counting
                const uniqueUnits = new Map<string, number>();
                for (const assessment of student.assessments) {
                    if (!assessment.unitStandard) continue;

                    // Track the HIGHEST module number that has any marked assessment
                    // This prevents "flickering" if an older assessment is updated/synced
                    const isMarked = Boolean(assessment.assessedDate) || assessment.result != null || assessment.score != null;
                    if (isMarked) {
                        const modNum = assessment.unitStandard.module?.moduleNumber ?? 0;
                        if (modNum > latestAssessmentModule) {
                            latestAssessmentModule = modNum;
                        }
                    }

                    // Credits only from COMPETENT results
                    if (assessment.result === 'COMPETENT') {
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
                currentAssessmentModule: latestAssessmentModule, // 0 = no assessments yet
            };
        });

        return successResponse(progressData);
    } catch (error) {
        return handleApiError(error);
    }
}

export const GET = withAuth(withRateLimit(getGroupProgressHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
