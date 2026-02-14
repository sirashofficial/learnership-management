#!/usr/bin/env node

/**
 * Generate Sessions from Rollout Plans
 * Creates the actual class sessions for the calendar
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
    d.setDate(d.getDate() + 1); // Sunday -> Monday
  } else if (dayOfWeek === 6) {
    d.setDate(d.getDate() + 2); // Saturday -> Monday
  }
  return d;
}

async function generateSessionsForGroup(groupId) {
  console.log(`\n🎓 Generating sessions for group: ${groupId}\n`);

  try {
    // Get group with rollout plan
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { rolloutPlan: true, students: true },
    });

    if (!group) {
      console.log('❌ Group not found');
      return;
    }

    if (!group.rolloutPlan) {
      console.log('❌ Group has no rollout plan');
      return;
    }

    console.log(`Group: ${group.name}`);
    console.log(`Students: ${group.students.length}`);
    console.log(`\n📅 Generating sessions...\n`);

    // Get or create facilitator
    let facilitator = await prisma.user.findFirst({
      where: { role: 'FACILITATOR' },
    });

    if (!facilitator) {
      console.log('🔧 Creating default facilitator...');
      facilitator = await prisma.user.create({
        data: {
          email: `facilitator-default@lms.local`,
          name: 'Default Facilitator',
          password: 'temp',
          role: 'FACILITATOR',
        },
      });
    }

    const modules = [
      { num: 1, name: 'Numeracy', startKey: 'module1StartDate', endKey: 'module1EndDate' },
      { num: 2, name: 'HIV/AIDS & Communications', startKey: 'module2StartDate', endKey: 'module2EndDate' },
      { num: 3, name: 'Market Requirements', startKey: 'module3StartDate', endKey: 'module3EndDate' },
      { num: 4, name: 'Business Sector & Industry', startKey: 'module4StartDate', endKey: 'module4EndDate' },
      { num: 5, name: 'Financial Requirements', startKey: 'module5StartDate', endKey: 'module5EndDate' },
      { num: 6, name: 'Business Operations', startKey: 'module6StartDate', endKey: 'module6EndDate' },
    ];

    let totalSessionsCreated = 0;

    for (const module of modules) {
      const startDate = group.rolloutPlan[module.startKey];
      const endDate = group.rolloutPlan[module.endKey];

      if (!startDate || !endDate) {
        console.log(`⏭️  Module ${module.num}: No dates configured`);
        continue;
      }

      let currentDate = new Date(startDate);
      const endDateTime = new Date(endDate);
      let sessionCount = 0;
      const sessionsCreated = [];

      console.log(`\n📖 Module ${module.num}: ${module.name}`);
      console.log(`   ${currentDate.toISOString().split('T')[0]} → ${endDateTime.toISOString().split('T')[0]}`);

      // Create sessions - 2-3 per week, Mon-Fri
      while (currentDate <= endDateTime && sessionCount < 15) {
        currentDate = getNextBusinessDay(currentDate);

        if (currentDate > endDateTime) break;

        const session = await prisma.session.create({
          data: {
            groupId: group.id,
            facilitatorId: facilitator.id,
            date: currentDate,
            startTime: '09:00',
            endTime: '16:00',
            title: `${module.name} - Session ${sessionCount + 1}`,
            module: `Module ${module.num}`,
            notes: `NVC L2 - ${module.name}`,
          },
        });

        sessionsCreated.push(session.id);
        sessionCount++;

        // Move to next session (2-3 days)
        currentDate = addDays(currentDate, Math.random() < 0.5 ? 2 : 3);
      }

      console.log(`   ✅ Created ${sessionCount} sessions`);
      totalSessionsCreated += sessionCount;
    }

    console.log(`\n✨ Complete! Created ${totalSessionsCreated} total sessions`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get first group from database
async function main() {
  try {
    const firstGroup = await prisma.group.findFirst({
      orderBy: { name: 'asc' },
    });

    if (!firstGroup) {
      console.log('❌ No groups found');
      await prisma.$disconnect();
      return;
    }

    await generateSessionsForGroup(firstGroup.id);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
