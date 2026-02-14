#!/usr/bin/env node

/**
 * Generate Sessions for ALL Groups
 * Creates calendar sessions for all groups with rollout plans
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getNextBusinessDay(date) {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  if (dayOfWeek === 0) {
    d.setDate(d.getDate() + 1);
  } else if (dayOfWeek === 6) {
    d.setDate(d.getDate() + 2);
  }
  return d;
}

async function generateSessions(groupId, facilitatorId) {
  // Get group with rollout plan
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { rolloutPlan: true },
  });

  if (!group || !group.rolloutPlan) {
    return { groupId, status: 'skipped', reason: 'No rollout plan' };
  }

  const modules = [
    { num: 1, name: 'Numeracy', startKey: 'module1StartDate', endKey: 'module1EndDate' },
    { num: 2, name: 'HIV/AIDS & Communications', startKey: 'module2StartDate', endKey: 'module2EndDate' },
    { num: 3, name: 'Market Requirements', startKey: 'module3StartDate', endKey: 'module3EndDate' },
    { num: 4, name: 'Business Sector & Industry', startKey: 'module4StartDate', endKey: 'module4EndDate' },
    { num: 5, name: 'Financial Requirements', startKey: 'module5StartDate', endKey: 'module5EndDate' },
    { num: 6, name: 'Business Operations', startKey: 'module6StartDate', endKey: 'module6EndDate' },
  ];

  let totalSessions = 0;

  for (const module of modules) {
    const startDate = group.rolloutPlan[module.startKey];
    const endDate = group.rolloutPlan[module.endKey];

    if (!startDate || !endDate) continue;

    let currentDate = new Date(startDate);
    const endDateTime = new Date(endDate);
    let sessionCount = 0;

    while (currentDate <= endDateTime && sessionCount < 15) {
      currentDate = getNextBusinessDay(currentDate);

      if (currentDate > endDateTime) break;

      try {
        await prisma.session.create({
          data: {
            groupId: group.id,
            facilitatorId: facilitatorId,
            date: currentDate,
            startTime: '09:00',
            endTime: '16:00',
            title: `${module.name} - Session ${sessionCount + 1}`,
            module: `Module ${module.num}`,
            notes: `NVC L2 - ${module.name}`,
          },
        });
        sessionCount++;
        totalSessions++;
      } catch (err) {
        // Likely duplicate - skip
      }

      currentDate = addDays(currentDate, Math.random() < 0.5 ? 2 : 3);
    }
  }

  return {
    groupId,
    groupName: group.name,
    status: 'created',
    sessionsCreated: totalSessions,
  };
}

async function main() {
  console.log('🎓 Generating sessions for ALL groups...\n');

  try {
    // Get or create default facilitator
    let facilitator = await prisma.user.findFirst({
      where: { role: 'FACILITATOR' },
    });

    if (!facilitator) {
      console.log('🔧 Creating default facilitator...');
      facilitator = await prisma.user.create({
        data: {
          email: `facilitator-main@lms.local`,
          name: 'Default Facilitator',
          password: 'temp',
          role: 'FACILITATOR',
        },
      });
    }

    // Get all groups
    const groups = await prisma.group.findMany({
      orderBy: { name: 'asc' },
    });

    const results = [];
    let totalCreated = 0;

    console.log(`Processing ${groups.length} groups...\n`);

    for (const group of groups) {
      const result = await generateSessions(group.id, facilitator.id);
      results.push(result);

      if (result.status === 'created') {
        console.log(
          `✅ ${result.groupName}: ${result.sessionsCreated} sessions`
        );
        totalCreated += result.sessionsCreated;
      } else {
        console.log(
          `⏭️  ${group.name}: ${result.reason}`
        );
      }
    }

    console.log(
      `\n✨ Complete!\n📊 Generated ${totalCreated} total sessions across ${groups.length} groups`
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
