#!/usr/bin/env node

/**
 * Comprehensive Assessment Verification
 * 
 * Analyzes 3,315 assessments for 46 students (72 per student avg)
 * to determine if this is legitimate data or indicates duplicates/errors.
 * 
 * Normal range: 10-30 assessments per student
 * Current: 72 per student (2.4x - 7.2x higher than normal)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 COMPREHENSIVE ASSESSMENT VERIFICATION\n');
  console.log('═'.repeat(70));
  console.log('Expected: 10-30 per student');
  console.log('Actual:   72 per student (3,315 ÷ 46)');
  console.log('Status:   ⚠️  2.4x - 7.2x ABOVE normal range');
  console.log('═'.repeat(70) + '\n');

  // ============================================================================
  // 1. BASIC COUNTS
  // ============================================================================
  const totalAssessments = await prisma.assessment.count();
  const totalStudents = await prisma.student.count();
  const totalUnitStandards = await prisma.unitStandard.count();

  console.log('📊 BASIC COUNTS');
  console.log('─'.repeat(70));
  console.log(`Total Assessments:    ${totalAssessments.toLocaleString()}`);
  console.log(`Total Students:       ${totalStudents}`);
  console.log(`Total Unit Standards: ${totalUnitStandards}`);
  console.log(`Average per student:  ${(totalAssessments / totalStudents).toFixed(1)}`);
  console.log(`Expected if 1 per US: ${totalStudents * totalUnitStandards}`);
  console.log();

  // ============================================================================
  // 2. BREAKDOWN BY TYPE AND RESULT
  // ============================================================================
  console.log('📋 BREAKDOWN BY TYPE AND RESULT');
  console.log('─'.repeat(70));

  const byType = await prisma.assessment.groupBy({
    by: ['type'],
    _count: { id: true },
  });

  console.log('By Type:');
  byType.forEach(({ type, _count }) => {
    const pct = (((_count.id / totalAssessments) * 100).toFixed(1));
    console.log(`  ${type.padEnd(20)} ${_count.id.toString().padStart(6)} (${pct}%)`);
  });

  const byResult = await prisma.assessment.groupBy({
    by: ['result'],
    _count: { id: true },
  });

  console.log('\nBy Result:');
  byResult.forEach(({ result, _count }) => {
    const pct = (((_count.id / totalAssessments) * 100).toFixed(1));
    console.log(`  ${result.padEnd(20)} ${_count.id.toString().padStart(6)} (${pct}%)`);
  });

  // ============================================================================
  // 3. PER-STUDENT DISTRIBUTION
  // ============================================================================
  console.log('\n📈 PER-STUDENT DISTRIBUTION');
  console.log('─'.repeat(70));

  const perStudent = await prisma.student.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      studentId: true,
      _count: {
        select: {
          assessments: true,
        },
      },
    },
    orderBy: {
      assessments: {
        _count: 'desc',
      },
    },
  });

  // Statistics
  const counts = perStudent.map(s => s._count.assessments);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const median = counts.sort((a, b) => a - b)[Math.floor(counts.length / 2)];

  console.log('Statistics:');
  console.log(`  Minimum:  ${min} assessments`);
  console.log(`  Maximum:  ${max} assessments`);
  console.log(`  Average:  ${avg.toFixed(1)} assessments`);
  console.log(`  Median:   ${median} assessments`);

  // Distribution
  const ranges = [
    { label: '0-10', min: 0, max: 10 },
    { label: '11-30', min: 11, max: 30 },
    { label: '31-50', min: 31, max: 50 },
    { label: '51-70', min: 51, max: 70 },
    { label: '71-100', min: 71, max: 100 },
    { label: '100+', min: 101, max: Infinity },
  ];

  console.log('\nDistribution:');
  ranges.forEach(({ label, min, max }) => {
    const count = counts.filter(c => c >= min && c <= max).length;
    const pct = ((count / totalStudents) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(count / 2));
    console.log(`  ${label.padEnd(10)} ${count.toString().padStart(3)} students (${pct}%) ${bar}`);
  });

  // Top 10 students
  console.log('\nTop 10 Students by Assessment Count:');
  perStudent.slice(0, 10).forEach((student, idx) => {
    const name = `${student.firstName} ${student.lastName}`;
    console.log(`  ${(idx + 1).toString().padStart(2)}. ${name.padEnd(30)} ${student._count.assessments} assessments`);
  });

  // ============================================================================
  // 4. CHECK FOR EXACT DUPLICATES
  // ============================================================================
  console.log('\n🔍 EXACT DUPLICATE CHECK');
  console.log('─'.repeat(70));
  console.log('(Same student, unit standard, type, and date)\n');

  // We need to check for duplicates by querying all assessments and grouping them
  const assessments = await prisma.assessment.findMany({
    select: {
      studentId: true,
      unitStandardId: true,
      type: true,
      assessedDate: true,
    },
  });

  // Group by key
  const duplicateMap = new Map();
  assessments.forEach(a => {
    const dateStr = a.assessedDate ? a.assessedDate.toISOString().split('T')[0] : 'NULL';
    const key = `${a.studentId}|${a.unitStandardId}|${a.type}|${dateStr}`;
    duplicateMap.set(key, (duplicateMap.get(key) || 0) + 1);
  });

  // Find duplicates
  const duplicates = Array.from(duplicateMap.entries())
    .filter(([key, count]) => count > 1)
    .map(([key, count]) => {
      const [studentId, unitStandardId, type, date] = key.split('|');
      return { studentId, unitStandardId, type, date, count };
    })
    .sort((a, b) => b.count - a.count);

  if (duplicates.length === 0) {
    console.log('✅ No exact duplicates found');
  } else {
    console.log(`⚠️  Found ${duplicates.length} sets of exact duplicates\n`);
    console.log('Top 10 Duplicate Groups:');
    duplicates.slice(0, 10).forEach((dup, idx) => {
      console.log(`  ${(idx + 1).toString().padStart(2)}. ${dup.count}x duplicates - ${dup.type} on ${dup.date}`);
    });

    const totalDuplicateRecords = duplicates.reduce((sum, d) => sum + d.count, 0);
    const uniqueRecords = duplicates.length;
    const extraRecords = totalDuplicateRecords - uniqueRecords;
    console.log(`\n  Total duplicate records: ${totalDuplicateRecords}`);
    console.log(`  Unique records:          ${uniqueRecords}`);
    console.log(`  Extra (removable):       ${extraRecords}`);
    console.log(`  If removed, total would be: ${totalAssessments - extraRecords}`);
  }

  // ============================================================================
  // 5. MULTIPLE ATTEMPTS PER UNIT STANDARD
  // ============================================================================
  console.log('\n📝 MULTIPLE ATTEMPTS PER UNIT STANDARD');
  console.log('─'.repeat(70));

  const multipleAttempts = await prisma.assessment.groupBy({
    by: ['studentId', 'unitStandardId'],
    _count: { id: true },
    having: {
      id: {
        _count: {
          gt: 2,
        },
      },
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 20,
  });

  if (multipleAttempts.length === 0) {
    console.log('✅ No unit standards with more than 2 attempts');
  } else {
    console.log(`Found ${multipleAttempts.length} student/unit combinations with 3+ attempts\n`);
    console.log('Top 20 (most attempts):');

    for (const attempt of multipleAttempts.slice(0, 20)) {
      const student = await prisma.student.findUnique({
        where: { id: attempt.studentId },
        select: { firstName: true, lastName: true },
      });
      const unitStandard = await prisma.unitStandard.findUnique({
        where: { id: attempt.unitStandardId },
        select: { code: true },
      });

      const name = `${student.firstName} ${student.lastName}`;
      console.log(`  ${name.padEnd(30)} US ${unitStandard.code.padEnd(10)} ${attempt._count.id} attempts`);
    }

    // Calculate if this explains the high count
    const totalMultipleAttempts = await prisma.assessment.count({
      where: {
        studentId: {
          in: multipleAttempts.map(m => m.studentId),
        },
        unitStandardId: {
          in: multipleAttempts.map(m => m.unitStandardId),
        },
      },
    });
    console.log(`\n  Total assessments from multiple attempts: ${totalMultipleAttempts}`);
  }

  // ============================================================================
  // 6. TIMELINE ANALYSIS
  // ============================================================================
  console.log('\n📅 TIMELINE ANALYSIS');
  console.log('─'.repeat(70));

  const assessmentsByDate = await prisma.assessment.groupBy({
    by: ['assessedDate'],
    _count: { id: true },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 10,
  });

  console.log('Top 10 Dates by Assessment Count:');
  assessmentsByDate.forEach((day, idx) => {
    const date = day.assessedDate ? day.assessedDate.toISOString().split('T')[0] : 'NULL';
    console.log(`  ${(idx + 1).toString().padStart(2)}. ${date}  ${day._count.id} assessments`);
  });

  // Check for clustering (same day, many assessments)
  const highVolumeDays = assessmentsByDate.filter(d => d._count.id > 100);
  if (highVolumeDays.length > 0) {
    console.log(`\n⚠️  Found ${highVolumeDays.length} days with 100+ assessments (possible bulk import)`);
  }

  // ============================================================================
  // 7. DATA QUALITY CHECKS
  // ============================================================================
  console.log('\n🔧 DATA QUALITY CHECKS');
  console.log('─'.repeat(70));

  // Check for missing data
  const missingScore = await prisma.assessment.count({
    where: { score: null },
  });
  const missingResult = await prisma.assessment.count({
    where: { result: null },
  });
  const missingDate = await prisma.assessment.count({
    where: { assessedDate: null },
  });

  console.log('Missing Data:');
  console.log(`  Missing score:  ${missingScore}`);
  console.log(`  Missing result: ${missingResult}`);
  console.log(`  Missing date:   ${missingDate}`);

  // Check for anomalies
  const futureDate = await prisma.assessment.count({
    where: {
      assessedDate: {
        gt: new Date(),
      },
    },
  });

  const veryOldDate = await prisma.assessment.count({
    where: {
      assessedDate: {
        lt: new Date('2020-01-01'),
      },
    },
  });

  console.log('\nDate Anomalies:');
  console.log(`  Future dates:    ${futureDate}`);
  console.log(`  Before 2020:     ${veryOldDate}`);

  // ============================================================================
  // 8. VERDICT
  // ============================================================================
  console.log('\n' + '═'.repeat(70));
  console.log('🎯 VERDICT');
  console.log('═'.repeat(70));

  const avgPerStudent = totalAssessments / totalStudents;
  const duplicateCount = duplicates.length;
  const extraDuplicates = duplicates.reduce((sum, d) => sum + (d.count - 1), 0);

  console.log(`\nCurrent State:`);
  console.log(`  Total Assessments:        ${totalAssessments.toLocaleString()}`);
  console.log(`  Average per Student:      ${avgPerStudent.toFixed(1)}`);
  console.log(`  Normal Range:             10-30 per student`);
  console.log(`  Deviation:                ${((avgPerStudent / 20 - 1) * 100).toFixed(0)}% above midpoint`);

  console.log(`\nFindings:`);
  if (duplicateCount > 0) {
    console.log(`  ⚠️  Exact Duplicates:      ${duplicateCount} groups (${extraDuplicates} extra records)`);
  } else {
    console.log(`  ✅ Exact Duplicates:       None found`);
  }

  if (multipleAttempts.length > 0) {
    console.log(`  📊 Multiple Attempts:      ${multipleAttempts.length} students with 3+ attempts per unit`);
  } else {
    console.log(`  ✅ Multiple Attempts:      Within normal range`);
  }

  if (highVolumeDays.length > 0) {
    console.log(`  ⚠️  High Volume Days:      ${highVolumeDays.length} days with 100+ assessments`);
  } else {
    console.log(`  ✅ Timeline Distribution:  Evenly spread`);
  }

  console.log(`\nConclusion:`);
  if (extraDuplicates > totalAssessments * 0.1) {
    console.log(`  ❌ PROBLEM: Significant duplicates detected (${extraDuplicates} extra records)`);
    console.log(`     Recommend running deduplication script`);
    console.log(`     Expected count after cleanup: ~${totalAssessments - extraDuplicates}`);
  } else if (avgPerStudent > 50) {
    console.log(`  ⚠️  WARNING: High assessment count but may be legitimate`);
    console.log(`     Could be extensive formative assessment tracking`);
    console.log(`     Recommend manual review of assessment practices`);
  } else {
    console.log(`  ✅ ACCEPTABLE: Data appears legitimate`);
    console.log(`     Assessment count is within reasonable range`);
  }

  console.log('═'.repeat(70) + '\n');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
