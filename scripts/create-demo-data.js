const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating demo data...\n');

  try {
    // Create a demo company
    let company = await prisma.company.findFirst({
      where: { name: 'Demo Training Company' }
    });
    
    if (!company) {
      company = await prisma.company.create({
        data: {
          id: randomUUID(),
          name: 'Demo Training Company',
          address: '123 Main Street, Cape Town',
          contactPerson: 'John Doe',
          email: 'john@democompany.co.za',
          phone: '021-123-4567',
          updatedAt: new Date(),
        },
      });
    }
    console.log('✅ Created demo company');

    // Create a demo group
    let group = await prisma.group.findFirst({
      where: { name: 'Demo Group 2024' }
    });
    
    if (!group) {
      group = await prisma.group.create({
        data: {
          name: 'Demo Group 2024',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2025-02-01'),
          status: 'ACTIVE',
          location: 'Cape Town',
          companyId: company.id,
        },
      });
    }
    console.log('✅ Created demo group');

    // Get the user to assign as facilitator
    const facilitator = await prisma.user.findFirst({
      where: { email: 'ash@yeha.training' }
    });

    if (!facilitator) {
      console.log('❌ Facilitator user not found');
      return;
    }

    // Create demo students
    const studentNames = [
      { firstName: 'Alice', lastName: 'Smith', studentId: 'ST001' },
      { firstName: 'Bob', lastName: 'Johnson', studentId: 'ST002' },
      { firstName: 'Carol', lastName: 'Williams', studentId: 'ST003' },
      { firstName: 'David', lastName: 'Brown', studentId: 'ST004' },
      { firstName: 'Emma', lastName: 'Davis', studentId: 'ST005' },
    ];

    for (const student of studentNames) {
      await prisma.student.upsert({
        where: { studentId: student.studentId },
        update: {},
        create: {
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          email: `${student.firstName.toLowerCase()}@demo.co.za`,
          phone: '021-555-0100',
          progress: Math.floor(Math.random() * 100),
          totalCreditsEarned: Math.floor(Math.random() * 50),
          status: 'ACTIVE',
          groupId: group.id,
          facilitatorId: facilitator.id,
        },
      });
    }
    console.log('✅ Created 5 demo students');

    // Create a demo session for today
    const today = new Date();
    today.setHours(9, 0, 0, 0);

    await prisma.session.create({
      data: {
        title: 'Demo Session - Introduction',
        module: 'Module 1',
        date: today,
        startTime: '09:00',
        endTime: '12:00',
        notes: 'Introduction to the course',
        groupId: group.id,
        facilitatorId: facilitator.id,
      },
    });
    console.log('✅ Created demo session for today');

    // Get a unit standard to create assessments
    const unitStandard = await prisma.unitStandard.findFirst();

    if (unitStandard) {
      // Create some demo assessments
      const students = await prisma.student.findMany({ where: { groupId: group.id } });
      
      for (let i = 0; i < 3 && i < students.length; i++) {
        await prisma.assessment.create({
          data: {
            type: 'FORMATIVE',
            method: 'WRITTEN',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            studentId: students[i].id,
            unitStandardId: unitStandard.id,
          },
        });
      }
      console.log('✅ Created 3 demo assessments');
    }

    console.log('\n✅ Demo data created successfully!');
    console.log('\nYou can now:');
    console.log('1. View the dashboard at http://localhost:3000');
    console.log('2. See students in the Students page');
    console.log('3. See groups in the Groups page');
    console.log('4. See assessments in the Assessments page');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
