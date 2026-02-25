/**
 * Verify Index Usage with EXPLAIN ANALYZE
 * 
 * Runs critical queries with EXPLAIN ANALYZE to verify that
 * PostgreSQL is using the new indexes for query optimization.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyIndexUsage() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   PostgreSQL Index Usage Verification (EXPLAIN ANALYZE)');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Get a sample group for testing
    const group = await prisma.group.findFirst({ select: { id: true, name: true } });
    if (!group) {
      console.log('⚠️  No groups found in database');
      return;
    }

    console.log(`Testing with group: ${group.name} (${group.id})\n`);

    // Test 1: Assessment query with composite index
    console.log('─────────────────────────────────────────────────────────');
    console.log('Test 1: Assessment Query (Index: studentId, unitStandardId, result)');
    console.log('─────────────────────────────────────────────────────────\n');

    const explainAssessment = await prisma.$queryRawUnsafe<any[]>(`
      EXPLAIN ANALYZE
      SELECT "id", "studentId", "unitStandardId", "result"
      FROM "Assessment"
      WHERE "result" = 'COMPETENT'
      LIMIT 100
    `);

    console.log('Query Plan:');
    explainAssessment.forEach((row: any) => {
      const plan = row['QUERY PLAN'] || row.queryplan || '';
      console.log(`  ${plan}`);
    });

    const hasIndexScan = explainAssessment.some((row: any) => {
      const plan = (row['QUERY PLAN'] || row.queryplan || '').toLowerCase();
      return plan.includes('index scan') || plan.includes('index only scan');
    });

    if (hasIndexScan) {
      console.log('\n✅ Using index scan (optimized)');
    } else {
      console.log('\n⚠️  Using sequential scan (not optimized)');
    }

    // Test 2: Attendance query with composite index
    console.log('\n─────────────────────────────────────────────────────────');
    console.log('Test 2: Attendance Query (Index: studentId, status, date)');
    console.log('─────────────────────────────────────────────────────────\n');

    const student = await prisma.student.findFirst({ select: { id: true } });
    if (student) {
      const explainAttendance = await prisma.$queryRawUnsafe<any[]>(`
        EXPLAIN ANALYZE
        SELECT "id", "studentId", "status", "date"
        FROM "Attendance"
        WHERE "studentId" = '${student.id}'
        AND "status" IN ('PRESENT', 'LATE')
        ORDER BY "date" DESC
        LIMIT 50
      `);

      console.log('Query Plan:');
      explainAttendance.forEach((row: any) => {
        const plan = row['QUERY PLAN'] || row.queryplan || '';
        console.log(`  ${plan}`);
      });

      const hasIndexScan2 = explainAttendance.some((row: any) => {
        const plan = (row['QUERY PLAN'] || row.queryplan || '').toLowerCase();
        return plan.includes('index scan') || plan.includes('index only scan');
      });

      if (hasIndexScan2) {
        console.log('\n✅ Using index scan (optimized)');
      } else {
        console.log('\n⚠️  Using sequential scan (not optimized)');
      }
    }

    // Test 3: List all indexes on Assessment table
    console.log('\n─────────────────────────────────────────────────────────');
    console.log('Test 3: Verify Indexes Exist on Assessment Table');
    console.log('─────────────────────────────────────────────────────────\n');

    const indexes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'Assessment'
      AND schemaname = 'public'
      ORDER BY indexname
    `);

    console.log('Indexes on Assessment table:');
    indexes.forEach((idx: any) => {
      console.log(`  • ${idx.indexname}`);
      if (idx.indexdef) {
        console.log(`    ${idx.indexdef.substring(0, 100)}...`);
      }
    });

    // Check for our new indexes
    const hasNewIndexes = indexes.some((idx: any) =>
      idx.indexname.includes('studentId_unitStandardId_result') ||
      idx.indexname.includes('result_assessedDate')
    );

    if (hasNewIndexes) {
      console.log('\n✅ New performance indexes found');
    } else {
      console.log('\n⚠️  New indexes not found - may need to run migration');
    }

    // Test 4: List indexes on Attendance table
    console.log('\n─────────────────────────────────────────────────────────');
    console.log('Test 4: Verify Indexes Exist on Attendance Table');
    console.log('─────────────────────────────────────────────────────────\n');

    const attendanceIndexes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'Attendance'
      AND schemaname = 'public'
      ORDER BY indexname
    `);

    console.log('Indexes on Attendance table:');
    attendanceIndexes.forEach((idx: any) => {
      console.log(`  • ${idx.indexname}`);
    });

    const hasAttendanceIndex = attendanceIndexes.some((idx: any) =>
      idx.indexname.includes('studentId_status_date')
    );

    if (hasAttendanceIndex) {
      console.log('\n✅ New attendance index found');
    } else {
      console.log('\n⚠️  New attendance index not found');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('   Verification Complete');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

verifyIndexUsage()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
