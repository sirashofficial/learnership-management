
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

const prisma = new PrismaClient();
const ROLLOUT_DIR = 'docs/Curriculumn and data process/new groups 2026 - roll out plans/new groups 2026 - roll out plans';

async function main() {
    console.log('Starting Rollout Plan Seeding...');

    if (!fs.existsSync(ROLLOUT_DIR)) {
        console.error(`Directory not found: ${ROLLOUT_DIR}`);
        return;
    }

    const files = fs.readdirSync(ROLLOUT_DIR).filter(f => f.endsWith('.docx'));
    console.log(`Found ${files.length} DOCX files.`);

    const groups = await prisma.group.findMany();
    console.log(`Found ${groups.length} active groups in DB.`);

    for (const file of files) {
        console.log(`\nProcessing: ${file}`);

        // 1. Match Group
        // Simple heuristic: Does filename contain group name?
        // Filenames: "Azelis Group 26_.docx", "City Logistics 26_.docx"
        // Group Names: "Azelis Group 26", "City Logistics 26"
        let matchedGroup = groups.find((g: any) => file.toLowerCase().includes(g.name.toLowerCase()));

        // Fallback for Kelpack
        if (!matchedGroup && file.toLowerCase().includes('kelpack')) {
            matchedGroup = groups.find((g: any) => g.name.toLowerCase().includes('kelpack'));
        }

        if (!matchedGroup) {
            console.warn(`No matching group found for file: ${file}`);
            continue;
        }

        console.log(`Matched Group: ${matchedGroup.name}`);

        // 2. Parse Text
        const buffer = fs.readFileSync(path.join(ROLLOUT_DIR, file));
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value;

        // 3. Extract Module Dates
        // Strategy: Split by "MODULE X", then find dates.
        const planUpdates: any = {};

        for (let i = 1; i <= 6; i++) {
            const currentModuleRegex = new RegExp(`MODULE\\s*${i}`, 'i');
            const nextModuleRegex = new RegExp(`MODULE\\s*${i + 1}`, 'i');

            const startIdx = text.search(currentModuleRegex);
            if (startIdx === -1) {
                console.warn(`Module ${i} header not found.`);
                continue;
            }

            let endIdx = text.search(nextModuleRegex);
            if (endIdx === -1) endIdx = text.length; // Last module goes to end

            const sectionText = text.substring(startIdx, endIdx);

            // Find all dates in DD/MM/YYYY format
            const dateRegex = /(\d{2})\/(\d{2})\/(\d{4})/g;
            const dates: Date[] = [];
            let match;

            while ((match = dateRegex.exec(sectionText)) !== null) {
                const [_, day, month, year] = match;
                dates.push(new Date(`${year}-${month}-${day}`));
            }

            if (dates.length > 0) {
                // simple sort
                dates.sort((a, b) => a.getTime() - b.getTime());

                const startDate = dates[0];
                const endDate = dates[dates.length - 1]; // Latest date found (likely assessing date)

                planUpdates[`module${i}StartDate`] = startDate;
                planUpdates[`module${i}EndDate`] = endDate;

                console.log(`Module ${i}: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
            } else {
                console.warn(`No dates found for Module ${i}`);
            }
        }

        // 4. Update DB
        if (Object.keys(planUpdates).length > 0) {
            await prisma.groupRolloutPlan.upsert({
                where: { groupId: matchedGroup.id },
                create: {
                    groupId: matchedGroup.id,
                    rolloutDocPath: file,
                    ...planUpdates
                },
                update: {
                    rolloutDocPath: file,
                    ...planUpdates
                }
            });
            console.log(`Updated Rollout Plan for ${matchedGroup.name}`);
        }
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
