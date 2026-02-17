
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

const ROLLOUT_DIR = 'docs/Curriculumn and data process/new groups 2026 - roll out plans/new groups 2026 - roll out plans';
const LOG_FILE = 'seed_rollout.log';

// Clear log
fs.writeFileSync(LOG_FILE, '');
const log = (...args: any[]) => {
    fs.appendFileSync(LOG_FILE, args.join(' ') + '\n');
    console.log(...args);
};

// Default rollout structure (Module -> US Codes) for fallback
const DEFAULT_STRUCTURE = [
    { module: 1, codes: ['7480', '9008', '9007', '7469', '9009'], durationMonths: 1 },
    { module: 2, codes: ['13915', '8963', '8964', '8962', '8967'], durationMonths: 1.5 },
    { module: 3, codes: ['119673', '119669', '119672', '114974'], durationMonths: 1.5 },
    { module: 4, codes: ['119667', '119712', '119671'], durationMonths: 1.5 },
    { module: 5, codes: ['119666', '119670', '119674', '119668', '13932'], durationMonths: 2 },
    { module: 6, codes: ['13929', '13932', '13930', '114959', '113924'], durationMonths: 2 },
];

async function main() {
    log('Starting detailed rollout seeding...');

    // 1. Get all Groups
    const groups = await prisma.group.findMany({
        orderBy: { name: 'asc' }
    });
    log(`Found ${groups.length} groups in database.`);

    // 2. Scan Directory for Rollout Plans (Recursive / Subdirs)
    let files: string[] = [];
    try {
        const rootFiles = fs.readdirSync(ROLLOUT_DIR)
            .filter(f => f.endsWith('.docx') && !f.startsWith('~$'))
            .map(f => path.join(ROLLOUT_DIR, f));

        const subDir = path.join(ROLLOUT_DIR, 'Strategic Plan');
        let subFiles: string[] = [];
        if (fs.existsSync(subDir)) {
            subFiles = fs.readdirSync(subDir)
                .filter(f => f.endsWith('.docx') && !f.startsWith('~$'))
                .map(f => path.join(subDir, f));
        }

        files = [...rootFiles, ...subFiles];
        log(`Found ${files.length} rollout plan files.`);
    } catch (e) {
        log(`Error reading directory ${ROLLOUT_DIR}:`, e);
    }

    // 3. Process Each Group
    for (const group of groups) {
        log(`\nProcessing Group: ${group.name}`);

        // Try to find matching file
        // Normalize: "Azelis Group" -> matches "Azelis Group 26_.docx"
        const normalizedGroupName = group.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        const matchingFile = files.find(f => {
            const baseName = path.basename(f);
            const normalizedFile = baseName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return normalizedFile.includes(normalizedGroupName);
        });

        if (matchingFile) {
            log(`  Matched file: ${matchingFile}`);
            await processRolloutFile(group, matchingFile);
        } else {
            log(`  No matching file found. Generating default plan.`);
            // Only generate default if no plan exists? Or overwrite? 
            const existingPlan = await prisma.groupRolloutPlan.findUnique({ where: { groupId: group.id } });
            if (!existingPlan) {
                log(`  Generating default 12-month plan.`);
                await generateDefaultPlan(group);
            } else {
                log(`  Existing plan found (likely manual or from previous run). Checking if it needs update... Skipping default generation.`);
            }
        }
    }

    log('\nSeeding complete.');
}

