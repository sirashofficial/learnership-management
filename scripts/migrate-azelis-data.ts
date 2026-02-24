
import prisma from '../src/lib/prisma';

async function migrate() {
    const fromId = 'AZELIS_LP_2025';
    const toId = 'AZELIS_SA_LP_2026';

    console.log(`Starting migration from ${fromId} to ${toId}...`);

    try {
        // 1. Migrate UnitStandardRollouts
        console.log('Migrating UnitStandardRollouts...');
        const rollouts = await prisma.unitStandardRollout.findMany({
            where: { groupId: fromId }
        });

        for (const r of rollouts) {
            // Stripping all possible unwanted fields
            const rData = {
                unitStandardId: r.unitStandardId,
                startDate: r.startDate,
                endDate: r.endDate,
                summativeDate: r.summativeDate,
                assessingDate: r.assessingDate,
                actualStartDate: r.actualStartDate,
                actualEndDate: r.actualEndDate,
                actualSummativeDate: r.actualSummativeDate,
                actualAssessmentDate: r.actualAssessmentDate,
                status: r.status,
                completedPercent: r.completedPercent,
                facilitated: (r as any).facilitated,
                facilitatedAt: (r as any).facilitatedAt,
                facilitatorNotes: (r as any).facilitatorNotes
            };

            try {
                console.log(`Upserting US ${r.unitStandardId} for group ${toId}...`);
                await prisma.unitStandardRollout.upsert({
                    where: {
                        groupId_unitStandardId: {
                            groupId: toId,
                            unitStandardId: r.unitStandardId
                        }
                    },
                    update: rData,
                    create: { ...rData, groupId: toId }
                });
            } catch (e: any) {
                console.error(`Failed US ${r.unitStandardId}:`, e.message);
            }
        }

        // 2. Migrate GroupRolloutPlan
        console.log('Migrating GroupRolloutPlan...');
        const plan = await prisma.groupRolloutPlan.findFirst({
            where: { groupId: fromId }
        });

        if (plan) {
            const { id, groupId, ...planData } = plan;
            await prisma.groupRolloutPlan.upsert({
                where: { groupId: toId },
                update: planData,
                create: { ...planData, groupId: toId }
            });
        }

        console.log('MIGRATION SUCCESSFUL');
    } catch (error) {
        console.error('MIGRATION FAILED:', error);
        process.exit(1);
    }
}

migrate();
