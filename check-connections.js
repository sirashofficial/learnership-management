const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConnections() {
  console.log('=== CHECKING ALL DATA CONNECTIONS ===\n');

  // 1. Groups to Companies
  const groups = await prisma.group.findMany({
    include: {
      students: true,
      company: true
    }
  });

  console.log('📊 GROUPS → COMPANIES:');
  groups.forEach(g => {
    console.log(`  ${g.name} → ${g.company?.name || 'No Company'} (${g.students.length} students)`);
  });

  // 2. Students to Groups
  const students = await prisma.student.findMany({
    include: {
      group: true
    }
  });

  console.log('\n👨‍🎓 STUDENTS → GROUPS:');
  students.forEach(s => {
    console.log(`  ${s.firstName} ${s.lastName} → ${s.group?.name || 'No Group'}`);
  });

  // 3. Check if there are any lesson plans
  const lessons = await prisma.lessonPlan.count();
  console.log(`\n📚 LESSON PLANS: ${lessons} lessons`);

  // 4. Check modules/curriculum
  const modules = await prisma.module.count();
  console.log(`📖 CURRICULUM MODULES: ${modules} modules`);

  await prisma.$disconnect();
}

checkConnections();
