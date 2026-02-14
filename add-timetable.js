const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTimetable() {
  try {
    console.log('Starting timetable creation...');

    // Get all groups
    const groups = await prisma.group.findMany({
      include: { company: true }
    });

    console.log(`Found ${groups.length} groups`);

    // Use shared normalization utility
    const { normalizeGroupName } = require('./src/lib/groupNameUtils');
    // Create a mapping of normalized group names to IDs
    const groupMap = {};
    groups.forEach(g => {
      const normalizedNames = normalizeGroupName(g.name);
      normalizedNames.forEach(n => {
        groupMap[n] = g.id;
      });
    });

    // Get or create a default module
    let module = await prisma.module.findFirst();
    if (!module) {
      module = await prisma.module.create({
        data: {
          code: 'GEN001',
          name: 'General Training',
          description: 'General training sessions',
          credits: 10,
        }
      });
      console.log('Created default module');
    }

    // Get admin user as facilitator
    const facilitator = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!facilitator) {
      console.error('No admin user found to set as facilitator');
      return;
    }

    // Define the timetable - starting from next Monday (Feb 10, 2026)
    const startDate = new Date('2026-02-09'); // Monday
    const weeksToCreate = 4; // Create 4 weeks of lessons

    const schedule = [
      // Monday
      {
        day: 0,
        lessons: [
          { groupName: "Montazility 26'", venue: 'Lecture Room' },
          { groupName: "Azelis 25'", venue: 'Computer Lab' },
          { groupName: "Packaging World 25'", venue: 'Computer Lab' },
        ]
      },
      // Tuesday
      {
        day: 1,
        lessons: [
          { groupName: "Flint Group 25'", venue: 'Lecture Room' },
          { groupName: "Wahl 25'", venue: 'Computer Lab' },
          { groupName: "Monteagle 25'", venue: 'Computer Lab' },
        ]
      },
      // Wednesday
      {
        day: 2,
        lessons: [
          { groupName: "Montazility 26'", venue: 'Lecture Room' },
          { groupName: "Azelis 25'", venue: 'Computer Lab' },
          { groupName: "Packaging World 25'", venue: 'Computer Lab' },
        ]
      },
      // Thursday
      {
        day: 3,
        lessons: [
          { groupName: "Flint Group 25'", venue: 'Lecture Room' },
          { groupName: "Wahl 25'", venue: 'Computer Lab' },
          { groupName: "Monteagle 25'", venue: 'Computer Lab' },
        ]
      },
    ];

    let created = 0;

    // Create lessons for each week
    for (let week = 0; week < weeksToCreate; week++) {
      console.log(`\nCreating week ${week + 1}...`);

      for (const daySchedule of schedule) {
        const lessonDate = new Date(startDate);
        lessonDate.setDate(startDate.getDate() + (week * 7) + daySchedule.day);

        for (const lesson of daySchedule.lessons) {
          const groupId = groupMap[lesson.groupName];

          if (!groupId) {
            console.log(`⚠️  Group not found: ${lesson.groupName}`);
            continue;
          }

          try {
            await prisma.lessonPlan.create({
              data: {
                title: `Training Session - ${lesson.groupName}`,
                description: `Regular training session for ${lesson.groupName}`,
                date: lessonDate,
                startTime: '09:00',
                endTime: '14:00',
                venue: lesson.venue,
                objectives: 'Complete module objectives and practical exercises',
                materials: 'Textbooks, computers, and training materials',
                activities: 'Lectures, practical exercises, and group discussions',
                notes: 'Recurring weekly session',
                moduleId: module.id,
                facilitatorId: facilitator.id,
                groupId: groupId,
              }
            });
            created++;
            console.log(`✓ Created lesson for ${lesson.groupName} on ${lessonDate.toDateString()} at ${lesson.venue}`);
          } catch (error) {
            console.error(`✗ Error creating lesson for ${lesson.groupName}:`, error.message);
          }
        }
      }
    }

    console.log(`\n✅ Successfully created ${created} lessons`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTimetable();
