const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMontzelityLessons() {
  try {
    console.log('Adding Montzelity 26\' lessons...');

    // Get all groups to find Montzelity
    const groups = await prisma.group.findMany();
    
    // Try different variations of the name
    const montzelityGroup = groups.find(g => 
      g.name.toLowerCase().includes('montzelity') || 
      g.name.toLowerCase().includes('monteagle') ||
      g.name.toLowerCase().includes('montazility')
    );
    
    if (!montzelityGroup) {
      console.log('\n⚠️  Montzelity group not found. Creating new group...');
      
      // Get a company to associate with
      const company = await prisma.company.findFirst();
      
      if (!company) {
        console.error('No company found to associate group with');
        return;
      }

      // Create the Montzelity 26' group
      const newGroup = await prisma.group.create({
        data: {
          name: "Montzelity 26'",
          location: 'Main Campus',
          address: 'Training Center',
          contactName: 'Coordinator',
          contactPhone: '0123456789',
          coordinator: 'Admin',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          status: 'ACTIVE',
          companyId: company.id,
        }
      });
      
      console.log(`✓ Created group: ${newGroup.name} (ID: ${newGroup.id})`);
      
      // Use the newly created group
      await addLessonsForGroup(newGroup);
    } else {
      console.log(`Found group: ${montzelityGroup.name} (ID: ${montzelityGroup.id})`);
      await addLessonsForGroup(montzelityGroup);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function addLessonsForGroup(group) {
  // Get module and facilitator
  const module = await prisma.module.findFirst();
  const facilitator = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  if (!module || !facilitator) {
    console.error('Missing module or facilitator');
    return;
  }

  // Define dates for Montzelity (Monday and Wednesday)
  const startDate = new Date('2026-02-09'); // Monday
  const weeksToCreate = 4;
  const days = [0, 2]; // Monday (0) and Wednesday (2)
  let created = 0;

  for (let week = 0; week < weeksToCreate; week++) {
    for (const dayOffset of days) {
      const lessonDate = new Date(startDate);
      lessonDate.setDate(startDate.getDate() + (week * 7) + dayOffset);

      try {
        await prisma.lessonPlan.create({
          data: {
            title: `Training Session - ${group.name}`,
            description: `Regular training session for ${group.name}`,
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
            groupId: group.id,
          }
        });
        created++;
        const dayName = dayOffset === 0 ? 'Monday' : 'Wednesday';
        console.log(`✓ Created lesson for ${group.name} on ${dayName} ${lessonDate.toDateString()} at Lecture Room`);
      } catch (error) {
        console.error(`✗ Error creating lesson:`, error.message);
      }
    }
  }

  console.log(`\n✅ Successfully created ${created} lessons for ${group.name}`);
}

addMontzelityLessons();
