const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { extractRolloutPlan } = require('../src/lib/planParser');

const prisma = new PrismaClient();

// Debug utility (optional)
// async function debugListGroupsAndFiles() {
//   const filesDir = path.join(process.cwd(), 'public', 'rollout-plans');
//   const files = fs.existsSync(filesDir) ? fs.readdirSync(filesDir) : [];
//   const groups = await prisma.group.findMany({ select: { id: true, name: true } });
//   console.log('Files:', files);
//   console.log('Groups:', groups);
// }

const normalizeName = (value: string) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const ROLLOUT_DIR = path.join(
  process.cwd(),
  'docs',
  'Curriculumn and data process',
  'new groups 2026 - roll out plans',
  'new groups 2026 - roll out plans'
);

const STRATEGIC_DIR = path.join(ROLLOUT_DIR, 'Strategic Plan');
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'rollout-plans');

const FILE_EXTENSIONS = ['.docx', '.pdf', '.md'];

const manualMatchers = [
  { group: 'AZELIS SA (LP) - 2026', tokens: ['azelis', '26'] },
  { group: 'AZELIS (LP) - 2025', tokens: ['azelis', '25'] },
  { group: 'CITY LOGISTICS (LP) - 2026', tokens: ['city', 'logistics', '26'] },
  { group: 'BEYOND INSIGHTS (LP) - 2026', tokens: ['beyond', 'insights', '26'] },
  { group: 'MONTEAGLE (LP) - 2026', tokens: ['monteagle', '26'] },
  { group: 'MONTEAGLE (LP) - 2025', tokens: ['monteagle', '25'] },
  { group: 'PACKAGING WORLD (LP) - 2025', tokens: ['packaging', 'world'] },
  { group: 'WAHL CLIPPERS (LP) - 2025', tokens: ['wahl'] },
  { group: 'FLINT GROUP (LP) - 2025', tokens: ['flint'] },
  { group: 'KELPACK (LP) - 2025', tokens: ['kelpack'] },
];

async function main() {
  console.log('🌱 Seeding rollout plans from docs...\n');

  if (!fs.existsSync(ROLLOUT_DIR)) {
    console.error(`❌ Directory not found: ${ROLLOUT_DIR}`);
    return;
  }

  const filesFromDir = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    return fs.readdirSync(dirPath)
      .filter((f: string) => FILE_EXTENSIONS.some((ext) => f.endsWith(ext)))
      .map((f: string) => ({
        name: f,
        path: path.join(dirPath, f),
        ext: path.extname(f).toLowerCase(),
      }));
  };

  const files = [
    ...filesFromDir(ROLLOUT_DIR),
    ...filesFromDir(STRATEGIC_DIR),
    ...filesFromDir(PUBLIC_DIR),
  ];
  console.log(`Found ${files.length} rollout plan files`);

  const allGroups: Array<{ id: string; name: string }> = await prisma.group.findMany({
    select: { id: true, name: true },
  });

  let successCount = 0;
  let failCount = 0;

  for (const group of allGroups) {
    const normalizedGroup = normalizeName(group.name);
    const manual = manualMatchers.find((entry) => normalizeName(entry.group) === normalizedGroup);

    const matches = files.filter((file: { name: string; ext: string }) => {
      const normalizedFile = normalizeName(file.name);
      if (manual) {
        return manual.tokens.every((token) => normalizedFile.includes(token));
      }
      return normalizedFile.includes(normalizedGroup);
    });

    const fileMatch = matches.sort((a, b) => {
      if (a.ext === b.ext) {
        return 0;
      }
      if (a.ext === '.docx') {
        return -1;
      }
      if (b.ext === '.docx') {
        return 1;
      }
      if (a.ext === '.md') {
        return -1;
      }
      if (b.ext === '.md') {
        return 1;
      }
      return 0;
    })[0];

    if (!fileMatch) {
      console.log(`\n⚠️  No rollout file matched for ${group.name}`);
      failCount++;
      continue;
    }

    console.log(`\n📄 Processing: ${fileMatch.name} → ${group.name}`);
    const filePath = fileMatch.path;

    try {
      const plan = await extractRolloutPlan(filePath);
      const totalUnits = plan.modules.reduce(
        (acc: number, m: any) => acc + m.unitStandards.length,
        0
      );

      if (plan.modules.length === 0) {
        console.log('   ⚠️  Parsed 0 modules, skipping update');
        failCount++;
        continue;
      }

      await prisma.group.update({
        where: { id: group.id },
        data: {
          notes: JSON.stringify({
            rolloutPlan: {
              ...plan,
              groupName: group.name,
            },
          }),
        },
      });

      console.log(`   ✅ Saved: ${plan.modules.length} modules, ${totalUnits} unit standards`);
      successCount += 1;
    } catch (err: any) {
      console.error(`   ❌ Parse error: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Seed Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📈 Total: ${successCount + failCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
