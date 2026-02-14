import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { generateRolloutPlan } from '../src/lib/rolloutPlanGenerator';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const prisma = new PrismaClient();

const ROLLOUT_DIR = path.join(__dirname, '..', 'Roll Out');

const MAPPINGS: Array<{ file: string; groupName: string; skip?: boolean }> = [
  { file: 'Azelis_2025_Rollout_Plan.md', groupName: "Azelis 25'" },
  { file: 'Azelis_2026_Rollout_Plan.md', groupName: "Azelis 26'", skip: true },
  { file: 'Beyond_Insights_2026_Rollout_Plan.md', groupName: "Beyond Insights 26'" },
  { file: 'City_Logistics_2026_Rollout_Plan.md', groupName: "City Logistics 26'" },
  { file: 'Kelpack_2025_Rollout_Plan.md', groupName: 'Kelpack' },
  { file: 'Monteagle_2025_Rollout_Plan.md', groupName: "Monteagle 25'" },
  { file: 'Monteagle_Group_2026_Rollout_Plan.md', groupName: "Monteagle 26'" },
  { file: 'Packaging_World_2026_Rollout_Plan.md', groupName: "Packaging World 25'" }
];

function extractProgrammeValue(content: string, label: string): string | null {
  const pattern = new RegExp(`^\\s*\\*\\*${label}:\\*\\*\\s*(.+)$`, 'im');
  const match = content.match(pattern);
  if (!match) {
    return null;
  }
  const raw = match[1].replace(/[*_]/g, ' ').trim();
  return raw || null;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const raw = value.trim();
  const dmY = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmY) {
    const day = Number(dmY[1]);
    const month = Number(dmY[2]);
    const year = Number(dmY[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatPlanDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function buildModuleDates(plan: any) {
  const rolloutData: Record<string, Date | null> = {};

  plan.modules.forEach((module: any) => {
    const first = module.unitStandards[0];
    const last = module.unitStandards[module.unitStandards.length - 1];
    rolloutData[`module${module.moduleNumber}StartDate`] = parseDate(first.startDate);
    rolloutData[`module${module.moduleNumber}EndDate`] = parseDate(last.endDate);
  });

  return rolloutData;
}

function buildNotesPayload(notes: string | null | undefined, plan: any) {
  if (!notes) {
    return JSON.stringify({ rolloutPlan: plan });
  }

  try {
    const parsed = JSON.parse(notes);
    return JSON.stringify({ ...parsed, rolloutPlan: plan });
  } catch {
    return JSON.stringify({ notesText: notes, rolloutPlan: plan });
  }
}

async function readPlanFile(filePath: string) {
  const content = await fs.readFile(filePath, 'utf8');
  const startDateRaw = extractProgrammeValue(content, 'START DATE');
  const endDateRaw = extractProgrammeValue(content, 'END DATE');
  const learnersRaw = extractProgrammeValue(content, 'LEARNERS');

  const startDateParsed = parseDate(startDateRaw);
  const endDateParsed = parseDate(endDateRaw);
  const learners = learnersRaw ? Number(String(learnersRaw).replace(/[^\d]/g, '')) : NaN;

  return {
    startDateRaw,
    endDateRaw,
    startDateParsed,
    endDateParsed,
    learnersRaw,
    learners,
  };
}

async function main() {
  let processedCount = 0;
  let successCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;
  let failedCount = 0;

  const groups = await prisma.group.findMany({
    select: {
      id: true,
      name: true,
      notes: true,
      _count: { select: { students: true } },
    },
  });

  const groupMap = new Map(groups.map((group) => [group.name.toLowerCase(), group]));

  for (const mapping of MAPPINGS) {
    if (mapping.skip) {
      console.log(`⏭️  ${mapping.groupName} — already done, skipping`);
      skippedCount += 1;
      continue;
    }

    processedCount += 1;
    const filePath = path.join(ROLLOUT_DIR, mapping.file);

    try {
      const { startDateParsed, endDateParsed, learnersRaw, learners } = await readPlanFile(filePath);

      if (!startDateParsed || !endDateParsed) {
        console.log(`❌ ${mapping.file} — invalid START DATE / END DATE, skipping`);
        failedCount += 1;
        continue;
      }

      const group = groupMap.get(mapping.groupName.toLowerCase());

      if (!group) {
        console.log(`❌ ${mapping.file} — group not found in DB, skipping`);
        notFoundCount += 1;
        continue;
      }

      let learnersCount = learners;
      if (Number.isNaN(learnersCount)) {
        learnersCount = group._count?.students ?? 0;
        const learnersNote = learnersRaw ? 'invalid' : 'missing';
        console.log(`⚠️  ${mapping.file} — LEARNERS ${learnersNote}, using group count (${learnersCount})`);
      }

      const planStart = formatPlanDate(startDateParsed);
      const planEnd = formatPlanDate(endDateParsed);
      const plan = generateRolloutPlan(group.name, learnersCount, planStart);
      plan.endDate = planEnd;

      const rolloutData = buildModuleDates(plan);
      const notesPayload = buildNotesPayload(group.notes, plan);

      await prisma.groupRolloutPlan.upsert({
        where: { groupId: group.id },
        create: {
          groupId: group.id,
          module1StartDate: rolloutData.module1StartDate,
          module1EndDate: rolloutData.module1EndDate,
          module2StartDate: rolloutData.module2StartDate,
          module2EndDate: rolloutData.module2EndDate,
          module3StartDate: rolloutData.module3StartDate,
          module3EndDate: rolloutData.module3EndDate,
          module4StartDate: rolloutData.module4StartDate,
          module4EndDate: rolloutData.module4EndDate,
          module5StartDate: rolloutData.module5StartDate,
          module5EndDate: rolloutData.module5EndDate,
          module6StartDate: rolloutData.module6StartDate,
          module6EndDate: rolloutData.module6EndDate,
        },
        update: {
          module1StartDate: rolloutData.module1StartDate,
          module1EndDate: rolloutData.module1EndDate,
          module2StartDate: rolloutData.module2StartDate,
          module2EndDate: rolloutData.module2EndDate,
          module3StartDate: rolloutData.module3StartDate,
          module3EndDate: rolloutData.module3EndDate,
          module4StartDate: rolloutData.module4StartDate,
          module4EndDate: rolloutData.module4EndDate,
          module5StartDate: rolloutData.module5StartDate,
          module5EndDate: rolloutData.module5EndDate,
          module6StartDate: rolloutData.module6StartDate,
          module6EndDate: rolloutData.module6EndDate,
        },
      });

      await prisma.group.update({
        where: { id: group.id },
        data: {
          startDate: startDateParsed,
          endDate: endDateParsed,
          notes: notesPayload,
        },
      });

      console.log(`✅ ${group.name} — plan saved, start: ${planStart}, end: ${planEnd}`);
      successCount += 1;
    } catch (error: any) {
      const reason = error?.message || String(error);
      console.log(`❌ ${mapping.file} — ERROR: ${reason}`);
      failedCount += 1;
    }
  }

  console.log('');
  console.log(`Total processed: ${processedCount}`);
  console.log(`Success: ${successCount}`);
  console.log(`Skipped (already done): ${skippedCount} (Azelis 2026)`);
  console.log(`Not found in DB: ${notFoundCount}`);
  console.log(`Failed: ${failedCount}`);
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
