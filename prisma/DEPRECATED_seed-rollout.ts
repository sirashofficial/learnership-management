
import { PrismaClient } from '@prisma/client';
import { addMonths, startOfMonth } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Group Rollout Plan seed...');

    // 1. Get all active groups
    const groups = await prisma.group.findMany({
        where: { status: 'ACTIVE' }
    });

    if (groups.length === 0) {
        console.log('No active groups found. Skipping rollout seed.');
        return;
    }

    console.log(`Found ${groups.length} active groups. Creating rollout plans...`);

    for (const group of groups) {
        // Check if plan already exists
        const existingPlan = await prisma.groupRolloutPlan.findUnique({
            where: { groupId: group.id }
        });

        if (existingPlan) {
            console.log(`Rollout plan already exists for group: ${group.name}`);
            continue;
        }

        // Logic to generate dates based on group start date
        // Assuming 1 month per module for simplicity, or spreading over the total duration
        const startDate = new Date(group.startDate);

        // Create sensible default deadlines (1 month per module approximately)
        const m1Start = startDate;
        const m1End = addMonths(m1Start, 1);

        const m2Start = m1End;
        const m2End = addMonths(m2Start, 1);

        const m3Start = m2End;
        const m3End = addMonths(m3Start, 1);

        const m4Start = m3End;
        const m4End = addMonths(m4Start, 1);

        const m5Start = m4End;
        const m5End = addMonths(m5Start, 1);

        const m6Start = m5End;
        const m6End = addMonths(m6Start, 1);

        await prisma.groupRolloutPlan.create({
            data: {
                groupId: group.id,
                // Module 1
                module1StartDate: m1Start,
                module1EndDate: m1End,
                // Module 2
                module2StartDate: m2Start,
                module2EndDate: m2End,
                // Module 3
                module3StartDate: m3Start,
                module3EndDate: m3End,
                // Module 4
                module4StartDate: m4Start,
                module4EndDate: m4End,
                // Module 5
                module5StartDate: m5Start,
                module5EndDate: m5End,
                // Module 6
                module6StartDate: m6Start,
                module6EndDate: m6End,

                rolloutDocPath: 'docs/Curriculumn and data process/Roll out Plans/Generic_Rollout.pdf'
            }
        });

        console.log(`Created rollout plan for group: ${group.name}`);
    }

    console.log('🏁 Group Rollout Plan seed completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
