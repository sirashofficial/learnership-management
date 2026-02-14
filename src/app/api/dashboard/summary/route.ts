import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
    extractRolloutPlan,
    getTotalCredits,
    getEarnedCredits,
    calculateProjectedVsActual,
    isCurrentlyActive
} from '@/lib/rolloutUtils';
import { calculateRateFromRecords } from '@/lib/attendance-calculator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // 1. Fetch counts
        const totalStudents = await prisma.student.count();
        const totalGroups = await prisma.group.count();

        // 2. Attendance Rate (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                date: {
                    gte: thirtyDaysAgo
                }
            },
            select: { status: true }
        });

        // Use core calculation util to get percentage
        // present='PRESENT' or 'LATE' counts as positive
        const attendanceRate = calculateRateFromRecords(attendanceRecords);

        // 3. Pending Assessments
        // "result is not yet set" implies result is null, or maybe "PENDING"
        const pendingAssessments = await prisma.assessment.count({
            where: {
                OR: [
                    { result: null },
                    { result: 'PENDING' }
                ]
            }
        });

        // 4. Group Analysis
        const groups = await prisma.group.findMany({
            include: {
                students: {
                    select: { id: true }
                },
                unitStandardRollouts: true // Might need this? Or just trust rolloutPlan json
            }
        });

        let activeCourses = 0;
        let groupsFullyComplete = 0;
        const programmeHealth: any[] = [];

        // Pre-fetch all assessments for efficiency?
        // Actually, fetching assessments per group might be better if groups count is low, 
        // OR fetch ALL assessments and partition in JS. 
        // Given we need per-group earned credits based on complex logic (passed formative + summative per US),
        // let's do it per group but optimized.

        // Fetch ALL assessments with basic info to map in memory
        const allAssessments = await prisma.assessment.findMany({
            select: {
                studentId: true,
                unitStandardId: true,
                type: true,
                result: true,
                student: {
                    select: { groupId: true }
                }
            }
        });

        // Map assessments by groupId
        const assessmentsByGroup: Record<string, typeof allAssessments> = {};
        allAssessments.forEach(a => {
            const gid = a.student.groupId;
            if (!assessmentsByGroup[gid]) assessmentsByGroup[gid] = [];
            assessmentsByGroup[gid].push(a);
        });

        const today = new Date();

        for (const group of groups) {
            const plan = extractRolloutPlan(group.notes);
            if (!plan) continue;

            // Active Course Check
            // Check if today is within any unitStandard's start/end date in the plan
            let isActiveToday = false;
            // Iterate plan modules/unit standards
            if (plan.modules) {
                for (const mod of plan.modules) {
                    if (mod.unitStandards) {
                        for (const us of mod.unitStandards) {
                            if (isCurrentlyActive(us.startDate, us.endDate)) {
                                isActiveToday = true;
                                break;
                            }
                        }
                    }
                    if (isActiveToday) break;
                }
            }
            if (isActiveToday) activeCourses++;

            // Calculate Earned Credits & Status
            const totalCredits = getTotalCredits(plan);
            const groupAssessments = assessmentsByGroup[group.id] || [];

            // Logic to determine completed Unit Standards (same as api/groups/[id]/assessment-status)
            const completedIds: string[] = [];
            const studentIds = group.students.map(s => s.id);
            const studentCount = studentIds.length;

            if (plan.modules && studentCount > 0) {
                plan.modules.forEach(mod => {
                    mod.unitStandards?.forEach(us => {
                        const usId = us.id;
                        // Filter assessments for this US
                        const usAssessments = groupAssessments.filter(a => a.unitStandardId === usId);

                        // Check completion: All students must pass formative AND summative
                        let allComplete = true;

                        for (const sid of studentIds) {
                            const sAssessments = usAssessments.filter(a => a.studentId === sid);
                            const passedFormative = sAssessments.some(a =>
                                a.type === 'FORMATIVE' && a.result === 'COMPETENT'
                            );
                            const passedSummative = sAssessments.some(a =>
                                (a.type === 'SUMMATIVE' || a.type === 'INTEGRATED') && a.result === 'COMPETENT'
                            );

                            if (!passedFormative || !passedSummative) {
                                allComplete = false;
                                break;
                            }
                        }

                        if (allComplete) {
                            completedIds.push(usId);
                        }
                    });
                });
            }

            const earnedCredits = getEarnedCredits(plan, completedIds);

            if (totalCredits > 0 && earnedCredits === totalCredits) {
                groupsFullyComplete++;
            }

            // Projected vs Actual
            const metrics = calculateProjectedVsActual(plan, completedIds);

            // Find current module name if applicable
            let currentModuleName = 'N/A';
            if (metrics.actualModule) {
                const mod = plan.modules.find(m => m.moduleNumber === metrics.actualModule);
                currentModuleName = mod?.moduleName || `Module ${metrics.actualModule}`;
            } else if (metrics.projectedModule) {
                const mod = plan.modules.find(m => m.moduleNumber === metrics.projectedModule);
                currentModuleName = mod?.moduleName || `Module ${metrics.projectedModule}`;
            }

            programmeHealth.push({
                groupId: group.id,
                groupName: group.name,
                currentModule: metrics.actualModule || metrics.projectedModule || 1,
                currentModuleName,
                projectedCompletionDate: metrics.projectedDate,
                earnedCredits,
                totalCredits,
                weeksAhead: metrics.weeksAhead,
                status: metrics.status
            });
        }

        const completionRate = totalGroups > 0
            ? Math.round((groupsFullyComplete / totalGroups) * 100)
            : 0;

        return NextResponse.json({
            stats: {
                totalStudents,
                totalGroups,
                attendanceRate,
                activeCourses,
                completionRate,
                pendingAssessments
            },
            programmeHealth
        });

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard stats' },
            { status: 500 }
        );
    }
}
