const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const studentIdStr = '2025TM877';
    const s = await prisma.student.findUnique({ where: { studentId: studentIdStr } });
    if (!s) {
        console.log('Student not found');
        return;
    }

    console.log(`Auditing ${s.firstName} ${s.lastName} (${s.studentId}) [DB ID: ${s.id}]`);

    const raw = await prisma.assessment.findMany({
        where: { studentId: s.id },
        include: { unitStandard: true }
    });

    console.log(`Total assessments: ${raw.length}`);

    const uniqueCompetentUnits = new Map();
    raw.forEach(a => {
        if (a.result === 'COMPETENT' && a.unitStandard) {
            uniqueCompetentUnits.set(a.unitStandardId, {
                code: a.unitStandard.code,
                credits: a.unitStandard.credits,
                moduleId: a.unitStandard.moduleId
            });
        }
    });

    console.log('\n--- COMPETENT UNIQUE UNITS ---');
    let totalCredits = 0;
    uniqueCompetentUnits.forEach((data, id) => {
        console.log(`US: ${data.code} | Credits: ${data.credits} | Module: ${data.moduleId ? 'YES' : 'NO'}`);
        totalCredits += (data.credits || 0);
    });

    console.log(`\nCREDITS EARNED (TOTAL): ${totalCredits}`);
    console.log(`PASSED COUNT (TOTAL): ${uniqueCompetentUnits.size}`);

    // Break down by module link
    let moduleCredits = 0;
    let otherCredits = 0;
    uniqueCompetentUnits.forEach(data => {
        if (data.moduleId) moduleCredits += data.credits;
        else otherCredits += data.credits;
    });

    console.log(`\nCredits WITH module: ${moduleCredits}`);
    console.log(`Credits WITHOUT module: ${otherCredits}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
