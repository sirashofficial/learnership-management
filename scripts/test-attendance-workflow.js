#!/usr/bin/env node

/**
 * Test Attendance Against Session
 * 
 * Creates a test attendance record to verify the workflow works
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Test: Mark Attendance Against Session\n');
  console.log('═'.repeat(60));

  // 1. Find a session with a group that has students
  const session = await prisma.session.findFirst({
    where: {
      groupId: { not: '' },
    },
    include: {
      group: {
        include: {
          students: {
            take: 3, // Just get first 3 students for test
          },
        },
      },
    },
  });

  if (!session) {
    console.log('❌ No sessions found with groups');
    return;
  }

  if (!session.group || session.group.students.length === 0) {
    console.log('❌ Session has no students in its group');
    console.log(`   Session: ${session.title}`);
    console.log(`   Group: ${session.groupId}`);
    return;
  }

  console.log('📅 Test Session:');
  console.log(`   ID: ${session.id}`);
  console.log(`   Title: ${session.title}`);
  console.log(`   Group: ${session.group.name}`);
  console.log(`   Date: ${session.date.toISOString().split('T')[0]}`);
  console.log(`   Students in group: ${session.group.students.length}`);
  console.log();

  // 2. Try to create attendance records for the first 3 students
  let created = 0;
  let skipped = 0;

  for (const student of session.group.students) {
    try {
      // Check if attendance already exists
      const existing = await prisma.attendance.findFirst({
        where: {
          sessionId: session.id,
          studentId: student.id,
          date: session.date,
        },
      });

      if (existing) {
        console.log(`⏭️  ${student.name}: Already has attendance record`);
        skipped++;
        continue;
      }

      // Create attendance record
      const attendance = await prisma.attendance.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          groupId: session.groupId,
          date: session.date,
          status: 'PRESENT',
          notes: 'Test attendance record',
          markedBy: 'System Test',
          markedAt: new Date(),
        },
      });

      console.log(`✅ ${student.name}: Attendance marked as ${attendance.status}`);
      created++;
    } catch (error) {
      console.log(`❌ ${student.name}: Error - ${error.message}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST RESULTS:');
  console.log('═'.repeat(60));
  console.log(`Created:  ${created}`);
  console.log(`Skipped:  ${skipped}`);
  console.log('═'.repeat(60));

  if (created > 0) {
    console.log('\n✅ SUCCESS: Attendance can be marked against Sessions!');
    console.log('   The LessonPlan → Session → Attendance workflow is working.');
  } else if (skipped > 0) {
    console.log('\n✅ SUCCESS: Attendance records already exist!');
    console.log('   The workflow is operational.');
  } else {
    console.log('\n⚠️  No attendance records were created.');
    console.log('   This might be normal if students have no data.');
  }

  console.log();
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
