
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    try {
        const students = await prisma.student.findMany({
            take: 20,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                currentModuleId: true,
                progress: true,
                totalCreditsEarned: true
            }
        });

        console.log('--- STUDENT DATA ---');
        students.forEach(s => {
            console.log(`${s.firstName} ${s.lastName}: ModuleID=${s.currentModuleId}, Progress=${s.progress}%`);
        });

        const competentAssessmentsCount = await prisma.assessment.count({
            where: { result: 'COMPETENT' }
        });
        console.log('--- METRICS ---');
        console.log('Total Competent Assessments:', competentAssessmentsCount);

        const studentsWithModule = students.filter(s => s.currentModuleId !== null).length;
        console.log('Students with currentModuleId set:', studentsWithModule, 'out of', students.length);

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
