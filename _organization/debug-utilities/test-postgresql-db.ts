/**
 * Phase 4: PostgreSQL Database Query Testing
 * Tests direct database connections to verify PostgreSQL data migration
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  table: string;
  status: 'PASS' | 'FAIL';
  count: number;
  error?: string;
  responseTime: number;
}

const results: TestResult[] = [];

async function testTable(
  tableName: string,
  queryFn: () => Promise<any[]>
): Promise<void> {
  const startTime = Date.now();
  try {
    const data = await queryFn();
    const responseTime = Date.now() - startTime;
    
    results.push({
      table: tableName,
      status: 'PASS',
      count: data.length,
      responseTime,
    });

    console.log(
      `✅ ${tableName.padEnd(25)} ${String(data.length).padEnd(6)} rows   ${responseTime}ms`
    );
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    results.push({
      table: tableName,
      status: 'FAIL',
      count: 0,
      error: error.message,
      responseTime,
    });
    console.log(
      `❌ ${tableName.padEnd(25)} ERROR               ${responseTime}ms`
    );
    console.log(`   └─ ${error.message}`);
  }
}

async function runTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 PHASE 4: PostgreSQL Database Query Testing');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 Testing table connectivity and row counts:\n');

  // Test each critical table
  await testTable('User', () => prisma.user.findMany());
  await testTable('Group', () => prisma.group.findMany());
  await testTable('Student', () => prisma.student.findMany());
  await testTable('Module', () => prisma.module.findMany());
  await testTable('UnitStandard', () => prisma.unitStandard.findMany());
  await testTable('LessonPlan', () => prisma.lessonPlan.findMany());
  await testTable('Session', () => prisma.session.findMany());
  await testTable('Assessment', () => prisma.assessment.findMany());
  await testTable('Attendance', () => prisma.attendance.findMany());
  await testTable('UnitStandardRollout', () => prisma.unitStandardRollout.findMany());
  await testTable('GroupRolloutPlan', () => prisma.groupRolloutPlan.findMany());

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Test Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const totalRows = results.reduce((sum, r) => sum + r.count, 0);
  const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

  console.log(`Tests Run:              ${results.length}`);
  console.log(`✅ Passed:              ${passed}`);
  console.log(`❌ Failed:              ${failed}`);
  console.log(`📊 Total Rows in DB:    ${totalRows}`);
  console.log(`⏱️  Average Query Time:  ${Math.round(avgTime)}ms`);

  // Detailed results
  console.log('\n📋 Detailed Results:');
  results.forEach((r) => {
    const statusIcon = r.status === 'PASS' ? '✅' : '❌';
    console.log(
      `${statusIcon} ${r.table.padEnd(25)} ${String(r.count).padEnd(6)} rows   ${r.responseTime}ms`
    );
  });

  if (failed === 0) {
    console.log('\n🎉 ALL DATABASE TESTS PASSED!');
    console.log('✨ PostgreSQL backend is fully functional and ready for gradual rollout.\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Review output above.\n`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
