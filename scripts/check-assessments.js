const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssessments() {
    const assessments = await prisma.assessment.findMany({
        select: {
            id: true,
            unitStandard: true,
            module: true,
            unitStandardId: true,
            student: {
                select: {
                    firstName: true,
                    lastName: true
                }
            }
        }
    });

    console.log('\n📋 Current Assessments:\n');
    assessments.forEach((a, i) => {
        console.log(`${i + 1}. Assessment ID: ${a.id}`);
        console.log(`   Student: ${a.student.firstName} ${a.student.lastName}`);
        console.log(`   Unit Standard (string): ${a.unitStandard || 'NULL'}`);
        console.log(`   Module (string): ${a.module || 'NULL'}`);
        console.log(`   Unit Standard ID (FK): ${a.unitStandardId || 'NULL'}`);
        console.log('');
    });

    await prisma.$disconnect();
}

checkAssessments();