async function processRolloutFile(group: any, filePath: string) {
    try {
        const buffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);

        const isDate = (s: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(s);
        const isUSCode = (s: string) => /^\d{4,}$/.test(s) || /^\d+\/\d+$/.test(s);

        const extractedRollouts: any[] = [];
        let currentModule = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.toUpperCase().startsWith('MODULE')) {
                currentModule = line;
                continue;
            }

            if (isDate(lines[i])) {
                // Check for block of 4 dates
                if (i + 3 < lines.length && isDate(lines[i + 1]) && isDate(lines[i + 2]) && isDate(lines[i + 3])) {
                    const startDateStr = lines[i];
                    const endDateStr = lines[i + 1];
                    const summativeDateStr = lines[i + 2];
                    const assessingDateStr = lines[i + 3];

                    // Scan ahead for US Code
                    let usCode = '';
                    let consumed = 3;
                    for (let delta = 1; delta <= 8; delta++) {
                        const idx = i + 3 + delta;
                        if (idx >= lines.length) break;
                        const potential = lines[idx];
                        if (isDate(potential)) break;
                        if (isUSCode(potential)) {
                            usCode = potential;
                            consumed += delta;
                            break;
                        }
                    }

                    if (usCode) {
                        extractedRollouts.push({
                            code: usCode,
                            startDate: parseDate(startDateStr),
                            endDate: parseDate(endDateStr),
                            summativeDate: parseDate(summativeDateStr),
                            assessingDate: parseDate(assessingDateStr)
                        });
                        i += consumed;
                    }
                }
            }
        }

        if (extractedRollouts.length > 0) {
            log(`  Extracted ${extractedRollouts.length} rollouts from file.`);

            // Upsert GroupRolloutPlan
            await prisma.groupRolloutPlan.upsert({
                where: { groupId: group.id },
                create: { groupId: group.id, rolloutDocPath: filePath },
                update: { rolloutDocPath: filePath }
            });

            // Upsert UnitStandardRollout
            for (const r of extractedRollouts) {
                // Handle split codes "8963/8964"
                const codes = r.code.split('/').map((c: string) => c.trim());

                for (const code of codes) {
                    const us = await prisma.unitStandard.findUnique({ where: { code } });
                    if (us) {
                        await prisma.unitStandardRollout.upsert({
                            where: {
                                groupId_unitStandardId: {
                                    groupId: group.id,
                                    unitStandardId: us.id
                                }
                            },
                            create: {
                                groupId: group.id,
                                unitStandardId: us.id,
                                startDate: r.startDate,
                                endDate: r.endDate,
                                summativeDate: r.summativeDate,
                                assessingDate: r.assessingDate
                            },
                            update: {
                                startDate: r.startDate,
                                endDate: r.endDate,
                                summativeDate: r.summativeDate,
                                assessingDate: r.assessingDate
                            }
                        });
                    } else {
                        log(`  Warning: US Code ${code} not found in DB.`);
                    }
                }
            }
        } else {
            log(`  Warning: No rollouts extracted from ${filePath}. Structure might differ.`);
            // If extracting failed, maybe generate default?
            // Prompt says: "If a group... has no matching rollout plan file, generate a default"
            // But here we found a file, but failed to parse.
            // Maybe fallback to default?
            // "Generate a default... (to be adjusted later)"
            log(`  Falling back to default plan due to empty extraction.`);
            await generateDefaultPlan(group);
        }

    } catch (e) {
        log(`  Error parsing file ${filePath}:`, e);
    }
}

async function generateDefaultPlan(group: any) {
    const startDate = new Date(group.startDate);
    let currentStart = new Date(startDate);

    // Upsert GroupRolloutPlan
    await prisma.groupRolloutPlan.upsert({
        where: { groupId: group.id },
        create: { groupId: group.id, rolloutDocPath: 'Generated Default' },
        update: { rolloutDocPath: 'Generated Default' }
    });

    for (const mod of DEFAULT_STRUCTURE) {
        // Module duration
        // Distribute codes within module duration
        const moduleDurationDays = mod.durationMonths * 30; // Approx
        const daysPerUS = Math.floor(moduleDurationDays / mod.codes.length);

        for (const code of mod.codes) {
            const us = await prisma.unitStandard.findUnique({ where: { code } });

            const usStart = new Date(currentStart);
            const usEnd = addDays(usStart, daysPerUS - 2);
            const summative = addDays(usEnd, 1);
            const assessing = addDays(summative, 1);

            if (us) {
                await prisma.unitStandardRollout.upsert({
                    where: {
                        groupId_unitStandardId: {
                            groupId: group.id,
                            unitStandardId: us.id
                        }
                    },
                    create: {
                        groupId: group.id,
                        unitStandardId: us.id,
                        startDate: usStart,
                        endDate: usEnd,
                        summativeDate: summative,
                        assessingDate: assessing
                    },
                    update: {
                        startDate: usStart,
                        endDate: usEnd,
                        summativeDate: summative,
                        assessingDate: assessing
                    }
                });
            }

            // Move start pointer
            currentStart = addDays(currentStart, daysPerUS);
        }
    }
}

function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        // DD/MM/YYYY
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return null;
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
