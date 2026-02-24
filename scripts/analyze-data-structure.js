const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeDataStructure() {
  console.log('='.repeat(80));
  console.log('REAL DATA ANALYSIS');
  console.log('='.repeat(80));
  console.log();

  // Basic counts
  const counts = {
    students: await prisma.student.count(),
    groups: await prisma.group.count(),
    assessments: await prisma.assessment.count(),
    attendance: await prisma.attendance.count(),
    sessions: await prisma.session.count(),
    unitStandards: await prisma.unitStandard.count(),
    modules: await prisma.module.count(),
    lessonPlans: await prisma.lessonPlan.count(),
    unitStandardRollouts: await prisma.unitStandardRollout.count(),
  };

  console.log('📊 DATABASE TOTALS:');
  Object.entries(counts).forEach(([key, value]) => {
    console.log(`   ${key.padEnd(25)}: ${value.toLocaleString()}`);
  });
  console.log();

  // Group analysis
  const groups = await prisma.group.findMany({
    include: {
      _count: {
        select: {
          students: true,
          sessions: true,
          unitStandardRollouts: true,
        },
      },
    },
  });

  console.log('👥 GROUP BREAKDOWN:');
  groups.forEach(g => {
    console.log(`   ${g.name}`);
    console.log(`      Students: ${g._count.students}`);
    console.log(`      Sessions: ${g._count.sessions}`);
    console.log(`      Rollouts: ${g._count.unitStandardRollouts}`);
  });
  console.log();

  // Student status distribution
  const studentsByStatus = await prisma.student.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('📈 STUDENT STATUS:');
  studentsByStatus.forEach(s => {
    console.log(`   ${s.status}: ${s._count}`);
  });
  console.log();

  // Assessment breakdown
  const assessmentsByType = await prisma.assessment.groupBy({
    by: ['type', 'result'],
    _count: true,
  });

  console.log('📝 ASSESSMENT DISTRIBUTION:');
  const byType = {};
  assessmentsByType.forEach(a => {
    if (!byType[a.type]) byType[a.type] = {};
    byType[a.type][a.result || 'PENDING'] = a._count;
  });
  
  Object.entries(byType).forEach(([type, results]) => {
    console.log(`   ${type}:`);
    Object.entries(results).forEach(([result, count]) => {
      console.log(`      ${result}: ${count}`);
    });
  });
  console.log();

  // Attendance stats
  const attendanceByStatus = await prisma.attendance.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('✓ ATTENDANCE RECORDS:');
  attendanceByStatus.forEach(a => {
    console.log(`   ${a.status}: ${a._count}`);
  });
  console.log();

  // Data relationships
  const sampleStudent = await prisma.student.findFirst({
    include: {
      group: true,
      assessments: { take: 1 },
      attendance: { take: 1 },
      _count: {
        select: {
          assessments: true,
          attendance: true,
        },
      },
    },
  });

  if (sampleStudent) {
    console.log('🔗 SAMPLE DATA RELATIONSHIPS:');
    console.log(`   Student: ${sampleStudent.firstName} ${sampleStudent.lastName}`);
    console.log(`   Group: ${sampleStudent.group?.name}`);
    console.log(`   Total Assessments: ${sampleStudent._count.assessments}`);
    console.log(`   Total Attendance: ${sampleStudent._count.attendance}`);
    console.log(`   Credits Earned: ${sampleStudent.totalCreditsEarned}`);
    console.log(`   Progress: ${sampleStudent.progress}%`);
  }
  console.log();

  console.log('='.repeat(80));

  await prisma.$disconnect();
}

analyzeDataStructure().catch(console.error);
