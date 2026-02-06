const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMissingLessons() {
  try {
    console.log('Adding missing Montazility 26\' lessons...');

    // Get all groups to find the right one
    const groups = await prisma.group.findMany();
    console.log('\nAvailable groups:');
    groups.forEach(g => console.log(`- ${g.name} (ID: ${g.id})`));

    // Check if there's a Montazility group
    const montazilityGroup = groups.find(g => g.name.toLowerCase().includes('montazility'));
    
    if (!montazilityGroup) {
      console.log('\n⚠️  No Montazility group found in database');
      console.log('Available 26\' groups:');
      groups.filter(g => g.name.includes('26\'')).forEach(g => console.log(`  - ${g.name}`));
      return;
    }

    // Get module and facilitator
    const module = await prisma.module.findFirst();
    const facilitator = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    if (!module || !facilitator) {
      console.error('Missing module or facilitator');
      return;
    }

    // Define dates for Montazility (Monday and Wednesday)
    const startDate = new Date('2026-02-09'); // Monday
    const weeksToCreate = 4;
    const days = [0, 2]; // Monday and Wednesday
    let created = 0;

    for (let week = 0; week < weeksToCreate; week++) {
      for (const dayOffset of days) {
        const lessonDate = new Date(startDate);
        lessonDate.setDate(startDate.getDate() + (week * 7) + dayOffset);

        try {
          await prisma.lessonPlan.create({
            data: {
              title: `Training Session - ${montazilityGroup.name}`,
              description: `Regular training session for ${montazilityGroup.name}`,
              date: lessonDate,
              startTime: '09:00',
              endTime: '14:00',
              venue: 'Lecture Room',
              objectives: 'Complete module objectives and practical exercises',
              materials: 'Textbooks, computers, and training materials',
              activities: 'Lectures, practical exercises, and group discussions',
              notes: 'Recurring weekly session',
              moduleId: module.id,
              facilitatorId: facilitator.id,
              groupId: montazilityGroup.id,
            }
          });
          created++;
          console.log(`✓ Created lesson for ${montazilityGroup.name} on ${lessonDate.toDateString()} at Lecture Room`);
        } catch (error) {
          console.error(`✗ Error creating lesson:`, error.message);
        }
      }
    }

    console.log(`\n✅ Successfully created ${created} lessons for ${montazilityGroup.name}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingLessons();
