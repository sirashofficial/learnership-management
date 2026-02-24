import { PrismaClient } from '@prisma/client';
import { differenceInDays, isBefore, isAfter, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function checkRollouts() {
    const targetIds = [
        'WAHL_CLIPPERS_LP_2025',
        'MONTEAGLE_LP_2025'
    ];

    const now = startOfDay(new Date());

    for (const id of targetIds) {
        const group = await prisma.group.findUnique({
            where: { id },
            include: {
                unitStandardRollouts: {
                    include: {
                        unitStandard: {
                            include: {
                                module: true
                            }
                        }
                    }
                },
                students: {
                    include: {
                        assessments: true
                    }
                }
            }
        });

        if (!group) {
            console.log(`Group not found: ${id}`);
            continue;
        }

        // Determine expected module and dateStatus
        const sortedRollouts = (group.unitStandardRollouts || []).sort((a, b) => {
            const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
            const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
            return dateA - dateB;
        });

        let expectedModule = 0;
        let dateStatus = 'ON_TRACK';
        const lastRollout = sortedRollouts[sortedRollouts.length - 1];

        if (lastRollout && lastRollout.assessingDate && isBefore(new Date(lastRollout.assessingDate), now)) {
            dateStatus = 'COMPLETE';
        }

        // Find expected module by current date
        for (const rollout of sortedRollouts) {
            if (rollout.startDate && isBefore(new Date(rollout.startDate), now)) {
                expectedModule = Math.max(expectedModule, rollout.unitStandard?.module?.moduleNumber || 0);
            }
        }

        console.log(`\n--- ${group.name} ---`);
        console.log(`ID: ${id}`);
        console.log(`Date Status: ${dateStatus}`);
        console.log(`Expected Module: ${expectedModule}`);
        console.log(`Total Rollouts: ${group.unitStandardRollouts.length}`);
        if (lastRollout) {
            console.log(`Last Assessing Date: ${lastRollout.assessingDate}`);
        }
    }
}

checkRollouts().then(() => process.exit(0));
