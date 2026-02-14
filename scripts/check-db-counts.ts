
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const modules = await prisma.module.count();
    const unitStandards = await prisma.unitStandard.count();
    const groups = await prisma.group.count();
    const groupRolloutPlans = await prisma.groupRolloutPlan.count();
    const unitStandardRollouts = await prisma.unitStandardRollout.count();

    console.log(`Modules: ${modules}`);
    console.log(`Unit Standards: ${unitStandards}`);
    console.log(`Groups: ${groups}`);
    console.log(`Group Rollout Plans: ${groupRolloutPlans}`);
    console.log(`Unit Standard Rollouts: ${unitStandardRollouts}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
