import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addWorkingDays } from '@/lib/rolloutUtils';
import { isWeekend, startOfDay, format, addDays } from 'date-fns';
import fs from 'fs';
import path from 'path';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const groupId = params.id;

    try {
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                rolloutPlan: true,
                students: {
                    take: 1,
                    select: { facilitatorId: true }
                }
            },
        });

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        if (!group.rolloutPlan) {
            return NextResponse.json({ error: 'Group has no rollout plan. Generate it first.' }, { status: 400 });
        }

        // For now, we only have LAG data for Module 3
        const moduleId = "module-3-id"; // We need to find the actual ID for Module 3
        const module3 = await prisma.module.findUnique({
            where: { moduleNumber: 3 }
        });

        if (!module3) {
            return NextResponse.json({ error: 'Module 3 not found in database' }, { status: 500 });
        }

        const m3Start = group.rolloutPlan.module3StartDate;
        const m3End = group.rolloutPlan.module3EndDate;

        if (!m3Start || !m3End) {
            return NextResponse.json({ error: 'Module 3 dates not set in rollout plan' }, { status: 400 });
        }

        // Load parsed curriculum data
        const curriculumPath = path.join(process.cwd(), 'parsed_curriculum.json');
        if (!fs.existsSync(curriculumPath)) {
            return NextResponse.json({ error: 'Parsed curriculum data not found' }, { status: 500 });
        }
        const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));

        // Fetch granular US rollout dates for this group
        const usRollouts = await prisma.unitStandardRollout.findMany({
            where: { groupId },
            include: { unitStandard: true }
        });

        // Clear existing lessons for this group and module
        await prisma.lessonPlan.deleteMany({
            where: {
                groupId,
                moduleId: module3.id
            }
        });

        const defaultUser = await prisma.user.findFirst({
            where: { role: { in: ['ADMIN', 'FACILITATOR'] } }
        });
        const fallbackFacilitatorId = defaultUser?.id || "3cf527c2-c02a-4350-a178-33e8a5b3a03a";

        // Flatten all objectives for fallback
        const allObjectivesFallback = curriculum.unitStandards.flatMap((us: any) =>
            us.objectives.map((obj: any) => ({
                usId: us.id,
                usTitle: us.title,
                outcome: obj.outcome,
                criteria: obj.criteria
            }))
        );

        const allActivitiesFallback = curriculum.unitStandards.flatMap((us: any) => us.activities);

        // If we have granular dates, use them. Otherwise, use simpler distribution.
        if (usRollouts.length > 0) {
            for (const rollout of usRollouts) {
                if (!rollout.startDate || !rollout.endDate) continue;

                const usData = curriculum.unitStandards.find((u: any) => u.id === rollout.unitStandard.code);
                if (!usData) continue;

                let currentDay = new Date(rollout.startDate);
                const endDate = new Date(rollout.endDate);
                let objIdx = 0;

                // Generate content lessons
                while (currentDay <= endDate) {
                    if (!isWeekend(currentDay)) {
                        const dailyObjective = usData.objectives[objIdx % usData.objectives.length];
                        const dailyActivity = usData.activities[objIdx % usData.activities.length];

                        await prisma.lessonPlan.create({
                            data: {
                                title: `US ${rollout.unitStandard.code}: ${dailyObjective.outcome.substring(0, 50)}`,
                                description: `Teaching day for Unit Standard: ${usData.title}`,
                                date: new Date(currentDay),
                                startTime: "09:00",
                                endTime: "14:00",
                                venue: group.location || "Training Room A",
                                objectives: JSON.stringify([dailyObjective.outcome, ...dailyObjective.criteria]),
                                activities: JSON.stringify(dailyActivity ? [dailyActivity.title, dailyActivity.description] : []),
                                materials: JSON.stringify(["Learner Guide Module 3", "Handouts"]),
                                aiGenerated: true,
                                moduleId: module3.id,
                                facilitatorId: group.students[0]?.facilitatorId || fallbackFacilitatorId,
                                groupId: groupId,
                            }
                        });
                        objIdx++;
                    }
                    currentDay = addDays(currentDay, 1);
                }

                // Generate Summative lesson
                if (rollout.summativeDate) {
                    await prisma.lessonPlan.create({
                        data: {
                            title: `SUMMATIVE ASSESSMENT: US ${rollout.unitStandard.code}`,
                            description: `Official Summative Assessment day for ${usData.title}`,
                            date: new Date(rollout.summativeDate),
                            startTime: "09:00",
                            endTime: "13:00",
                            venue: group.location || "Exam Room",
                            objectives: JSON.stringify(["Completion of Summative Assessment"]),
                            activities: JSON.stringify(["Summative Test", "PoE Evidence Gathering"]),
                            materials: JSON.stringify(["Summative Assessment Paper", "Pens"]),
                            aiGenerated: true,
                            moduleId: module3.id,
                            facilitatorId: group.students[0]?.facilitatorId || fallbackFacilitatorId,
                            groupId: groupId,
                        }
                    });
                }
            }
        } else {
            // Fallback to simple distribution if no granular dates set
            let currentDay = new Date(m3Start);
            const endDate = new Date(m3End);
            let objectiveIndex = 0;
            let activityIndex = 0;

            while (currentDay <= endDate) {
                if (!isWeekend(currentDay)) {
                    const dailyObjective = allObjectivesFallback[objectiveIndex % allObjectivesFallback.length];
                    const dailyActivity = allActivitiesFallback[activityIndex % allActivitiesFallback.length];

                    await prisma.lessonPlan.create({
                        data: {
                            title: `Module 3: ${dailyObjective.outcome.substring(0, 50)}...`,
                            description: `Focus on Unit Standard: ${dailyObjective.usTitle}`,
                            date: new Date(currentDay),
                            startTime: "09:00",
                            endTime: "14:00",
                            venue: group.location || "Training Room A",
                            objectives: JSON.stringify([dailyObjective.outcome, ...dailyObjective.criteria]),
                            activities: JSON.stringify(dailyActivity ? [dailyActivity.title, dailyActivity.description] : []),
                            materials: JSON.stringify(["Learner Guide Module 3", "Handouts"]),
                            aiGenerated: true,
                            moduleId: module3.id,
                            facilitatorId: group.students[0]?.facilitatorId || fallbackFacilitatorId,
                            groupId: groupId,
                        }
                    });
                    objectiveIndex++;
                    activityIndex++;
                }
                currentDay = addDays(currentDay, 1);
            }
        }

        const finalCount = await prisma.lessonPlan.count({
            where: { groupId, moduleId: module3.id }
        });

        return NextResponse.json({
            message: `Successfully generated ${finalCount} lessons for Module 3`,
            count: finalCount
        });

    } catch (error: any) {
        console.error('Error generating lessons:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
