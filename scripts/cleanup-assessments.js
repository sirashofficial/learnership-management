const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupAssessments() {
    console.log('🧹 Cleaning up unlinked assessments...\n');

    // Delete all assessments without unitStandardId
    const result = await prisma.assessment.deleteMany({
        where: {
            unitStandardId: null
        }
    });

    console.log(`✅ Deleted ${result.count} unlinked assessments\n`);
    console.log('These were test/demo assessments that need to be recreated');
    console.log('with proper unit standard links after the migration.\n');

    await prisma.$disconnect();
}

cleanupAssessments();
