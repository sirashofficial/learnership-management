const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Verification Start ---');
    try {
        // 1. Check if we can create a FacilitatorTask
        console.log('1. Checking FacilitatorTask model...');
        const task = await prisma.facilitatorTask.create({
            data: {
                title: 'Verification Test Task',
                description: 'Testing if schema is active',
                dueDate: new Date(),
                groupId: 'AZELIS_LP_2025',
                status: 'PENDING'
            }
        });
        console.log('✅ Successfully created FacilitatorTask:', task.id);

        // 2. Check if we can update UnitStandardRollout with 'facilitated' field
        console.log('2. Checking UnitStandardRollout fields...');
        const rollout = await prisma.unitStandardRollout.findFirst({
            where: { groupId: 'AZELIS_LP_2025' }
        });

        if (rollout) {
            const updated = await prisma.unitStandardRollout.update({
                where: { id: rollout.id },
                data: {
                    facilitated: true,
                    facilitatedAt: new Date(),
                    facilitatorNotes: 'Schema verification note'
                }
            });
            console.log('✅ Successfully updated UnitStandardRollout:', updated.id);
            console.log('   Facilitated field value:', updated.facilitated);
        } else {
            console.log('⚠️ No rollout found for AZELIS_LP_2025 to test.');
        }

        // 3. Clean up the test task
        console.log('3. Cleaning up...');
        await prisma.facilitatorTask.delete({ where: { id: task.id } });
        console.log('✅ Test task deleted.');

    } catch (error) {
        console.error('❌ DATABASE ERROR:', error.message);
        if (error.code === 'P2002') console.log('   (Unique constraint violation)');
        if (error.code === 'P2003') console.log('   (Foreign key constraint violation - check groupId)');
    } finally {
        await prisma.$disconnect();
        console.log('--- Database Verification End ---');
    }
}

main();
