import fs from 'fs';
import path from 'path';
import prisma from './src/lib/prisma';
import { generateRolloutPlan } from './src/lib/rolloutPlanGenerator';

type FileEntry = {
  filePath: string;
  fileName: string;
  baseName: string;
  normalized: string;
  normalizedSimple: string;
  startDateRaw: string | null;
  endDateRaw: string | null;
  learnersRaw: string | null;
  inductionRaw: string | null;
};

const rolloutRoot = path.join(__dirname, 'Roll Out');
const SUFFIX_WORDS = ['sa', 'pty', 'ltd', 'ptyltd', 'group', 'co', 'company'];
const OVERRIDE_MATCHES: Array<{ group: string; fileBase: string }> = [
  { group: "Monteagle 26'", fileBase: 'Monteagle_Group_2026_Rollout_Plan' },
  { group: "Packaging World 25'", fileBase: 'Packaging_World_2026_Rollout_Plan' },
];

function expandTwoDigitYear(value: string): string {
  return String(value || '').replace(/\b(\d{2})'?\b/g, (_, year) => {
    const yearNum = Number(year);
    if (yearNum >= 20 && yearNum <= 30) {
      return `20${year}`;
    }
    return year;
  });
}

function normalizeName(value: string, expandYears = false): string {
  const source = expandYears ? expandTwoDigitYear(value) : String(value || '');
  return source.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function simplifyName(value: string): string {
  const cleaned = expandTwoDigitYear(value).replace(/[^a-z0-9\s]/gi, ' ');
  const tokens = cleaned
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !SUFFIX_WORDS.includes(token));
  return tokens.join(' ');
}

function extractField(content: string, label: string): string | null {
  const pattern = new RegExp(`^\\s*\\*{0,2}${label}\\*{0,2}\\s*[:\\-]\\s*(.+)$`, 'im');
  const match = content.match(pattern);
  if (!match) {
    return null;
  }
  const raw = match[1].replace(/[*_]/g, ' ').trim();
  return raw || null;
}

function extractDateToken(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{1,2}-\d{1,2})/);
  return match ? match[1] : value;
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
  const rolloutData: Record<string, Date> = {};

  plan.modules.forEach((module: any) => {
    const first = module.unitStandards[0];
    const last = module.unitStandards[module.unitStandards.length - 1];
    rolloutData[`module${module.moduleNumber}StartDate`] = parsePlanDate(first.startDate);
    rolloutData[`module${module.moduleNumber}EndDate`] = parsePlanDate(last.endDate);
  });

  return rolloutData;
}

function parsePlanDate(value: string): Date {
  const [day, month, year] = value.split('/').map((part) => Number(part));
  return new Date(Date.UTC(year, month - 1, day));
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

async function listFiles(dir: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function scoreMatch(groupName: string, file: FileEntry): number {
  const groupNorm = normalizeName(groupName, true);
  const groupSimple = normalizeName(simplifyName(groupName), false);

  let score = 0;
  if (groupNorm === file.normalized) {
    score = 3;
  } else if (file.normalized.includes(groupNorm) || groupNorm.includes(file.normalized)) {
    score = 2;
  } else if (groupSimple && (file.normalized.includes(groupSimple) || groupSimple.includes(file.normalized))) {
    score = 1;
  }

  return score;
}

function findBestMatch(groupName: string, files: FileEntry[]): { match: FileEntry | null; ambiguous: boolean } {
  const override = OVERRIDE_MATCHES.find(
    (entry) => normalizeName(entry.group, true) === normalizeName(groupName, true)
  );
  if (override) {
    const target = normalizeName(override.fileBase, true);
    const exact = files.find((file) => normalizeName(file.baseName, true) === target);
    if (exact) {
      return { match: exact, ambiguous: false };
    }
  }

  const scored = files
    .map((file) => ({ file, score: scoreMatch(groupName, file) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { match: null, ambiguous: false };
  }

  const topScore = scored[0].score;
  const topMatches = scored.filter((item) => item.score === topScore);
  return { match: topMatches[0].file, ambiguous: topMatches.length > 1 };
}

async function main() {
  const filePaths = await listFiles(rolloutRoot);
  const fileEntries: FileEntry[] = await Promise.all(
    filePaths.map(async (filePath) => {
      const baseName = path.basename(filePath, path.extname(filePath));
      const content = await fs.promises.readFile(filePath, 'utf8');
      const startDateRaw = extractDateToken(extractField(content, 'START\\s*DATE'));
      const endDateRaw = extractDateToken(extractField(content, 'END\\s*DATE'));
      const learnersRaw = extractField(content, 'LEARNERS');
      const inductionRaw = extractDateToken(extractField(content, 'LEARNERSHIP\\s*INDUCTION'));
      return {
        filePath,
        fileName: path.basename(filePath),
        baseName,
        normalized: normalizeName(baseName, true),
        normalizedSimple: normalizeName(simplifyName(baseName), false),
        startDateRaw,
        endDateRaw,
        learnersRaw,
        inductionRaw,
      };
    })
  );

  const groups = await prisma.group.findMany({
    select: {
      id: true,
      name: true,
      notes: true,
      students: { select: { id: true } },
    },
    orderBy: { name: 'asc' },
  });

  let successCount = 0;
  let failedCount = 0;

  for (const group of groups) {
    try {
      const { match, ambiguous } = findBestMatch(group.name, fileEntries);
      if (!match) {
        throw new Error('No matching rollout file found');
      }

      const startDateParsed = parseDate(match.startDateRaw);
      const endDateParsed = parseDate(match.endDateRaw);

      if (!startDateParsed || !endDateParsed) {
        throw new Error('Missing or invalid START DATE / END DATE in file');
      }

      const numLearners = group.students?.length ?? 0;
      const planStart = formatPlanDate(startDateParsed);
      const plan = generateRolloutPlan(group.name, numLearners, planStart);
      plan.endDate = formatPlanDate(endDateParsed);

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

      const unitStandardCount = plan.modules.reduce(
        (sum: number, module: any) => sum + (module.unitStandards?.length || 0),
        0
      );
      const ambiguousNote = ambiguous ? ' (AMBIGUOUS MATCH)' : '';
      console.log(`✅ ${group.name}${ambiguousNote} — plan generated, start: ${plan.startDate}, ${unitStandardCount} unit standards`);
      successCount += 1;
    } catch (error: any) {
      const reason = error?.message || String(error);
      console.log(`❌ ${group.name} — ERROR: ${reason}`);
      failedCount += 1;
    }
  }

  console.log('');
  console.log(`Total groups processed: ${groups.length}`);
  console.log(`Success: ${successCount}`);
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
