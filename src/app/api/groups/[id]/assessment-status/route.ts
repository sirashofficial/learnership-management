import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extractRolloutPlan, getEarnedCredits } from '@/lib/rolloutUtils';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const groupId = params.id;

        // 1. Fetch the group by ID from Prisma, including its students and notes field
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                students: true,
            },
        });

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // 2. Parse the rollout plan from group.notes
        const rolloutPlan = extractRolloutPlan(group.notes);

        if (!rolloutPlan) {
            return NextResponse.json({
                statusMap: {},
                completedIds: [],
                earnedCredits: 0
            });
        }

        // Extract all unit standard IDs from the rollout plan
        const unitStandardIds = new Set<string>();
        if (rolloutPlan.modules) {
            rolloutPlan.modules.forEach((module) => {
                if (module.unitStandards) {
                    module.unitStandards.forEach((us) => {
                        if (us.id) unitStandardIds.add(us.id);
                    });
                }
            });
        }

        const usIds = Array.from(unitStandardIds);
        const studentIds = group.students.map((s: any) => s.id);

        // 3. Fetch all Assessment records where studentId is in the group's student list
        // optimization: also filter by unitStandardId to avoid fetching irrelevant assessments
        const assessments = await prisma.assessment.findMany({
            where: {
                studentId: { in: studentIds },
                unitStandardId: { in: usIds },
            },
            select: {
                id: true,
                studentId: true,
                unitStandardId: true,
                type: true,   // e.g. "FORMATIVE", "SUMMATIVE", "INTEGRATED"
                result: true, // e.g. "COMPETENT", "NOT_YET_COMPETENT", "PENDING"
            },
        });

        // 4. Determine status for each unit standard ID
        const statusMap: Record<string, string> = {};
        const completedIds: string[] = [];

        // Pre-group assessments by unitStandardId for efficiency
        const assessmentsByUs: Record<string, typeof assessments> = {};
        assessments.forEach(a => {
            if (!assessmentsByUs[a.unitStandardId]) {
                assessmentsByUs[a.unitStandardId] = [];
            }
            assessmentsByUs[a.unitStandardId].push(a);
        });

        usIds.forEach((usId) => {
            const usAssessments = assessmentsByUs[usId] || [];

            let status = "not-started";

            if (usAssessments.length === 0) {
                status = "not-started";
            } else {
                // Check for "complete": ALL students passed both formative and summative
                let allStudentsComplete = true;

                // If there are no students in the group, we can't really be "complete" in a meaningful way 
                // usually, but strictly speaking "all students" (0) are complete. 
                // Let's assume there are students.
                if (studentIds.length === 0) {
                    allStudentsComplete = false;
                } else {
                    for (const studentId of studentIds) {
                        const studentAssessments = usAssessments.filter(a => a.studentId === studentId);

                        const passedFormative = studentAssessments.some(a =>
                            a.type === 'FORMATIVE' && a.result === 'COMPETENT'
                        );

                        // Treat INTEGRATED as SUMMATIVE for passing purpose if applicable, 
                        // or just check for SUMMATIVE/INTEGRATED
                        const passedSummative = studentAssessments.some(a =>
                            (a.type === 'SUMMATIVE' || a.type === 'INTEGRATED') && a.result === 'COMPETENT'
                        );

                        if (!passedFormative || !passedSummative) {
                            allStudentsComplete = false;
                            break;
                        }
                    }
                }

                if (allStudentsComplete) {
                    status = "complete";
                } else {
                    // Check for "summative-done": ANY student has a passed summative
                    const anySummativePassed = usAssessments.some(a =>
                        (a.type === 'SUMMATIVE' || a.type === 'INTEGRATED') && a.result === 'COMPETENT'
                    );

                    if (anySummativePassed) {
                        status = "summative-done";
                    } else {
                        // Check for "in-progress": some formative assessments are done
                        // "done" interpreted as having assessments, which we established (length > 0)
                        // But prompt says "if some formative assessments are done but not all students passed"
                        // We know not all students passed (checked above).
                        // Do we need to verify they are Formative?
                        const hasFormative = usAssessments.some(a => a.type === 'FORMATIVE');

                        if (hasFormative) {
                            status = "in-progress";
                        } else {
                            // Assessments exist but maybe only dragged in or something else?
                            // Or maybe they are summative but not passed?
                            // If only summative exists and not passed -> also in-progress conceptually?
                            // Prompt specifically says "some formative assessments are done".
                            // If no formative, fallback to "not-started" or stay "in-progress"?
                            // I will default to "in-progress" if ANY assessment exists but criteria for complete/summative-done not met.
                            status = "in-progress";
                        }
                    }
                }
            }

            statusMap[usId] = status;
            if (status === "complete") {
                completedIds.push(usId);
            }
        });

        const earnedCredits = getEarnedCredits(rolloutPlan, completedIds);

        return NextResponse.json({
            statusMap,
            completedIds,
            earnedCredits
        });

    } catch (error) {
        console.error('Error calculating assessment status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
