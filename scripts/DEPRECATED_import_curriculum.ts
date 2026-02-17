
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const GROUP_ID = '96b67110-7153-4d3e-91ba-d03310ccebf5'; // Azelis 26'
const BASE_DOCS_PATH = 'docs/Curriculumn and data process/YEHA Training Material/YEHA Training Material';

// Module DOCX Mapping (Confirmed paths)
const MODULE_FILES = {
    1: '6. Module 1 - Numeracy (Branded)/1. Learner Guides/LAG Numeracy L2- YEHA.docx',
    2: '2. Module 2 - Communication and HIVAIDS (Branded)/2. Communication/1. Learner Guides/Module 2 LG NVC Communication.docx',
    3: '1. Module 3 - Market Requirements (Branded)/1. Learner Guides/LAG Module 3 NVC L2- YEHA.docx',
    4: '4. Module 4 - Business Sector and Industry (Branded)/1. Learner Guides/LAG Module 4 NVC L2- YEHA.docx',
    5: '5. Module 5 - Financial Requirements (Branded)/1. Learner Guides/LAG Module 5 NVC L2- YEHA.docx',
    6: '3. Module 6- Business Operations (Branded)/1. Learner Guides/LAG NVC L2 Module 6- YEHA.docx',
};

// Unit Standard Dictionary (from seed.ts)
const MODULE_US_CODES = {
    1: ['7480', '9008', '9007', '7469', '9009'],
    2: ['8963', '8964', '8962', '8967', '13915'],
    3: ['119673', '119669', '119672', '114974'],
    4: ['119667', '119712', '119671'],
    5: ['119666', '119670', '119674'],
    6: ['119668', '13929', '13932', '13930', '114959', '113924']
};

interface ParsedUnitStandard {
    id: string;
    title: string;
    objectives: { outcome: string; criteria: string[] }[];
    activities: { id: string; title: string; description: string }[];
}

const PARSED_FILE_PATH = path.join(process.cwd(), 'parsed_curriculum.json');

async function extractDocxText(filePath: string): Promise<string> {
    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
        console.warn(`⚠️ File not found: ${absolutePath}`);
        return '';
    }
    const result = await mammoth.extractRawText({ path: absolutePath });
    return result.value;
}

// Reuse logic from lesson-parser.ts but adapted for this seeder
function extractUnitStandardsFromText(text: string, usCodes: string[]): ParsedUnitStandard[] {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsed: ParsedUnitStandard[] = [];

    for (const code of usCodes) {
        let capturing = false;
        const entry: ParsedUnitStandard = {
            id: code,
            title: `Unit Standard ${code}`,
            objectives: [],
            activities: []
        };

        let currentSO: any = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Detect start of this US
            if (line.match(new RegExp(`UNIT STANDARD ${code}`, 'i'))) {
                capturing = true;
                // Find title in next few lines
                let titleLine = lines[i + 1] || '';
                if (titleLine.toLowerCase().includes('title')) titleLine = lines[i + 2] || '';
                entry.title = titleLine.substring(0, 100);
                continue;
            }

            // Detect end of capture (start of next US)
            if (capturing && line.match(/UNIT STANDARD \d+/i) && !line.includes(code)) {
                capturing = false;
                break;
            }

            if (capturing) {
                // Objectives
                if (line.match(/^Specific Outcome \d+/i)) {
                    const outcomeTitle = lines[i + 1] || 'Outcome';
                    currentSO = { outcome: outcomeTitle, criteria: [] };
                    entry.objectives.push(currentSO);
                }
                // Criteria (simple bullet check)
                if (currentSO && (line.startsWith('\u2714') || line.startsWith('\u25CF') || line.startsWith('-'))) {
                    currentSO.criteria.push(line.substring(1).trim());
                }
                // Activities
                const activityMatch = line.match(/Assignment (\d+): (.+)/i) || line.match(/Activity (\d+): (.+)/i);
                if (activityMatch) {
                    entry.activities.push({
                        id: activityMatch[1],
                        title: activityMatch[2].substring(0, 100),
                        description: lines[i + 1]?.substring(0, 200) || ""
                    });
                }
            }
        }

        // Fallback for empty parsing
        if (entry.objectives.length === 0) {
            entry.objectives.push(
                { outcome: `Key Learnings for US ${code}`, criteria: ["Core concepts identified", "Contextual application"] },
                { outcome: "Practical Skills Assessment", criteria: ["Skill demonstrated", "Output verified"] }
            );
        }
        parsed.push(entry);
    }

    return parsed;
}

