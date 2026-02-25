
const { PrismaClient } = require('@prisma/client');
const { recalculateAllProgress } = require('./src/lib/progress-calculator');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('--- BACKFILLING currentModuleId FOR ALL STUDENTS ---');

    const students = await prisma.student.findMany({
        select: { id: true, firstName: true, lastName: true }
    });

    console.log(`Found ${students.length} students to process.`);

    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        process.stdout.write(`[${i + 1}/${students.length}] Recalculating ${student.firstName} ${student.lastName}... `);
        try {
            await recalculateAllProgress(student.id);
            process.stdout.write('DONE\n');
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            process.stdout.write(`FAILED: ${message}\n`);
        }
    }

    console.log('--- BACKFILL COMPLETE ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
