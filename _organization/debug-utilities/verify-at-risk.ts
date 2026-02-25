
import { PrismaClient } from '@prisma/client';
import { calculateGroupMetrics, calculateMultipleGroupMetrics } from './src/lib/group-metrics';

const prisma = new PrismaClient();

async function verifyMetrics() {
    console.log('--- Verifying Group Metrics Logic ---');

    const groups = await prisma.group.findMany({
        take: 5,
        select: { id: true, name: true }
    });

    if (groups.length === 0) {
        console.log('No groups found to test.');
        return;
    }

    console.log(`Found ${groups.length} groups. Testing individual metrics...`);

    for (const group of groups) {
        const metrics = await calculateGroupMetrics(group.id);
        console.log(`Group: ${group.name}`);
        console.log(` - Student Count: ${metrics.studentCount}`);
        console.log(` - At Risk Count: ${metrics.atRiskCount}`);
        console.log(` - Progress: ${metrics.avgProgressPercent}%`);
    }

    console.log('\nTesting multiple group metrics...');
    const gids = groups.map(g => g.id);
    const multipleMetrics = await calculateMultipleGroupMetrics(gids);

    for (const [gid, metrics] of multipleMetrics.entries()) {
        const group = groups.find(g => g.id === gid);
        console.log(`Group: ${group?.name}`);
        console.log(` - Bulk At Risk Count: ${metrics.atRiskCount}`);
    }

    process.exit(0);
}

verifyMetrics().catch(err => {
    console.error(err);
    process.exit(1);
});
