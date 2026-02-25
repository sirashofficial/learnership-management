const { PrismaClient } = require('@prisma/client');
const { updateStudentProgressUnified } = require('./src/lib/progress-calculator');
const prisma = new PrismaClient();

async function run() {
    const s = await prisma.student.findUnique({ where: { studentId: '2025TM877' } });
    if (!s) {
        console.log('Student not found');
        return;
    }

    console.log(`Syncing ${s.firstName} ${s.lastName}...`);
    console.log(`Before: Credits=${s.totalCreditsEarned}, Progress=${s.progress}%`);

    await updateStudentProgressUnified(prisma, s.id);

    const u = await prisma.student.findUnique({ where: { id: s.id } });
    console.log(`After: Credits=${u.totalCreditsEarned}, Progress=${u.progress}%`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
