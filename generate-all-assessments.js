// Script to generate all required assessments for existing students
// Run with: node generate-all-assessments.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateAssessmentsForAllStudents() {
    try {
        console.log('🚀 Starting assessment generation for all students...\n');

        // Get all students
        const students = await prisma.student.findMany({
            select: {
                id: true,
                studentId: true,
                firstName: true,
                lastName: true
            }
        });

        console.log(`📊 Found ${students.length} students\n`);

        // Get all modules with unit standards
        const modules = await prisma.module.findMany({
            include: {
                unitStandards: true
            },
            orderBy: {
                moduleNumber: 'asc'
            }
        });

        console.log(`📚 Found ${modules.length} modules\n`);

        let totalGenerated = 0;
        let totalSkipped = 0;

        // Process each student
        for (const student of students) {
            console.log(`\n👤 Processing: ${student.firstName} ${student.lastName} (${student.studentId})`);

            // Check existing assessments
            const existingAssessments = await prisma.assessment.findMany({
                where: { studentId: student.id },
                select: { unitStandardId: true }
            });

            const existingUnitStandardIds = new Set(
                existingAssessments.map(a => a.unitStandardId)
            );

            console.log(`   ✓ Already has ${existingAssessments.length} assessments`);

            // Generate missing assessments
            const assessmentsToCreate = [];

            for (const module of modules) {
                for (const unitStandard of module.unitStandards) {
                    if (!existingUnitStandardIds.has(unitStandard.id)) {
                        assessmentsToCreate.push({
                            studentId: student.id,
                            unitStandardId: unitStandard.id,
                            type: 'FORMATIVE',
                            method: 'KNOWLEDGE',
                            result: 'PENDING',
                            dueDate: new Date(),
                            attemptNumber: 1,
                            moderationStatus: 'PENDING'
                        });
                    }
                }
            }

            if (assessmentsToCreate.length > 0) {
                await prisma.assessment.createMany({
                    data: assessmentsToCreate
                });

                console.log(`   ✅ Generated ${assessmentsToCreate.length} new assessments`);
                totalGenerated += assessmentsToCreate.length;
            } else {
                console.log(`   ⏭️  No new assessments needed`);
                totalSkipped++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ GENERATION COMPLETE!');
        console.log('='.repeat(60));
        console.log(`\n📊 Summary:`);
        console.log(`   • Students processed: ${students.length}`);
        console.log(`   • Total assessments generated: ${totalGenerated}`);
        console.log(`   • Students with all assessments: ${totalSkipped}`);
        console.log(`\n🎉 All students now have complete assessment records!\n`);

    } catch (error) {
        console.error('\n❌ Error generating assessments:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
generateAssessmentsForAllStudents()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
