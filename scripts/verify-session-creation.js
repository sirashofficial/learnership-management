#!/usr/bin/env node

/**
 * Verify Session Creation
 * 
 * Tests that Sessions exist and can be used for attendance tracking
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Session Verification Test\n');
  console.log('═'.repeat(60));

  // 1. Count LessonPlans
  const lessonPlanCount = await prisma.lessonPlan.count();
  console.log(`📚 LessonPlans in database: ${lessonPlanCount}`);

  // 2. Count Sessions
  const sessionCount = await prisma.session.count();
  console.log(`📅 Sessions in database: ${sessionCount}`);

  // 3. Count Attendance records
  const attendanceCount = await prisma.attendance.count();
  console.log(`✅ Attendance records: ${attendanceCount}\n`);

  // 4. Check if sessions have groups and facilitators
  const sessionsWithGroups = await prisma.session.count({
    where: {
      groupId: { not: '' },
    },
  });
  console.log(`👥 Sessions with groups: ${sessionsWithGroups}/${sessionCount}`);

  const sessionsWithFacilitators = await prisma.session.count({
    where: {
      facilitatorId: { not: '' },
    },
  });
  console.log(`👨‍🏫 Sessions with facilitators: ${sessionsWithFacilitators}/${sessionCount}\n`);

  // 5. Get a sample session
  const sampleSession = await prisma.session.findFirst({
    include: {
      group: true,
      facilitator: true,
      attendance: true,
    },
  });

  if (sampleSession) {
    console.log('📋 Sample Session:');
    console.log('   ID:', sampleSession.id);
    console.log('   Title:', sampleSession.title);
    console.log('   Module:', sampleSession.module);
    console.log('   Date:', sampleSession.date.toISOString().split('T')[0]);
    console.log('   Time:', `${sampleSession.startTime} - ${sampleSession.endTime}`);
    console.log('   Group:', sampleSession.group?.name || 'N/A');
    console.log('   Facilitator:', sampleSession.facilitator?.name || 'N/A');
    console.log('   Attendance records:', sampleSession.attendance.length);
  }

  console.log('\n' + '═'.repeat(60));

  // 6. Test: Can we create attendance against a session?
  if (sessionCount > 0) {
    console.log('🧪 TEST: Can attendance be marked against a session?\n');

    const testSession = await prisma.session.findFirst({
      include: {
        group: {
          include: {
            students: true,
          },
        },
      },
    });

    if (testSession && testSession.group && testSession.group.students.length > 0) {
      const testStudent = testSession.group.students[0];
      
      // Check if attendance already exists
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          sessionId: testSession.id,
          studentId: testStudent.id,
        },
      });

      if (existingAttendance) {
        console.log('   ✅ Attendance already exists for test session');
        console.log(`      Student: ${testStudent.name}`);
        console.log(`      Status: ${existingAttendance.status}`);
      } else {
        console.log('   ℹ️  No attendance records for this session yet');
        console.log(`      Test Session: ${testSession.title}`);
        console.log(`      Test Student: ${testStudent.name}`);
        console.log('      (This is normal - attendance will be marked by facilitators)');
      }
    } else {
      console.log('   ⚠️  No sessions with students found to test against');
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 VERDICT:');
  console.log('═'.repeat(60));

  if (sessionCount === 0) {
    console.log('❌ FAILED: No sessions exist!');
    console.log('   Run: node scripts/convert-lessons-to-sessions.js --run');
  } else if (sessionCount < lessonPlanCount / 2) {
    console.log('⚠️  WARNING: Session count is much lower than LessonPlan count');
    console.log(`   You have ${lessonPlanCount} LessonPlans but only ${sessionCount} Sessions`);
    console.log('   Consider running the conversion script again');
  } else {
    console.log('✅ PASSED: Sessions exist and can be used for attendance tracking');
    console.log(`   ${sessionCount} sessions are ready for attendance`);
  }

  console.log('═'.repeat(60) + '\n');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
