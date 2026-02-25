const { PrismaClient } = require('@prisma/client');
const { updateStudentProgressUnified } = require('./src/lib/progress-calculator');
const prisma = new PrismaClient();

async function run() {
    console.log('--- STARTING GLOBAL STUDENT PROGRESS SYNC ---');

    // Fetch all students
    const students = await prisma.student.findMany({
        select: { id: true, firstName: true, lastName: true, studentId: true }
    });

    console.log(`Found ${students.length} students to sync.`);

    let successCount = 0;
    let failCount = 0;

    for (const student of students) {
        try {
            process.stdout.write(`Syncing [${student.studentId}] ${student.firstName} ${student.lastName}... `);
            await updateStudentProgressUnified(prisma, student.id);
            console.log('✅');
            successCount++;
        } catch (error) {
            console.log('❌');
            console.error(`Error syncing student ${student.id}:`, error.message);
            failCount++;
        }
    }

    console.log('\n--- SYNC COMPLETE ---');
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
