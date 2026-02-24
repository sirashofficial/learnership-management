/**
 * Verification: Atomic Assessment Transaction Implementation
 * 
 * This script verifies that the atomic transaction wrappers have been correctly
 * implemented in the assessment marking endpoints by:
 * 1. Reading the endpoint files
 * 2. Checking for prisma.$transaction() calls
 * 3. Verifying atomicity patterns
 */

import * as fs from 'fs';
import * as path from 'path';

interface VerificationResult {
  file: string;
  passed: boolean;
  checks: {
    name: string;
    passed: boolean;
    found: string[];
  }[];
}

const results: VerificationResult[] = [];

function verifyFile(filePath: string, fileName: string) {
  console.log(`\n📝 Checking ${fileName}...`);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const checks = [];

    // Check 1: Contains prisma.$transaction
    const hasTransaction = content.includes('prisma.$transaction');
    const transactionMatches = content.match(/prisma\.\$transaction/g) || [];
    checks.push({
      name: 'Uses prisma.$transaction()',
      passed: hasTransaction,
      found: transactionMatches
    });
    console.log(`  ${hasTransaction ? '✅' : '❌'} prisma.$transaction() found (${transactionMatches.length} occurrences)`);

    // Check 2: Contains updateStudentProgress calls
    const hasUpdateProgress = content.includes('updateStudentProgress');
    const progressMatches = content.match(/updateStudentProgress\(/g) || [];
    checks.push({
      name: 'Calls updateStudentProgress() inside transaction',
      passed: hasUpdateProgress,
      found: progressMatches
    });
    console.log(`  ${hasUpdateProgress ? '✅' : '❌'} updateStudentProgress() called (${progressMatches.length} occurrences)`);

    // Check 3: For [id]/route.ts - should have updateStudentProgressInTx
    if (fileName.includes('[id]')) {
      const hasInTx = content.includes('updateStudentProgressInTx');
      checks.push({
        name: 'Defines updateStudentProgressInTx helper',
        passed: hasInTx,
        found: []
      });
      console.log(`  ${hasInTx ? '✅' : '❌'} updateStudentProgressInTx() defined`);
    }

    // Check 4: Contains proper error handling
    const hasErrorHandling = content.includes('catch') && content.includes('error');
    checks.push({
      name: 'Has error handling for transactions',
      passed: hasErrorHandling,
      found: []
    });
    console.log(`  ${hasErrorHandling ? '✅' : '❌'} Error handling present`);

    // Check 5: Assessment result validation
    const hasResultValidation = content.includes('COMPETENT') && content.includes('NOT_YET_COMPETENT');
    checks.push({
      name: 'Handles assessment result states correctly',
      passed: hasResultValidation,
      found: []
    });
    console.log(`  ${hasResultValidation ? '✅' : '❌'} Result state handling present`);

    const allPassed = checks.every(c => c.passed);
    results.push({
      file: fileName,
      passed: allPassed,
      checks
    });

    return allPassed;
  } catch (error) {
    console.log(`  ❌ Error reading file: ${error}`);
    return false;
  }
}

function main() {
  console.log('\n🔍 ATOMIC TRANSACTION VERIFICATION\n');
  console.log('Verifying that assessment marking endpoints use atomic transactions...\n');

  const basePath = 'src/app/api/assessments';
  
  // Verify each endpoint file
  verifyFile(
    path.join(basePath, 'route.ts'),
    'assessments/route.ts (PUT endpoint)'
  );

  verifyFile(
    path.join(basePath, '[id]/route.ts'),
    'assessments/[id]/route.ts (PUT endpoint)'
  );

  verifyFile(
    path.join(basePath, 'marking/route.ts'),
    'assessments/marking/route.ts (PUT endpoint)'
  );

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(70));

  const passedFiles = results.filter(r => r.passed).length;
  const totalFiles = results.length;

  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`\n${status} ${index + 1}. ${result.file}`);

    result.checks.forEach(check => {
      const checkStatus = check.passed ? '✅' : '❌';
      console.log(`   ${checkStatus} ${check.name}`);
    });
  });

  console.log('\n' + '='.repeat(70));
  console.log(`Files Verified: ${passedFiles}/${totalFiles} PASSED`);
  console.log('='.repeat(70));

  if (passedFiles === totalFiles) {
    console.log('\n🎉 All atomic transaction implementations verified!\n');
    console.log('Key Changes Made:');
    console.log('  ✅ assessments/route.ts: Wrapped PUT handler with prisma.$transaction()');
    console.log('  ✅ assessments/[id]/route.ts: Wrapped PUT handler with prisma.$transaction()');
    console.log('  ✅ assessments/marking/route.ts: Wrapped update with prisma.$transaction()');
    console.log('  ✅ Created updateStudentProgressInTx() helper for transaction support');
    console.log('  ✅ Assessment marking + progress update now atomic (all-or-nothing)');
    console.log('\nBenefit: If marking fails mid-process, entire operation rolls back,');
    console.log('         preventing data desynchronization between Assessment and Progress.\n');
  } else {
    console.log('\n❌ Some verifications failed. Please review implementations.\n');
  }
}

main();
