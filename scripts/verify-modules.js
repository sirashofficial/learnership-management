const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    try {
        const modules = await prisma.module.findMany({
            include: {
                unitStandards: true
            },
            orderBy: {
                moduleNumber: 'asc'
            }
        });

        console.log(`\n✅ Found ${modules.length} modules in database\n`);

        modules.forEach(module => {
            console.log(`Module ${module.moduleNumber}: ${module.name}`);
            console.log(`  Credits: ${module.credits}`);
            console.log(`  Hours: ${module.notionalHours} (${module.classroomHours} classroom + ${module.workplaceHours} workplace)`);
            console.log(`  Unit Standards: ${module.unitStandards.length}`);
            module.unitStandards.forEach(us => {
                console.log(`    - ${us.code}: ${us.title} (${us.credits} credits, ${us.type})`);
            });
            console.log('');
        });

        const totalCredits = modules.reduce((sum, m) => sum + m.credits, 0);
        const totalUnitStandards = modules.reduce((sum, m) => sum + m.unitStandards.length, 0);

        console.log('📊 Summary:');
        console.log(`   Total Modules: ${modules.length}`);
        console.log(`   Total Unit Standards: ${totalUnitStandards}`);
        console.log(`   Total Credits: ${totalCredits}/138`);
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
