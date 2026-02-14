// Script to attach rollout plans to groups with correct module dates
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('prisma/prisma-client');
const prisma = new PrismaClient();

const plansDir = path.join(__dirname, '../docs/Curriculumn and data process/new groups 2026 - roll out plans/new groups 2026 - roll out plans');

const modules = [
  { name: 'Numeracy', duration: 1 },
  { name: 'HIV/AIDS & Communications', duration: 1.5 },
  { name: 'Market Requirements', duration: 1.5 },
  { name: 'Business Sector & Industry', duration: 1.5 },
  { name: 'Financial Requirements', duration: 2 },
  { name: 'Business Operations', duration: 2 }
];

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function main() {
  const groups = await prisma.group.findMany();
  const planFiles = fs.readdirSync(plansDir);

  for (const group of groups) {
    // Find matching plan file
    const planFile = planFiles.find(f => f.toLowerCase().includes(group.name.toLowerCase().split(' ')[0]));
    let startDate = group.startDate;
    let moduleDates = [];
    let currentStart = new Date(startDate);
    for (const mod of modules) {
      let end = addMonths(currentStart, mod.duration);
      moduleDates.push({ start: new Date(currentStart), end: new Date(end) });
      currentStart = new Date(end);
    }
    await prisma.groupRolloutPlan.upsert({
      where: { groupId: group.id },
      update: {
        module1StartDate: moduleDates[0].start,
        module1EndDate: moduleDates[0].end,
        module2StartDate: moduleDates[1].start,
        module2EndDate: moduleDates[1].end,
        module3StartDate: moduleDates[2].start,
        module3EndDate: moduleDates[2].end,
        module4StartDate: moduleDates[3].start,
        module4EndDate: moduleDates[3].end,
        module5StartDate: moduleDates[4].start,
        module5EndDate: moduleDates[4].end,
        module6StartDate: moduleDates[5].start,
        module6EndDate: moduleDates[5].end,
        rolloutDocPath: planFile ? path.join(plansDir, planFile) : null
      },
      create: {
        groupId: group.id,
        module1StartDate: moduleDates[0].start,
        module1EndDate: moduleDates[0].end,
        module2StartDate: moduleDates[1].start,
        module2EndDate: moduleDates[1].end,
        module3StartDate: moduleDates[2].start,
        module3EndDate: moduleDates[2].end,
        module4StartDate: moduleDates[3].start,
        module4EndDate: moduleDates[3].end,
        module5StartDate: moduleDates[4].start,
        module5EndDate: moduleDates[4].end,
        module6StartDate: moduleDates[5].start,
        module6EndDate: moduleDates[5].end,
        rolloutDocPath: planFile ? path.join(plansDir, planFile) : null
      }
    });
    console.log(`Attached rollout plan to group: ${group.name}`);
  }
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
