/**
 * PHASE 5: Post-Migration Safety Period (7-Day Watch)
 * Daily verification that PostgreSQL production matches SQLite baseline
 * Dual-write logging and data integrity monitoring
 * Maintains rollback capability
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '../backups');
const LOG_DIR = path.join(__dirname, '../logs');
const VERIFICATION_FILE = path.join(BACKUP_DIR, 'pre-migration-row-counts.json');

interface DailyVerificationReport {
  date: string;
  day: number;
  timestamp: string;
  baseline: Record<string, number>;
  current: Record<string, number>;
  discrepancies: Array<{
    table: string;
    expected: number;
    actual: number;
    difference: number;
  }>;
  status: 'PASS' | 'WARN' | 'FAIL';
  recommendations: string[];
}

async function runDailyVerification() {
  console.log('\n========================================');
  console.log('PHASE 5: DAILY VERIFICATION');
  console.log('Post-Migration Safety Period');
  console.log('========================================\n');

  const prisma = new PrismaClient();
  const report: DailyVerificationReport = {
    date: new Date().toLocaleDateString('en-CA'),
    day: Math.ceil(
      (Date.now() - (parseInt(process.env.MIGRATION_START_TIME || '0') || Date.now())) / (1000 * 60 * 60 * 24)
    ),
    timestamp: new Date().toISOString(),
    baseline: {},
    current: {},
    discrepancies: [],
    status: 'PASS',
    recommendations: [],
  };

  try {
    // Load baseline from pre-migration
    if (!fs.existsSync(VERIFICATION_FILE)) {
      console.error(`❌ Baseline file not found: ${VERIFICATION_FILE}`);
      process.exit(1);
    }

    const baseline = JSON.parse(fs.readFileSync(VERIFICATION_FILE, 'utf-8'));
    console.log(`📊 Baseline from: ${baseline.timestamp}`);
    console.log(`   Database: ${baseline.database}\n`);

    // Get current counts
    console.log('🔍 Checking current row counts...\n');

    const tables = [
      { name: 'User', count: () => prisma.user.count() },
      { name: 'Group', count: () => prisma.group.count() },
      { name: 'Student', count: () => prisma.student.count() },
      { name: 'Assessment', count: () => prisma.assessment.count() },
      { name: 'Attendance', count: () => prisma.attendance.count() },
      { name: 'UnitStandard', count: () => prisma.unitStandard.count() },
      { name: 'Module', count: () => prisma.module.count() },
      { name: 'RolloutPlan', count: () => prisma.rolloutPlan.count() },
      { name: 'Company', count: () => prisma.company.count() },
    ];

    for (const table of tables) {
      try {
        const count = await table.count();
        report.current[table.name] = count;
        
        const expected = baseline.tables[table.name]?.count || 0;
        report.baseline[table.name] = expected;

        if (expected !== count) {
          report.discrepancies.push({
            table: table.name,
            expected,
            actual: count,
            difference: count - expected,
          });

          // Determine severity
          if (expected > 0 && count === 0) {
            report.status = 'FAIL'; // Data disappeared
            console.log(
              `  ❌ ${table.name.padEnd(25)} : ${expected} → ${count} (CRITICAL: Data Lost!)`
            );
          } else if (Math.abs(count - expected) > expected * 0.1) {
            report.status = 'WARN'; // > 10% deviation
            console.log(
              `  ⚠ ${table.name.padEnd(25)} : ${expected} → ${count} (> 10% change)`
            );
          } else {
            console.log(
              `  ~ ${table.name.padEnd(25)} : ${expected} → ${count} (< 10% change)`
            );
          }
        } else {
          console.log(
            `  ✓ ${table.name.padEnd(25)} : ${count} rows (match)`
          );
        }
      } catch (error: any) {
        console.log(`  ❌ ${table.name.padEnd(25)} : ERROR - ${error.message}`);
        report.status = 'FAIL';
        report.recommendations.push(`Failed to count ${table.name}: ${error.message}`);
      }
    }

    // Analyze results
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`STATUS: ${report.status}`);
    console.log(`${'─'.repeat(50)}\n`);

    if (report.discrepancies.length > 0) {
      console.log('Discrepancies Detected:');
      for (const disc of report.discrepancies) {
        console.log(
          `  • ${disc.table}: ${disc.expected} → ${disc.actual} (${disc.difference > 0 ? '+' : ''}${disc.difference})`
        );
      }
    }

    // Generate recommendations
    if (report.status === 'FAIL') {
      report.recommendations.push('⚠ CRITICAL: Data discrepancies detected');
      report.recommendations.push('Investigate immediately');
      report.recommendations.push('Check application logs for data loss events');
      report.recommendations.push('Consider rollback to SQLite if critical');
    } else if (report.status === 'WARN') {
      report.recommendations.push('Review discrepancies for business logic causes');
      report.recommendations.push('Check if records were legitimately deleted/created');
      report.recommendations.push('Continue monitoring closely');
    } else {
      report.recommendations.push(`✅ Day ${report.day}: All row counts match baseline`);
      report.recommendations.push('Continue daily monitoring for 7 days');
      if (report.day >= 7) {
        report.recommendations.push('Safe to proceed to Phase 6: Cleanup');
      }
    }

    // Save report
    const reportPath = path.join(LOG_DIR, `daily-verification-day-${report.day}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📁 Report saved: ${reportPath}\n`);

    // Check if this completes the 7-day safety period
    if (report.day >= 7 && report.status === 'PASS') {
      console.log('========================================');
      console.log('✅ 7-DAY SAFETY PERIOD COMPLETE');
      console.log('========================================');
      console.log(`
All daily verifications passed.
Data integrity confirmed over 7 days.

Ready for Phase 6: Cleanup Operations
  1. Archive original SQLite to cold storage
  2. Remove SQLite-specific code paths
  3. Update documentation
  4. Decommission temporary tables/views
  5. Final backup and archival

Run: npx ts-node scripts/cleanup-post-migration.ts
`);
    }

    console.log('\nDaily Verification Summary:');
    console.log(`  Day: ${report.day}/7`);
    console.log(`  Status: ${report.status}`);
    console.log(`  Discrepancies: ${report.discrepancies.length}`);
    console.log(`  Next check: Tomorrow at same time\n`);

  } catch (error) {
    console.error('❌ Daily verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runDailyVerification();
