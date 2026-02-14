
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const groups = await prisma.group.findMany({
        where: {
            OR: [
                { name: { contains: 'Azelis' } },
                { name: { contains: 'Flint' } },
                { name: { contains: 'Monteagle' } },
                { name: { contains: 'Wahl' } }
            ]
        },
        include: {
            rolloutPlan: true,
            _count: {
                select: { sessions: true }
            }
        }
    });

    console.log('--- Group Data Debug (Filtered) ---');
    for (const group of groups) {
        console.log(`Group: "${group.name}" (ID: ${group.id})`);
        console.log(`  - Sessions: ${group._count.sessions}`);
        console.log(`  - Rollout Plan: ${group.rolloutPlan ? 'YES' : 'NO'}`);
        if (group.rolloutPlan) {
            console.log(`    - ID: ${group.rolloutPlan.id}`);
            console.log(`    - Mod 1 Start: ${group.rolloutPlan.module1StartDate}`);
            console.log(`    - Mod 6 End:   ${group.rolloutPlan.module6EndDate}`);
        }

        // Count special sessions
        const sessions = await prisma.session.findMany({ where: { groupId: group.id } });
        const summativeCount = sessions.filter(s => s.title.includes('Summative')).length;
        const assessingCount = sessions.filter(s => s.title.includes('Assessing')).length;
        const workplaceCount = sessions.filter(s => s.module === 'Workplace Activity').length;

        console.log(`  - Sessions Total: ${sessions.length}`);
        console.log(`    - Summative: ${summativeCount}`);
        console.log(`    - Assessing: ${assessingCount}`);
        console.log(`    - Workplace: ${workplaceCount}`);

        // Check for recent sessions
        const recentSessions = await prisma.session.findMany({
            where: { groupId: group.id },
            orderBy: { date: 'desc' },
            take: 1
        });
        if (recentSessions.length > 0) {
            console.log(`  - Last Session: ${recentSessions[0].date.toISOString()} - ${recentSessions[0].title}`);
        } else {
            console.log(`  - No sessions found.`);
        }
        console.log('-------------------------');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
