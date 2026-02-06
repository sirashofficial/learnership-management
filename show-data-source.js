const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showDataSource() {
  console.log('=== WHERE THE DATA COMES FROM ===\n');

  // 1. Show the database file location
  console.log('📁 DATA SOURCE:');
  console.log('   File: prisma/dev.db (SQLite database)');
  console.log('   This is where ALL data is stored\n');

  // 2. Show student data with progress
  console.log('📊 STUDENT DATA (with Progress %):\n');
  const students = await prisma.student.findMany({
    include: { group: true },
    orderBy: { progress: 'asc' }
  });

  students.forEach(s => {
    const risk = s.progress < 50 ? '⚠️ AT-RISK' : '✅ OK';
    console.log(`   ${s.firstName} ${s.lastName}:`);
    console.log(`      Progress: ${s.progress}%`);
    console.log(`      Status: ${risk}`);
    console.log(`      Group: ${s.group?.name || 'None'}`);
    console.log('');
  });

  // 3. Show where "at-risk" comes from
  console.log('\n⚠️  AT-RISK CALCULATION:');
  console.log('   Rule: progress < 50%');
  console.log('   This means students below 50% completion\n');

  const atRisk = students.filter(s => s.progress < 50);
  console.log(`   Found ${atRisk.length} at-risk students:`);
  atRisk.forEach(s => {
    console.log(`      - ${s.firstName} ${s.lastName}: ${s.progress}%`);
  });

  // 4. Show assessments
  console.log('\n\n📝 ASSESSMENTS DATA:');
  const assessments = await prisma.assessment.findMany({
    include: { student: true }
  });
  console.log(`   Total: ${assessments.length} assessments`);
  const pending = assessments.filter(a => !a.result && a.dueDate >= new Date());
  console.log(`   Pending (no result yet): ${pending.length}`);
  
  if (pending.length > 0) {
    pending.forEach(a => {
      console.log(`      - ${a.title} (Due: ${a.dueDate.toISOString().split('T')[0]})`);
    });
  }

  // 5. Show where data flows
  console.log('\n\n🔄 DATA FLOW:');
  console.log('   1. Database (dev.db) ← This is the source');
  console.log('   2. ↓ Prisma ORM reads the data');
  console.log('   3. ↓ API routes (/api/dashboard/stats)');
  console.log('   4. ↓ Frontend fetches from API');
  console.log('   5. → Dashboard displays the data');

  console.log('\n\n💡 "REAL-TIME" means:');
  console.log('   Every page refresh = new query to database');
  console.log('   So you always see the latest data!');

  await prisma.$disconnect();
}

showDataSource();
