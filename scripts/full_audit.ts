
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const outputFile = 'full_inventory.md';

function log(msg: string) {
    fs.appendFileSync(outputFile, msg + '\n');
    console.log(msg); // Keep console log for debugging if needed
}

async function main() {
    fs.writeFileSync(outputFile, "# Full Site Data Audit\n");
    log(`Date: ${new Date().toISOString()}`);
    log("\n## 1. Database Statistics (Record Counts)");

    const models = [
        'user', 'company', 'group', 'groupRolloutPlan', 'unitStandardRollout', 'student',
        'formativeAssessment', 'formativeCompletion', 'session', 'attendance',
        'attendancePolicy', 'attendanceAlert', 'attendanceReport', 'assessment',
        'moduleProgress', 'unitStandardProgress', 'pOEChecklist', 'pOEFile', 'module',
        'curriculumEmbedding', 'documentChunk', 'unitStandard', 'activity',
        'lessonPlan', 'curriculumDocument', 'groupCourse', 'courseProgress',
        'recurringSessionOverride', 'scheduleTemplate', 'groupSchedule'
    ];

    for (const model of models) {
        try {
            // @ts-ignore
            const count = await prisma[model].count();
            log(`- **${model}**: ${count}`);
        } catch (e) {
            log(`- **${model}**: Error (Table might not exist)`);
        }
    }

    log("\n## 2. File Systems Inventory (src/)");
    const srcDir = path.join(process.cwd(), 'src');

    async function scan(dir: string) {
        const list = fs.readdirSync(dir);
        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                await scan(filePath);
            } else {
                const relPath = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
                log(relPath); // Just the path, markdown list item handled by caller if needed but here just raw paths are good for searching
            }
        }
    }

    if (fs.existsSync(srcDir)) {
        log("\n### Full File List");
        await scan(srcDir);
    } else {
        log("src directory not found!");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
