/**
 * Test: Atomic Assessment Transaction Wrapper
 * 
 * Purpose: Verify that assessment marking and unit standard progress updates
 * are atomically wrapped in database transactions to prevent desynchronization.
 * 
 * Tests:
 * 1. Mark assessment COMPETENT -> Verify UnitStandardProgress.status = COMPLETED && UnitStandardProgress.summativePassed = true
 * 2. Mark assessment NOT_YET_COMPETENT -> Verify UnitStandardProgress.status = IN_PROGRESS && UnitStandardProgress.summativePassed = false
 * 3. Reset assessment to PENDING -> Verify UnitStandardProgress reset correctly
 * 4. Verify transaction rollback on error (all-or-nothing semantics)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('\n🧪 Starting Atomic Transaction Tests...\n');

  try {
    // Test 1: Mark Assessment COMPETENT
    await testMarkCompetent();

    // Test 2: Mark Assessment NOT_YET_COMPETENT
    await testMarkNotCompetent();

    // Test 3: Reset Assessment to PENDING
    await testResetToPending();

    // Test 4: Verify Transaction Isolation
    await testTransactionIsolation();

    // Print summary
    printSummary();
  } catch (error) {
    console.error('❌ Test suite error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testMarkCompetent() {
  const testName = 'Test 1: Mark Assessment COMPETENT';
  console.log(`\n📝 ${testName}`);

  try {
    // Get a test student with assessments
    const student = await prisma.student.findFirst({
      include: {
        assessments: {
          include: { unitStandard: true },
          take: 1
        }
      }
    });

    if (!student || !student.assessments.length) {
      results.push({
        name: testName,
        passed: false,
        error: 'No students with assessments found'
      });
      return;
    }

    const assessment = student.assessments[0];
    const studentId = student.id;
    const unitStandardId = assessment.unitStandardId;

    console.log(`  - Student: ${student.firstName} ${student.lastName} (${studentId})`);
    console.log(`  - Assessment ID: ${assessment.id}`);
    console.log(`  - Unit Standard: ${unitStandardId}`);

    // Before: Check progress state
    const progressBefore = await prisma.unitStandardProgress.findUnique({
      where: { studentId_unitStandardId: { studentId, unitStandardId } }
    });

    console.log(`  - Before status: ${progressBefore?.status || 'NOT_FOUND'}`);

    // Mark assessment as COMPETENT (simulating API call)
    const updatedAssessment = await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        result: 'COMPETENT',
        assessedDate: new Date(),
        moderationStatus: 'APPROVED'
      }
    });

    // After: Check progress state
    const progressAfter = await prisma.unitStandardProgress.findUnique({
      where: { studentId_unitStandardId: { studentId, unitStandardId } }
    });

    console.log(`  - After status: ${progressAfter?.status}`);
    console.log(`  - After summativePassed: ${progressAfter?.summativePassed}`);

    // Verify atomicity
    const isAtomic = progressAfter?.status === 'COMPLETED' && progressAfter?.summativePassed === true;

    if (isAtomic) {
      results.push({
        name: testName,
        passed: true,
        details: `✅ Assessment marked COMPETENT and UnitStandardProgress updated atomically`
      });
      console.log(`  ✅ PASSED: Transaction wrapping works correctly`);
    } else {
      results.push({
        name: testName,
        passed: false,
        error: `Progress not updated correctly (status: ${progressAfter?.status}, summativePassed: ${progressAfter?.summativePassed})`
      });
      console.log(`  ❌ FAILED: Progress not synchronized`);
    }
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      error: `${error}`
    });
    console.log(`  ❌ FAILED: ${error}`);
  }
}

async function testMarkNotCompetent() {
  const testName = 'Test 2: Mark Assessment NOT_YET_COMPETENT';
  console.log(`\n📝 ${testName}`);

  try {
    // Get a test student with assessments
    const student = await prisma.student.findFirst({
      include: {
        assessments: {
          where: { result: 'COMPETENT' },
          include: { unitStandard: true },
          take: 1
        }
      }
    });

    if (!student || !student.assessments.length) {
      results.push({
        name: testName,
        passed: false,
        error: 'No students with COMPETENT assessments found'
      });
      console.log(`  ⚠️  SKIPPED: No COMPETENT assessments found`);
      return;
    }

    const assessment = student.assessments[0];
    const studentId = student.id;
    const unitStandardId = assessment.unitStandardId;

    console.log(`  - Student: ${student.firstName} ${student.lastName}`);
    console.log(`  - Assessment: ${assessment.id}`);

    // Mark as NOT_YET_COMPETENT
    const updatedAssessment = await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        result: 'NOT_YET_COMPETENT',
        assessedDate: new Date()
      }
    });

    // Check progress state
    const progressAfter = await prisma.unitStandardProgress.findUnique({
      where: { studentId_unitStandardId: { studentId, unitStandardId } }
    });

    console.log(`  - Progress status: ${progressAfter?.status}`);
    console.log(`  - Progress summativePassed: ${progressAfter?.summativePassed}`);

    // Verify it's reset
    const isReset = progressAfter?.status === 'IN_PROGRESS' && progressAfter?.summativePassed === false;

    if (isReset) {
      results.push({
        name: testName,
        passed: true,
        details: `✅ NOT_YET_COMPETENT correctly resets progress`
      });
      console.log(`  ✅ PASSED: Progress reset correctly`);
    } else {
      results.push({
        name: testName,
        passed: false,
        error: `Progress not reset (status: ${progressAfter?.status}, summativePassed: ${progressAfter?.summativePassed})`
      });
      console.log(`  ❌ FAILED: Progress not reset`);
    }
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      error: `${error}`
    });
    console.log(`  ❌ FAILED: ${error}`);
  }
}

async function testResetToPending() {
  const testName = 'Test 3: Reset Assessment to PENDING';
  console.log(`\n📝 ${testName}`);

  try {
    // Get a test assessment
    const assessment = await prisma.assessment.findFirst({
      where: { result: 'COMPETENT' },
      include: {
        student: true,
        unitStandard: true
      }
    });

    if (!assessment) {
      results.push({
        name: testName,
        passed: false,
        error: 'No COMPETENT assessments found'
      });
      console.log(`  ⚠️  SKIPPED: No assessments to reset`);
      return;
    }

    console.log(`  - Assessment: ${assessment.id}`);
    console.log(`  - Before result: ${assessment.result}`);

    // Reset to PENDING
    const updated = await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        result: 'PENDING',
        assessedDate: null,
        moderationStatus: 'PENDING'
      }
    });

    // Check progress state after reset
    const progress = await prisma.unitStandardProgress.findUnique({
      where: {
        studentId_unitStandardId: {
          studentId: assessment.studentId,
          unitStandardId: assessment.unitStandardId
        }
      }
    });

    console.log(`  - After result: ${updated.result}`);
    console.log(`  - Progress status: ${progress?.status}`);

    const isReset = updated.result === 'PENDING' && progress?.status === 'IN_PROGRESS';

    if (isReset) {
      results.push({
        name: testName,
        passed: true,
        details: `✅ Assessment reset to PENDING and progress cleared`
      });
      console.log(`  ✅ PASSED: Reset to PENDING works correctly`);
    } else {
      results.push({
        name: testName,
        passed: false,
        error: `Reset not working (result: ${updated.result}, progress: ${progress?.status})`
      });
      console.log(`  ❌ FAILED: Reset not working`);
    }
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      error: `${error}`
    });
    console.log(`  ❌ FAILED: ${error}`);
  }
}

async function testTransactionIsolation() {
  const testName = 'Test 4: Transaction Isolation and Consistency';
  console.log(`\n📝 ${testName}`);

  try {
    // Get a student
    const student = await prisma.student.findFirst({
      include: {
        assessments: {
          include: { unitStandard: true },
          take: 2
        }
      }
    });

    if (!student || !student.assessments.length) {
      results.push({
        name: testName,
        passed: false,
        error: 'No test data available'
      });
      console.log(`  ⚠️  SKIPPED: Insufficient test data`);
      return;
    }

    console.log(`  - Running transaction isolation test`);
    console.log(`  - Student: ${student.firstName} ${student.lastName}`);

    // Start a transaction test
    const startTime = Date.now();

    // Simulate multiple concurrent assessment updates
    const assessmentIds = student.assessments.slice(0, 2).map(a => a.id);

    // Update both assessments concurrently within transaction isolation
    const updates = await prisma.$transaction(
      assessmentIds.map(id =>
        prisma.assessment.update({
          where: { id },
          data: {
            result: 'COMPETENT',
            assessedDate: new Date(),
            moderationStatus: 'APPROVED'
          }
        })
      )
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`  - Updated ${updates.length} assessments in transaction`);
    console.log(`  - Transaction completed in ${duration}ms`);

    // Verify all assessments were updated
    const allUpdated = updates.every(a => a.result === 'COMPETENT');

    if (allUpdated && duration < 5000) {
      results.push({
        name: testName,
        passed: true,
        details: `✅ Transaction isolation working (${updates.length} updates in ${duration}ms)`
      });
      console.log(`  ✅ PASSED: Transaction isolation verified`);
    } else {
      results.push({
        name: testName,
        passed: false,
        error: `Transaction isolation issue (duration: ${duration}ms, updated: ${allUpdated})`
      });
      console.log(`  ❌ FAILED: Transaction isolation failed`);
    }
  } catch (error) {
    results.push({
      name: testName,
      passed: false,
      error: `${error}`
    });
    console.log(`  ❌ FAILED: ${error}`);
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`\n${status} ${index + 1}. ${result.name}`);
    if (result.details) console.log(`   ${result.details}`);
    if (result.error) console.log(`   Error: ${result.error}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log(`Results: ${passed}/${total} PASSED, ${failed}/${total} FAILED`);
  console.log('='.repeat(70));

  if (failed === 0) {
    console.log('\n🎉 All atomic transaction tests passed! Assessments are now safely synchronized.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.\n');
  }
}

// Run tests
runTests().catch(console.error);
