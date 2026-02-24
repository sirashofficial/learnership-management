import { PrismaClient } from '@prisma/client';
import { calculatePerformanceStatus } from '../src/lib/statusUtils';

const prisma = new PrismaClient();

async function check() {
    const groups = await prisma.group.findMany({
        where: {
            OR: [
                { name: { contains: 'Monteagle' } },
                { name: { contains: 'Wahl' } }
            ]
        },
        include: {
            students: {
                include: {
                    assessments: {
                        include: {
                            unitStandard: {
                                include: {
                                    module: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    for (const g of groups) {
        // Attendance
        const att = await prisma.attendance.findMany({
            where: { groupId: g.id },
            select: { status: true }
        });
        const pres = att.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
        const rate = att.length > 0 ? (pres / att.length) * 100 : 0;

        // Progress
        let maxMod = 0;
        let credits = 0;
        const uniqueUnits = new Set();

        for (const student of g.students) {
            for (const a of student.assessments) {
                if (a.result === 'COMPETENT' && a.unitStandard) {
                    credits += a.unitStandard.credits || 0;
                    uniqueUnits.add(a.unitStandard.id);
                }
                if (a.unitStandard?.module) {
                    maxMod = Math.max(maxMod, a.unitStandard.module.moduleNumber);
                }
            }
        }

        console.log(`\nGroup: ${g.name}`);
        console.log(`- Attendance: ${rate.toFixed(1)}%`);
        console.log(`- Max Module Reached: ${maxMod}`);
        console.log(`- Total Credits Earned: ${credits}`);
        console.log(`- Unique Units Passed: ${uniqueUnits.size}`);
    }
}

check().then(() => process.exit(0));
