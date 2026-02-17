const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const today = '2026-02-16';

async function main() {
  const groups = await prisma.group.findMany({
    select: { id: true, name: true, notes: true },
  });

  console.log('Groups:', groups.length);
  groups.forEach((group) => {
    let moduleCount = 0;
    let unitCount = 0;
    let startDate = '';
    let endDate = '';
    try {
      const parsed = group.notes ? JSON.parse(group.notes) : null;
      const modules = parsed?.rolloutPlan?.modules || [];
      moduleCount = Array.isArray(modules) ? modules.length : 0;
      if (Array.isArray(modules)) {
        unitCount = modules.reduce((sum, module) => {
          const units = Array.isArray(module.unitStandards) ? module.unitStandards.length : 0;
          return sum + units;
        }, 0);

        const dates = [];
        modules.forEach((module) => {
          if (!Array.isArray(module.unitStandards)) return;
          module.unitStandards.forEach((unit) => {
            if (unit.startDate) dates.push(parseDate(unit.startDate));
            if (unit.endDate) dates.push(parseDate(unit.endDate));
          });
        });
        const validDates = dates.filter((date) => date && !Number.isNaN(date.getTime()));
        if (validDates.length > 0) {
          const sorted = validDates.sort((a, b) => a.getTime() - b.getTime());
          startDate = sorted[0].toISOString().slice(0, 10);
          endDate = sorted[sorted.length - 1].toISOString().slice(0, 10);
        }
      }
    } catch {
      moduleCount = 0;
      unitCount = 0;
    }
    const hasPlan = moduleCount > 0;
    console.log(
      `- ${group.name} | rolloutPlan=${hasPlan ? 'yes' : 'no'} | modules=${moduleCount} | unitStandards=${unitCount} | start=${startDate || 'n/a'} | end=${endDate || 'n/a'}`
    );
  });

  const sessionsToday = await prisma.lessonPlan.count({
    where: { date: new Date(today) },
  });
  console.log(`Sessions on ${today}:`, sessionsToday);

  const perGroup = await prisma.lessonPlan.groupBy({
    by: ['groupId'],
    _count: { _all: true },
  });

  const groupMap = Object.fromEntries(groups.map((g) => [g.id, g.name]));
  console.log('Sessions per group:');
  perGroup.forEach((row) => {
    const name = groupMap[row.groupId] || row.groupId;
    console.log(`- ${name}: ${row._count._all}`);
  });
}

function parseDate(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  const isoMatch = /^\d{4}-\d{2}-\d{2}/.test(trimmed);
  if (isoMatch) {
    return new Date(trimmed);
  }

  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const normalizedYear = year.length === 2 ? `20${year}` : year;
    const iso = `${normalizedYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return new Date(iso);
  }

  return new Date(trimmed);
}

main()
  .catch((error) => {
    console.error('Check failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
