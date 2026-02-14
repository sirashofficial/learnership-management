
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { PrismaClient } from '@prisma/client';
import { addDays, parse, isWeekend, format, addHours, setHours, setMinutes } from 'date-fns';

const prisma = new PrismaClient();
const ROLLOUT_DIR = path.join(process.cwd(), 'Roll Out');

// Manual mapping for specific files to group names (partial or full match)
const MANUAL_MAPPINGS: Record<string, string> = {
    'Monteagle_Group_2026_Rollout_Plan.md': "Monteagle 25'",
    'Azelis_2025_Rollout_Plan.md': "Azelis (2025)",
    'Flint_Group_2025_Rollout_Plan.md': "Flint Group (2025)",
    'Packaging_World_2025_Rollout_Plan.md': "Packaging World (2025)",
    'Wahl_Clippers_2025_Rollout_Plan.md': "Wahl Clippers (2025)",
    'City_Logistics_2026_Rollout_Plan.md': "City Logistics (2026)",
    'Guala_Closures_2025_Rollout_Plan.md': "Guala Closures (2025)",
    'Safripol_2025_Rollout_Plan.md': "Safripol (2025)"
};

async function main() {
    console.log('Starting rollout schedule ingestion...');

    if (!fs.existsSync(ROLLOUT_DIR)) {
        console.error(`Roll Out directory not found at: ${ROLLOUT_DIR}`);
        return;
    }

    const files = fs.readdirSync(ROLLOUT_DIR).filter(f => f.endsWith('.md') || f.endsWith('.docx'));
    console.log(`Found ${files.length} rollout files.`);

    for (const file of files) {
        await processRolloutFile(path.join(ROLLOUT_DIR, file));
    }

    console.log('Ingestion complete.');
}

async function processRolloutFile(filePath: string) {
    const filename = path.basename(filePath);
    console.log(`\nProcessing: ${filename}`);

    let group = null;

    // Check manual mapping first
    if (MANUAL_MAPPINGS[filename]) {
        const targetName = MANUAL_MAPPINGS[filename];
        console.log(`  Manual mapping: "${targetName}"`);
        group = await prisma.group.findFirst({
            where: { name: targetName }
        });

        if (!group) {
            group = await prisma.group.findFirst({
                where: { name: { contains: targetName } }
            });
        }
    }

    if (!group) {
        console.warn(`  WARNING: No group matched for "${filename}". Skipping.`);
        return;
    }

    console.log(`  Matched Group: ${group.name} (${group.id})`);

    let text = '';
    if (filePath.endsWith('.md')) {
        text = fs.readFileSync(filePath, 'utf-8');
    } else if (filePath.endsWith('.docx')) {
        const buffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
    }

    // Parse logic
    const lines = text.split('\n');
    let currentModule = '';
    let currentUS = '';

    const dateRegex = /\*\*(Start|End) Date:\*\* (\d{2}\/\d{2}\/\d{4})/;
    const usRegex = /### Unit Standard (\d+)/;
    const moduleRegex = /## MODULE (\d+)/i;

    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let recordsCreated = 0;

    console.log(`  Clearing existing sessions for group...`);
    await prisma.session.deleteMany({ where: { groupId: group.id } });

    for (const line of lines) {
        const modMatch = line.match(moduleRegex);
        if (modMatch) {
            currentModule = `Module ${modMatch[1]}`;
            continue;
        }

        const usMatch = line.match(usRegex);
        if (usMatch) {
            currentUS = usMatch[1];
            startDate = null;
            endDate = null;
            continue;
        }

        const dateMatch = line.match(dateRegex);
        if (dateMatch) {
            const type = dateMatch[1];
            const dateStr = dateMatch[2];
            const date = parse(dateStr, 'dd/MM/yyyy', new Date());

            if (type === 'Start') startDate = date;
            if (type === 'End') endDate = date;

            if (startDate && endDate) {
                // Pass 'system' as placeholder
                await generateSessionsForRange(group.id, 'system', startDate, endDate, currentModule, currentUS);

                recordsCreated += 1;
                if (type === 'End') {
                    startDate = null;
                    endDate = null;
                }
            }
        }

        // Summative/Assessing Dates
        const summativeMatch = line.match(/\*\*Summative Date:\*\* (\d{2}\/\d{2}\/\d{4})/);
        if (summativeMatch) {
            const date = parse(summativeMatch[1], 'dd/MM/yyyy', new Date());
            await createSingleSession(group.id, date, currentModule, `Summative Assessment - US ${currentUS}`, "Summative Assessment");
        }

        const assessingMatch = line.match(/\*\*Assessing Date:\*\* (\d{2}\/\d{2}\/\d{4})/);
        if (assessingMatch) {
            const date = parse(assessingMatch[1], 'dd/MM/yyyy', new Date());
            await createSingleSession(group.id, date, currentModule, `Assessing - US ${currentUS}`, "Assessing");
        }

        // Workplace Activity
        const wpMatch = line.match(/\*\*Workplace Activity:\*\* (\d{2}\/\d{2}\/\d{4}) . (\d{2}\/\d{2}\/\d{4})/);
        if (wpMatch) {
            const startStr = wpMatch[1];
            const endStr = wpMatch[2];
            const start = parse(startStr, 'dd/MM/yyyy', new Date());
            let end = parse(endStr, 'dd/MM/yyyy', new Date());

            if (startStr === '26/01/2026' && endStr === '06/01/2026') {
                console.log('  Correcting known date typo: 06/01/2026 -> 06/02/2026');
                end = parse('06/02/2026', 'dd/MM/yyyy', new Date());
            }

            await generateSessionsForRange(group.id, 'system', start, end, currentModule, 'Workplace Activity');
        }
    }

    console.log(`  Generated sessions for ${recordsCreated} unit standard ranges.`);

    // Upsert GroupRolloutPlan
    const modulesFound = await prisma.session.groupBy({
        by: ['module'],
        where: { groupId: group.id },
        _min: { date: true },
        _max: { date: true }
    });

    const updateData: any = {
        rolloutDocPath: filePath
    };

    modulesFound.forEach(m => {
        const match = m.module.match(/Module (\d+)/i);
        if (match && m._min.date && m._max.date) {
            const num = match[1];
            const minDate = m._min.date;
            const maxDate = m._max.date;

            if (minDate && maxDate) {
                updateData[`module${num}StartDate`] = minDate;
                updateData[`module${num}EndDate`] = maxDate;
            }
        }
    });

    if (Object.keys(updateData).length > 1) {
        console.log(`  Updating Rollout Plan dates for ${group.name}...`);
        await prisma.groupRolloutPlan.upsert({
            where: { groupId: group.id },
            create: { groupId: group.id, ...updateData },
            update: updateData
        });
    }
}

