import { PrismaClient } from '@prisma/client';
import { calculatePerformanceStatus } from '../src/lib/statusUtils';

const prisma = new PrismaClient();

const fs = require('fs');
const logFile = 'group_diagnostics.log';
fs.writeFileSync(logFile, '🔍 Diagnosing Status Discrepancy: Monteagle vs Wahl\n\n');

async function diagnose() {
    try {
        const groupNames = ['Monteagle', 'Wahl'];
        const groups = await prisma.group.findMany({
            where: {
                OR: groupNames.map(name => ({ name: { contains: name } }))
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

        for (const group of groups) {
            // 1. Attendance
            const attendanceData = await prisma.attendance.findMany({
                where: { groupId: group.id },
                select: { status: true }
            });
            const presentCount = attendanceData.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
            const attendanceRate = attendanceData.length > 0 ? (presentCount / attendanceData.length) * 100 : 0;

            // 2. Progress
            let latestAssessmentModule = 0;
            let totalCreditsEarned = 0;
            const totalStudents = group.students.length;

            for (const student of group.students) {
                const uniqueUnits = new Map<string, number>();
                for (const assessment of student.assessments) {
                    if (!assessment.unitStandard) continue;
                    const isMarked = assessment.assessedDate != null || assessment.result != null || assessment.score != null;
                    if (isMarked) {
                        const modNum = assessment.unitStandard.module?.moduleNumber ?? 0;
                        if (modNum > latestAssessmentModule) latestAssessmentModule = modNum;
                    }
                    if (assessment.result === 'COMPETENT') {
                        uniqueUnits.set(assessment.unitStandard.id, assessment.unitStandard.credits || 0);
                    }
                }
                totalCreditsEarned += Array.from(uniqueUnits.values()).reduce((sum, c) => sum + c, 0);
            }

            const avgCredits = totalStudents > 0 ? totalCreditsEarned / totalStudents : 0;
            const avgPercent = Math.round((avgCredits / 140) * 100);

            // 3. Status Calculation
            // Note: We don't have the expectedModule here without parsing the plan, 
            // but we can see the raw numbers first.

            const statusIfExpected1 = calculatePerformanceStatus(0, avgPercent, true, attendanceRate, latestAssessmentModule, 1, 'ON_TRACK');

            let output = `--------------------------------------------------\n`;
            output += `Group: ${group.name}\n`;
            output += `  - Students:   ${totalStudents}\n`;
            output += `  - Attendance: ${attendanceRate.toFixed(1)}%\n`;
            output += `  - Progress:   ${avgPercent}% (${avgCredits.toFixed(1)} credits)\n`;
            output += `  - Max Module: ${latestAssessmentModule}\n`;
            output += `  - Status (if Expected Mod 1): ${statusIfExpected1}\n`;

            fs.appendFileSync(logFile, output);
        }

        fs.appendFileSync(logFile, '\n✅ Diagnosis complete.\n');
        console.log(`Results saved to ${logFile}`);

    } catch (err) {
        fs.appendFileSync(logFile, `❌ Diagnosis failed: ${err}\n`);
        console.error('❌ Diagnosis failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
