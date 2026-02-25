/**
 * BACKUP VERIFICATION AND TESTING SCRIPT
 * 
 * Features:
 * - Verify backup file integrity
 * - Test restore to temporary database (dry-run)
 * - Validate row counts and checksums
 * - Compare backup data with live database
 * - Generate verification reports
 * 
 * Usage:
 *   npx ts-node scripts/verify-backups.ts              # Verify all backups
 *   npx ts-node scripts/verify-backups.ts --latest     # Verify latest backup only
 *   npx ts-node scripts/verify-backups.ts --full-test  # Full restore test on temp DB
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const BACKUP_DIR = path.join(process.cwd(), 'backups', 'postgresql');
const REPORT_DIR = path.join(process.cwd(), 'logs', 'backup-verification');

interface BackupMetadata {
  filename: string;
  timestamp: string;
  type: 'daily' | 'monthly';
  size: number;
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
  databaseName: string;
  rowCounts?: Record<string, number>;
  duration: number;
  success: boolean;
  error?: string;
}

interface VerificationResult {
  filename: string;
  fileExists: boolean;
  checksumValid: boolean;
  metadataValid: boolean;
  sizeValid: boolean;
  ageHours: number;
  status: 'PASS' | 'FAIL' | 'WARNING';
  issues: string[];
}

interface VerificationReport {
  timestamp: string;
  totalBackups: number;
  passed: number;
  failed: number;
  warnings: number;
  results: VerificationResult[];
  recommendations: string[];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function calculateChecksum(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// ============================================
// VERIFICATION FUNCTIONS
// ============================================

function verifyBackup(metadata: BackupMetadata): VerificationResult {
  const result: VerificationResult = {
    filename: metadata.filename,
    fileExists: false,
    checksumValid: false,
    metadataValid: false,
    sizeValid: false,
    ageHours: 0,
    status: 'PASS',
    issues: [],
  };

  // Check 1: File exists
  const backupPath = path.join(BACKUP_DIR, metadata.filename);
  result.fileExists = fs.existsSync(backupPath);
  
  if (!result.fileExists) {
    result.status = 'FAIL';
    result.issues.push('Backup file not found on disk');
    return result;
  }

  // Check 2: File size matches
  const actualSize = fs.statSync(backupPath).size;
  const sizeDifference = Math.abs(actualSize - metadata.size);
  const sizeTolerancePercent = 1; // Allow 1% difference
  
  result.sizeValid = sizeDifference < (metadata.size * sizeTolerancePercent / 100);
  
  if (!result.sizeValid) {
    result.status = 'WARNING';
    result.issues.push(
      `Size mismatch: expected ${metadata.size}, found ${actualSize} (diff: ${sizeDifference} bytes)`
    );
  }

  // Check 3: Checksum validation
  try {
    const actualChecksum = calculateChecksum(backupPath);
    result.checksumValid = actualChecksum === metadata.checksum;
    
    if (!result.checksumValid) {
      result.status = 'FAIL';
      result.issues.push('Checksum validation failed - backup may be corrupted');
    }
  } catch (error: any) {
    result.status = 'FAIL';
    result.issues.push(`Checksum calculation failed: ${error.message}`);
  }

  // Check 4: Metadata validation
  result.metadataValid = Boolean(
    metadata.timestamp &&
    metadata.type &&
    metadata.checksum &&
    metadata.databaseName
  );

  if (!result.metadataValid) {
    result.status = 'WARNING';
    result.issues.push('Incomplete metadata');
  }

  // Check 5: Backup age
  const backupTime = new Date(metadata.timestamp);
  result.ageHours = (Date.now() - backupTime.getTime()) / (1000 * 60 * 60);

  // Daily backups should not be older than 25 hours
  if (metadata.type === 'daily' && result.ageHours > 25) {
    result.status = result.status === 'FAIL' ? 'FAIL' : 'WARNING';
    result.issues.push(`Backup is ${result.ageHours.toFixed(1)} hours old (expected < 25 hours)`);
  }

  return result;
}

async function verifyAllBackups(latestOnly: boolean = false): Promise<VerificationReport> {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     BACKUP VERIFICATION AND TESTING                    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const indexPath = path.join(BACKUP_DIR, 'backup-index.json');

  if (!fs.existsSync(indexPath)) {
    console.error('❌ No backup index found');
    process.exit(1);
  }

  const index: BackupMetadata[] = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  
  let backupsToVerify = index.filter(b => b.success);

  if (latestOnly) {
    backupsToVerify = backupsToVerify
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 1);
  }

  console.log(`📋 Verifying ${backupsToVerify.length} backup(s)...\n`);

  const results: VerificationResult[] = [];
  let passed = 0;
  let failed = 0;
  let warnings = 0;

  for (const backup of backupsToVerify) {
    console.log(`\n🔍 Verifying: ${backup.filename}`);
    console.log(`   Created: ${new Date(backup.timestamp).toLocaleString()}`);
    console.log(`   Type: ${backup.type}`);
    console.log(`   Size: ${(backup.size / 1024 / 1024).toFixed(2)} MB`);

    const result = verifyBackup(backup);
    results.push(result);

    // Print result
    if (result.status === 'PASS') {
      console.log('   Status: ✅ PASS');
      passed++;
    } else if (result.status === 'WARNING') {
      console.log('   Status: ⚠️  WARNING');
      warnings++;
    } else {
      console.log('   Status: ❌ FAIL');
      failed++;
    }

    if (result.issues.length > 0) {
      console.log('   Issues:');
      result.issues.forEach(issue => console.log(`     - ${issue}`));
    }
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (failed > 0) {
    recommendations.push('CRITICAL: Some backups failed verification. Investigate immediately.');
    recommendations.push('Create a new backup immediately: npx ts-node scripts/backup-automated.ts');
  }

  if (warnings > 0) {
    recommendations.push('Some backups have warnings. Review issues and consider creating new backups.');
  }

  const oldestBackup = backupsToVerify.reduce((oldest, current) => 
    new Date(current.timestamp) < new Date(oldest.timestamp) ? current : oldest
  );

  const newestBackup = backupsToVerify.reduce((newest, current) => 
    new Date(current.timestamp) > new Date(newest.timestamp) ? current : newest
  );

  const newestBackupAge = (Date.now() - new Date(newestBackup.timestamp).getTime()) / (1000 * 60 * 60);

  if (newestBackupAge > 25) {
    recommendations.push(`Latest backup is ${newestBackupAge.toFixed(1)} hours old. Create new backup.`);
  }

  const report: VerificationReport = {
    timestamp: new Date().toISOString(),
    totalBackups: backupsToVerify.length,
    passed,
    failed,
    warnings,
    results,
    recommendations,
  };

  // Save report
  ensureDirectoryExists(REPORT_DIR);
  const reportPath = path.join(
    REPORT_DIR,
    `verification-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     VERIFICATION SUMMARY                               ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`Total backups verified: ${backupsToVerify.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\nOldest backup: ${new Date(oldestBackup.timestamp).toLocaleString()}`);
  console.log(`Newest backup: ${new Date(newestBackup.timestamp).toLocaleString()}`);
  console.log(`Latest backup age: ${newestBackupAge.toFixed(1)} hours`);

  if (recommendations.length > 0) {
    console.log('\n📌 Recommendations:');
    recommendations.forEach(rec => console.log(`   • ${rec}`));
  }

  console.log(`\n📄 Report saved: ${reportPath}\n`);

  return report;
}

// ============================================
// FULL RESTORE TEST
// ============================================

async function performFullRestoreTest(backupFilename?: string): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     FULL RESTORE TEST (DRY RUN)                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Find latest backup if not specified
  if (!backupFilename) {
    const indexPath = path.join(BACKUP_DIR, 'backup-index.json');
    const index: BackupMetadata[] = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    
    const latestBackup = index
      .filter(b => b.success)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    if (!latestBackup) {
      console.error('❌ No backups found');
      return;
    }

    backupFilename = latestBackup.filename;
  }

  console.log(`🧪 Testing restore of: ${backupFilename}\n`);
  console.log('⚠️  This is a DRY RUN - no actual changes will be made\n');

  try {
    // Import restore function
    const { performRestore } = await import('./restore-database');

    // Perform dry-run restore
    await performRestore(backupFilename, { dryRun: true });

    console.log('\n✅ Dry run completed successfully');
    console.log('   The backup file is valid and can be restored');
  } catch (error: any) {
    console.error('\n❌ Dry run failed:', error.message);
    console.error('   This backup may be corrupted or incompatible');
    throw error;
  }
}

// ============================================
// ROW COUNT COMPARISON
// ============================================

async function compareWithLiveDatabase(): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     BACKUP VS LIVE DATABASE COMPARISON                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Get latest backup metadata
  const indexPath = path.join(BACKUP_DIR, 'backup-index.json');
  const index: BackupMetadata[] = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  
  const latestBackup = index
    .filter(b => b.success && b.rowCounts)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  if (!latestBackup || !latestBackup.rowCounts) {
    console.error('❌ No backup with row counts found');
    return;
  }

  console.log(`📊 Latest backup: ${new Date(latestBackup.timestamp).toLocaleString()}`);
  console.log(`   Age: ${((Date.now() - new Date(latestBackup.timestamp).getTime()) / (1000 * 60 * 60)).toFixed(1)} hours\n`);

  // Get current database row counts
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const currentCounts: Record<string, number> = {
      users: await prisma.user.count(),
      groups: await prisma.group.count(),
      students: await prisma.student.count(),
      modules: await prisma.module.count(),
      lessonPlans: await prisma.lessonPlan.count(),
      sessions: await prisma.session.count(),
      assessments: await prisma.assessment.count(),
      attendance: await prisma.attendance.count(),
      unitStandardRollouts: await prisma.unitStandardRollout.count(),
    };

    console.log('─'.repeat(60));
    console.log('TABLE'.padEnd(25) + 'BACKUP'.padEnd(15) + 'CURRENT'.padEnd(15) + 'DIFF');
    console.log('─'.repeat(60));

    let totalDiff = 0;

    for (const table in latestBackup.rowCounts) {
      const backupCount = latestBackup.rowCounts[table];
      const currentCount = currentCounts[table] || 0;
      const diff = currentCount - backupCount;
      
      totalDiff += Math.abs(diff);

      const diffStr = diff > 0 ? `+${diff}` : diff.toString();
      const diffDisplay = diff === 0 ? '  ✅' : `  ${diffStr}`;

      console.log(
        table.padEnd(25) +
        backupCount.toString().padEnd(15) +
        currentCount.toString().padEnd(15) +
        diffDisplay
      );
    }

    console.log('─'.repeat(60));
    console.log(`Total difference: ${totalDiff} rows`);

    if (totalDiff === 0) {
      console.log('\n✅ Database and backup are in sync');
    } else {
      const backupAge = (Date.now() - new Date(latestBackup.timestamp).getTime()) / (1000 * 60 * 60);
      console.log(`\nℹ️  ${totalDiff} rows differ from backup`);
      console.log(`   This is expected as backup is ${backupAge.toFixed(1)} hours old`);
      console.log(`   Estimated RPO: ${backupAge.toFixed(1)} hours of data`);
    }

  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// COMMAND LINE INTERFACE
// ============================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: npx ts-node scripts/verify-backups.ts [options]');
    console.log('\nOptions:');
    console.log('  --latest         Verify latest backup only');
    console.log('  --full-test      Perform full restore test (dry-run)');
    console.log('  --compare        Compare backup with live database');
    console.log('  --help, -h       Show this help message');
    console.log('\nExamples:');
    console.log('  npx ts-node scripts/verify-backups.ts');
    console.log('  npx ts-node scripts/verify-backups.ts --latest');
    console.log('  npx ts-node scripts/verify-backups.ts --full-test');
    console.log('  npx ts-node scripts/verify-backups.ts --compare');
    return;
  }

  const latestOnly = args.includes('--latest');
  const fullTest = args.includes('--full-test');
  const compare = args.includes('--compare');

  if (compare) {
    await compareWithLiveDatabase();
  } else if (fullTest) {
    await performFullRestoreTest();
  } else {
    const report = await verifyAllBackups(latestOnly);

    // Exit with error code if verification failed
    if (report.failed > 0) {
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for use in other modules
export { verifyAllBackups, performFullRestoreTest, compareWithLiveDatabase };