async function generateSessionsForRange(groupId: string, facilitatorId: string, start: Date, end: Date, moduleName: string, usCode: string) {
    let curr = new Date(start);
    if (end < start) return;

    let activeFacilitatorId = facilitatorId;
    if (activeFacilitatorId === 'system' || !activeFacilitatorId) {
        // Find first facilitator or admin
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ role: 'FACILITATOR' }, { role: 'ADMIN' }]
            }
        });
        if (user) activeFacilitatorId = user.id;
        else {
            const anyUser = await prisma.user.findFirst();
            if (anyUser) activeFacilitatorId = anyUser.id;
        }
    }

    // Fallback if NO user exists at all (unlikely but safe)
    if (!activeFacilitatorId) return;

    while (curr <= end) {
        if (!isWeekend(curr)) {
            const startTimeStr = "08:00";
            const endTimeStr = "15:00";
            const sessionDate = new Date(curr);

            await prisma.session.create({
                data: {
                    title: `${moduleName} - US ${usCode}`,
                    module: moduleName,
                    date: sessionDate,
                    startTime: startTimeStr,
                    endTime: endTimeStr,
                    groupId: groupId,
                    facilitatorId: activeFacilitatorId,
                    notes: `Generated from Rollout Plan`
                }
            });
        }
        curr = addDays(curr, 1);
    }
}

async function createSingleSession(groupId: string, date: Date, moduleName: string, title: string, notes: string) {
    if (isWeekend(date)) return; // Skip weekends? Or are assessments allowed? Assuming skip for now.

    const startTimeStr = "08:00";
    const endTimeStr = "15:00";

    // Find facilitator (reuse logic or pass it? checking newly)
    let activeFacilitatorId = 'system';
    const user = await prisma.user.findFirst({ where: { OR: [{ role: 'FACILITATOR' }, { role: 'ADMIN' }] } });
    if (user) activeFacilitatorId = user.id;

    await prisma.session.create({
        data: {
            title: title,
            module: moduleName,
            date: date,
            startTime: startTimeStr,
            endTime: endTimeStr,
            groupId: groupId,
            facilitatorId: activeFacilitatorId,
            notes: notes
        }
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
