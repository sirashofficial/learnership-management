
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const counts = await prisma.groupRolloutPlan.count();
    console.log(`Total Rollout Plans: ${counts}`);

    const plans = await prisma.groupRolloutPlan.findMany({
        include: { group: true }
    });

    plans.forEach(p => {
        console.log(`Group: ${p.group.name}`);
        console.log(`  Module 1: ${p.module1StartDate?.toISOString().split('T')[0]} - ${p.module1EndDate?.toISOString().split('T')[0]}`);
    });
}

main().finally(() => prisma.$disconnect());
