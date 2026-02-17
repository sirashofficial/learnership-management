#!/usr/bin/env node
// Compare Group.notes rolloutPlan with UnitStandardRollout table.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function parsePlanDate(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (trimmed.includes('/')) {
    const [day, month, year] = trimmed.split('/').map((part) => Number(part));
    if (!day || !month || !year) return null;
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIso(value) {
  const parsed = parsePlanDate(value);
  return parsed ? parsed.toISOString() : null;
}

async function main() {
  const groups = await prisma.group.findMany({
    select: { id: true, name: true, notes: true },
  });

  let mismatchCount = 0;
  let checkedCount = 0;

  for (const group of groups) {
    if (!group.notes) continue;
    let parsed;
    try {
      parsed = JSON.parse(group.notes);
    } catch {
      continue;
    }

    const plan = parsed?.rolloutPlan;
    if (!plan?.modules?.length) continue;

    const rollouts = await prisma.unitStandardRollout.findMany({
      where: { groupId: group.id },
      include: { unitStandard: true },
    });
    const rolloutByCode = new Map();
    rollouts.forEach((rollout) => {
      if (rollout.unitStandard?.code) {
        rolloutByCode.set(rollout.unitStandard.code, rollout);
      }
    });

    for (const module of plan.modules) {
      const units = Array.isArray(module.unitStandards) ? module.unitStandards : [];
      for (const unit of units) {
        const code = String(unit.code || unit.id || '').trim();
        const rollout = rolloutByCode.get(code);
        if (!rollout) {
          console.log(`❌ Missing rollout | ${group.name} | ${code}`);
          mismatchCount += 1;
          continue;
        }

        const expectedStart = toIso(unit.startDate);
        const expectedEnd = toIso(unit.endDate);
        const expectedSummative = toIso(unit.summativeDate);
        const expectedAssessing = toIso(unit.assessingDate);

        const actualStart = rollout.startDate ? rollout.startDate.toISOString() : null;
        const actualEnd = rollout.endDate ? rollout.endDate.toISOString() : null;
        const actualSummative = rollout.summativeDate ? rollout.summativeDate.toISOString() : null;
        const actualAssessing = rollout.assessingDate ? rollout.assessingDate.toISOString() : null;

        checkedCount += 1;

        if (expectedStart !== actualStart) {
          console.log(`⚠️ Start mismatch | ${group.name} | ${code} | notes=${unit.startDate} | table=${rollout.startDate}`);
          mismatchCount += 1;
        }
        if (expectedEnd !== actualEnd) {
          console.log(`⚠️ End mismatch | ${group.name} | ${code} | notes=${unit.endDate} | table=${rollout.endDate}`);
          mismatchCount += 1;
        }
        if (expectedSummative !== actualSummative) {
          console.log(`⚠️ Summative mismatch | ${group.name} | ${code} | notes=${unit.summativeDate} | table=${rollout.summativeDate}`);
          mismatchCount += 1;
        }
        if (expectedAssessing !== actualAssessing) {
          console.log(`⚠️ Assessing mismatch | ${group.name} | ${code} | notes=${unit.assessingDate} | table=${rollout.assessingDate}`);
          mismatchCount += 1;
        }
      }
    }
  }

  console.log('\n--- Parity Report ---');
  console.log(`Units checked: ${checkedCount}`);
  console.log(`Mismatches: ${mismatchCount}`);
}

main()
  .catch((err) => {
    console.error('Parity report failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