async function main() {
    console.log('🚀 Starting Curriculum Import (DOCX Version)...');

    // 1. Clear or Load JSON
    const allParsedData: { unitStandards: ParsedUnitStandard[] } = { unitStandards: [] };

    // 2. Process all modules
    for (const [modNumStr, filePath] of Object.entries(MODULE_FILES)) {
        const modNum = parseInt(modNumStr);
        const codes = MODULE_US_CODES[modNum as keyof typeof MODULE_US_CODES];

        console.log(`\n📄 Processing Module ${modNum}...`);
        const text = await extractDocxText(path.join(BASE_DOCS_PATH, filePath));

        if (text) {
            console.log(`   - Extracted ${text.length} characters.`);
            const extractedUS = extractUnitStandardsFromText(text, codes);

            for (const us of extractedUS) {
                allParsedData.unitStandards.push(us);
                console.log(`   - Parsed US ${us.id}: ${us.objectives.length} outcomes`);
            }
        } else {
            console.warn(`   - FAILED to extract text for Module ${modNum}`);
            // Add placeholders
            for (const code of codes) {
                allParsedData.unitStandards.push({
                    id: code,
                    title: `Unit Standard ${code} (Manual Reference Required)`,
                    objectives: [{ outcome: "Refer to manual for outcomes", criteria: [] }],
                    activities: []
                });
            }
        }
    }

    // 3. Save JSON
    fs.writeFileSync(PARSED_FILE_PATH, JSON.stringify(allParsedData, null, 2));
    console.log('\n💾 Updated parsed_curriculum.json');

    // 4. Seed Database (UnitStandardRollouts)
    console.log('\n🌱 Seeding UnitStandardRollout records for Azelis 26\'...');

    const group = await prisma.group.findUnique({
        where: { id: GROUP_ID },
        include: { rolloutPlan: true }
    });

    if (!group || !group.rolloutPlan) {
        console.error('Group or Rollout Plan not found!');
        return;
    }

    const moduleDates = {
        1: { start: group.rolloutPlan.module1StartDate, end: group.rolloutPlan.module1EndDate },
        2: { start: group.rolloutPlan.module2StartDate, end: group.rolloutPlan.module2EndDate },
        3: { start: group.rolloutPlan.module3StartDate, end: group.rolloutPlan.module3EndDate },
        4: { start: group.rolloutPlan.module4StartDate, end: group.rolloutPlan.module4EndDate },
        5: { start: group.rolloutPlan.module5StartDate, end: group.rolloutPlan.module5EndDate },
        6: { start: group.rolloutPlan.module6StartDate, end: group.rolloutPlan.module6EndDate },
    };

    for (const [modNumStr, codes] of Object.entries(MODULE_US_CODES)) {
        const modNum = parseInt(modNumStr);
        const dates = moduleDates[modNum as keyof typeof moduleDates];

        if (!dates.start || !dates.end) continue;

        const totalDays = Math.max(1, (dates.end.getTime() - dates.start.getTime()) / (1000 * 60 * 60 * 24));
        const daysPerUS = Math.max(1, Math.floor(totalDays / codes.length));

        let currentDate = new Date(dates.start);

        for (const code of codes) {
            const us = await prisma.unitStandard.findUnique({ where: { code } });
            if (!us) continue;

            const usEndDate = new Date(currentDate);
            usEndDate.setDate(usEndDate.getDate() + daysPerUS - 1);

            if (usEndDate > dates.end) usEndDate.setTime(dates.end.getTime());

            const summativeDate = new Date(usEndDate);
            const assessingDate = new Date(usEndDate);
            assessingDate.setDate(assessingDate.getDate() + 3);

            await prisma.unitStandardRollout.upsert({
                where: {
                    groupId_unitStandardId: {
                        groupId: GROUP_ID,
                        unitStandardId: us.id
                    }
                },
                create: {
                    groupId: GROUP_ID,
                    unitStandardId: us.id,
                    startDate: currentDate,
                    endDate: usEndDate,
                    summativeDate: summativeDate,
                    assessingDate: assessingDate
                },
                update: {
                    startDate: currentDate,
                    endDate: usEndDate,
                    summativeDate: summativeDate,
                    assessingDate: assessingDate
                }
            });

            currentDate = new Date(usEndDate);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        console.log(`   - Seeded Module ${modNum} (${codes.length} US)`);
    }

    console.log('\n✅ COMPLETE! Refresh the dashboard to see all modules.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
