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

// Exact mapping from filename -> group name (after renaming)
const filenameToGroupName: Record<string, string[]> = {
  'Azelis_2025_Rollout_Plan.md': ['AZELIS (2025)'],
  'Azelis_2026_Rollout_Plan.md': ['AZELIS SA (2026)'],
  'Beyond_Insights_2026_Rollout_Plan.md': ['BEYOND INSIGHTS (2026)'],
  'City_Logistics_2026_Rollout_Plan.md': ['CITY LOGISTICS (2026)'],
  'Kelpack_2025_Rollout_Plan.md': ['KELPACK (2025)'],
  'Monteagle_2025_Rollout_Plan.md': ['MONTEAGLE (2025)'],
  'Monteagle_Group_2026_Rollout_Plan.md': ['MONTEAGLE (2026)'],
  'Packaging_World_2026_Rollout_Plan.md': ['PACKAGING WORLD (2025)'],
};

const normalizeName = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

async function main() {
  console.log('🌱 Seeding rollout plans from .md files...\n');

  const filesDir = path.join(process.cwd(), 'public', 'rollout-plans');
  if (!fs.existsSync(filesDir)) {
    console.error(`❌ Directory not found: ${filesDir}`);
    console.log('Please create public/rollout-plans/ and place all .md files there.');
    return;
  }

  const files = fs.readdirSync(filesDir).filter((f: string) => f.endsWith('.md'));
  console.log(`Found ${files.length} .md files`);

  const allGroups: Array<{ id: string; name: string }> = await prisma.group.findMany({
    select: { id: true, name: true },
  });

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    console.log(`\n📄 Processing: ${file}`);
    const targetGroups = filenameToGroupName[file] || [];

    for (const groupName of targetGroups) {
      console.log(`   Looking for group: "${groupName}"`);
      const normalizedTarget = normalizeName(groupName);
      const groups = allGroups.filter((group: { id: string; name: string }) =>
        normalizeName(group.name) === normalizedTarget
      );

      if (groups.length === 0) {
        console.log(`   ❌ Group not found: ${groupName}`);
        failCount++;
        continue;
      }

      console.log(
        `   ✅ Found ${groups.length} group(s): ${groups.map((g: { id: string; name: string }) => g.name).join(', ')}`
      );

      const filePath = path.join(filesDir, file);
      try {
        const plan = await extractRolloutPlan(filePath);
        const totalUnits = plan.modules.reduce(
          (acc: number, m: any) => acc + m.unitStandards.length,
          0
        );

        for (const group of groups) {
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
        }

        console.log(`   ✅ Saved: ${plan.modules.length} modules, ${totalUnits} unit standards`);
        successCount += groups.length;
      } catch (err: any) {
        console.error(`   ❌ Parse error: ${err.message}`);
        failCount++;
      }
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
