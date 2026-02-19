const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyDashboardData() {
  console.log('=== DASHBOARD DATA VERIFICATION ===\n');

  // Active Groups
  const activeGroups = await prisma.group.count({
    where: { status: 'Active' }
  });
  console.log(`✅ Active Groups: ${activeGroups}`);

  // Total Students
  const totalStudents = await prisma.student.count({
    where: { status: 'Active' }
  });
  console.log(`✅ Total Students: ${totalStudents}`);

  // Pending Assessments
  const pendingAssessments = await prisma.assessment.count({
    where: {
      result: null,
      dueDate: { gte: new Date() }
    }
  });
  console.log(`✅ Pending Assessments: ${pendingAssessments}`);

  // At-risk students (progress < 50%)
  const allStudents = await prisma.student.findMany({
    where: { status: 'Active' },
    select: { progress: true }
  });
  const atRiskCount = allStudents.filter(s => (s.progress || 0) < 50).length;
  console.log(`✅ At-Risk Students: ${atRiskCount}`);

  // Average progress
  const totalProgress = allStudents.reduce((sum, s) => sum + (s.progress || 0), 0);
  const avgProgress = allStudents.length > 0 ? totalProgress / allStudents.length : 0;
  console.log(`✅ Average Progress: ${avgProgress.toFixed(1)}%`);

  // Recent attendance (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentAttendance = await prisma.attendance.count({
    where: { date: { gte: thirtyDaysAgo } }
  });
  console.log(`✅ Recent Attendance Records: ${recentAttendance}`);

  // Students in groups
  const studentsInGroups = await prisma.student.findMany({
    where: { status: 'Active', progress: { lt: 100 } },
    include: { group: true },
    take: 5
  });
  console.log(`\n📊 Sample Students with Groups:`);
  studentsInGroups.forEach(s => {
    console.log(`  - ${s.firstName} ${s.lastName}: ${s.progress}% (Group: ${s.group?.name || 'None'})`);
  });

  await prisma.$disconnect();
}

verifyDashboardData();
