import { PrismaClient } from '@prisma/client';
import { updateStudentProgressUnified } from './src/lib/progress-calculator';

const prisma = new PrismaClient();

async function run() {
    console.log('--- STARTING GLOBAL SYNC ---');
    const students = await prisma.student.findMany();
    console.log(`Syncing ${students.length} students...`);

    for (const student of students) {
        try {
            await updateStudentProgressUnified(prisma, student.id);
            process.stdout.write('.');
        } catch (e) {
            console.error(`\nError syncing ${student.id}:`, e);
        }
    }
    console.log('\n--- SYNC DONE ---');
}

run().catch(console.error).finally(() => prisma.$disconnect());
