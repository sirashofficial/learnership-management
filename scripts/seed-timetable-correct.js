const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const START_DATE = new Date('2026-02-16');
const END_DATE = new Date('2026-12-31');

const HOLIDAYS_2026 = new Set([
  '2026-03-21',
  '2026-04-27',
  '2026-05-01',
  '2026-06-16',
  '2026-08-09',
  '2026-09-24',
  '2026-12-16',
  '2026-12-25',
  '2026-12-26',
]);

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function findGroupByTokens(groups, tokens, label) {
  const match = groups.find((group) => {
    const name = group.name.toLowerCase();
    return tokens.every((token) => name.includes(token));
  });

  if (!match) {
    throw new Error(`Missing group for ${label}. Tokens: ${tokens.join(', ')}`);
  }

  console.log(`Matched ${label}: ${match.name}`);
  return match;
}

async function getOrCreateDefaultModule() {
  const existing = await prisma.module.findFirst();
  if (existing) return existing;

  return prisma.module.create({
    data: {
      code: 'GEN001',
      name: 'General Training',
      description: 'General training sessions',
      credits: 10,
    },
  });
}

async function getDefaultFacilitator() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (admin) return admin;

  return prisma.user.findFirst();
}

async function seedTimetable() {
  try {
    console.log('Seeding timetable sessions...');

    const groups = await prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    if (groups.length === 0) {
      throw new Error('No groups found. Seed groups before timetable sessions.');
    }

    console.log('Available groups:');
    groups.forEach((group) => console.log(`- ${group.name}`));

    const cityLogistics = findGroupByTokens(groups, ['city logistics', '2026'], 'City Logistics (2026)');
    const azelisSa2026 = findGroupByTokens(groups, ['azelis', 'sa', '2026'], 'Azelis SA (2026)');
    const monteagle2026 = findGroupByTokens(groups, ['monteagle', '2026'], 'Monteagle (2026)');
    const beyondInsights = findGroupByTokens(groups, ['beyond insights', '2026'], 'Beyond Insights (2026)');

    const flint2025 = findGroupByTokens(groups, ['flint', '2025'], 'Flint Group (2025)');
    const packaging2025 = findGroupByTokens(groups, ['packaging', '2025'], 'Packaging World (2025)');
    const azelis2025 = findGroupByTokens(groups, ['azelis', '2025'], 'Azelis (2025)');
    const monteagle2025 = findGroupByTokens(groups, ['monteagle', '2025'], 'Monteagle (2025)');
    const wahl2025 = findGroupByTokens(groups, ['wahl', '2025'], 'Wahl (2025)');

    const module = await getOrCreateDefaultModule();
    const facilitator = await getDefaultFacilitator();

    if (!facilitator) {
      throw new Error('No facilitator found. Create a user first.');
    }

    await prisma.lessonPlan.deleteMany({});

    const scheduleByDay = {
      1: {
        'Lecture Room': [cityLogistics, azelisSa2026, monteagle2026, beyondInsights],
        'Computer Lab': [packaging2025, azelis2025],
      },
      2: {
        'Lecture Room': [flint2025],
        'Computer Lab': [monteagle2025, wahl2025],
      },
      3: {
        'Lecture Room': [cityLogistics, azelisSa2026, monteagle2026, beyondInsights],
        'Computer Lab': [packaging2025, azelis2025],
      },
      4: {
        'Lecture Room': [flint2025],
        'Computer Lab': [wahl2025, monteagle2025],
      },
    };

    const sessionsToCreate = [];
    const perGroupCount = new Map();

    for (
      let current = new Date(START_DATE);
      current <= END_DATE;
      current.setDate(current.getDate() + 1)
    ) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5) {
        continue;
      }

      const dateKey = formatDateKey(current);
      if (HOLIDAYS_2026.has(dateKey)) {
        continue;
      }

      const daySchedule = scheduleByDay[dayOfWeek];
      if (!daySchedule) continue;

      Object.entries(daySchedule).forEach(([venue, dayGroups]) => {
        dayGroups.forEach((group) => {
          sessionsToCreate.push({
            title: `Training Session - ${group.name}`,
            description: `Scheduled session for ${group.name}`,
            date: new Date(current),
            startTime: '09:00',
            endTime: '14:00',
            venue,
            notes: 'Seeded by scripts/seed-timetable-correct.js',
            moduleId: module.id,
            facilitatorId: facilitator.id,
            groupId: group.id,
          });

          perGroupCount.set(
            group.name,
            (perGroupCount.get(group.name) || 0) + 1
          );
        });
      });
    }

    if (sessionsToCreate.length > 0) {
      await prisma.lessonPlan.createMany({ data: sessionsToCreate });
    }

    console.log(
      `Seeded ${sessionsToCreate.length} sessions from 16 Feb 2026 to 31 Dec 2026`
    );

    console.log('Per-group breakdown:');
    Array.from(perGroupCount.entries()).forEach(([groupName, count]) => {
      console.log(`${groupName}: ${count} sessions`);
    });
  } catch (error) {
    console.error('Error seeding timetable:', error.message || error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedTimetable();
