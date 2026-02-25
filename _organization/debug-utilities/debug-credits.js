const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { updateStudentProgressUnified } = require('./src/lib/progress-calculator');

async function main() {
    const student = await prisma.student.findUnique({
        where: { studentId: '2025TM877' },
        include: {
            assessments: true
        }
    });

    if (!student) {
        console.log('Student not found');
        return;
    }

    console.log('--- BEFORE RECALCULATION ---');
    console.log('Student:', student.firstName, student.lastName);
    console.log('Total Credits Earned (Stored):', student.totalCreditsEarned);
    console.log('Progress % (Stored):', student.progress);

    console.log('\n--- TRIGGERING UNIFIED UPDATE ---');
    // Simple hack to trigger the logic: we just call the unified update for this student
    await updateStudentProgressUnified(prisma, student.id);

    const updatedStudent = await prisma.student.findUnique({
        where: { id: student.id }
    });

    console.log('--- AFTER RECALCULATION ---');
    console.log('Total Credits Earned (New):', updatedStudent.totalCreditsEarned);
    console.log('Progress % (New):', updatedStudent.progress);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
