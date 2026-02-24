import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const targetIds = [
        'WAHL_CLIPPERS_LP_2025',
        'MONTEAGLE_LP_2025',
        'MONTEAGLE_LP_2026'
    ];

    const groups = await prisma.group.findMany({
        where: { id: { in: targetIds } },
        select: { id: true, name: true }
    });

    console.log('--- Group Data Check ---');
    for (const group of groups) {
        const students = await prisma.student.findMany({
            where: { groupId: group.id },
            select: { id: true }
        });

        const studentIds = students.map(s => s.id);

        const attendanceRecords = await prisma.attendance.findMany({
            where: { groupId: group.id },
            select: { studentId: true, status: true }
        });

        const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
        const rate = attendanceRecords.length > 0 ? (presentCount / attendanceRecords.length) * 100 : 0;

        const assessments = await prisma.formativeAssessment.findMany({
            where: { studentId: { in: studentIds } },
            select: { result: true }
        });

        console.log(`ID: ${group.id}`);
        console.log(`Name: ${group.name}`);
        console.log(`Students: ${students.length}`);
        console.log(`Attendance Records: ${attendanceRecords.length}`);
        console.log(`Attendance Rate: ${rate.toFixed(1)}%`);
        console.log(`Assessments Found: ${assessments.length}`);
        console.log(`Assessments COMPETENT: ${assessments.filter(a => a.result === 'COMPETENT').length}`);
        console.log('------------------------');
    }
}

check().then(() => process.exit(0));
