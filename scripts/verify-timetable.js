const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.lessonPlan.count();
  const earliest = await prisma.lessonPlan.findMany({
    take: 5,
    orderBy: { date: 'asc' },
    select: {
      date: true,
      venue: true,
      startTime: true,
      endTime: true,
      group: { select: { name: true } }
    }
  });
  const latest = await prisma.lessonPlan.findMany({
    take: 5,
    orderBy: { date: 'desc' },
    select: {
      date: true,
      venue: true,
      startTime: true,
      endTime: true,
      group: { select: { name: true } }
    }
  });

  console.log('Total sessions:', count);
  console.log('\nEarliest 5:');
  earliest.forEach(s => {
    const dateStr = s.date.toISOString().split('T')[0];
    console.log(`  ${dateStr} ${s.startTime}-${s.endTime} - ${s.group.name} @ ${s.venue}`);
  });
  console.log('\nLatest 5:');
  latest.forEach(s => {
    const dateStr = s.date.toISOString().split('T')[0];
    console.log(`  ${dateStr} ${s.startTime}-${s.endTime} - ${s.group.name} @ ${s.venue}`);
  });

  // Check specific date range (Feb 16-20, 2026)
  const febSessions = await prisma.lessonPlan.findMany({
    where: {
      date: {
        gte: new Date('2026-02-16'),
        lte: new Date('2026-02-20')
      }
    },
    orderBy: [{ date: 'asc' }, { venue: 'asc' }],
    select: {
      date: true,
      venue: true,
      group: { select: { name: true } }
    }
  });

  console.log('\n\nWeek of Feb 16-20, 2026:');
  const byDate = {};
  febSessions.forEach(s => {
    const dateStr = s.date.toISOString().split('T')[0];
    if (!byDate[dateStr]) byDate[dateStr] = [];
    byDate[dateStr].push(s);
  });

  Object.keys(byDate).sort().forEach(date => {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    console.log(`\n${dayOfWeek} ${date}:`);
    byDate[date].forEach(s => {
      console.log(`  ${s.venue}: ${s.group.name}`);
    });
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
