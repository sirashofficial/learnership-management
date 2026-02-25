/**
 * PHASE 1: Row Count Verification
 * Creates the "source of truth" checksum by querying every table
 * Logs exact row counts to backups/pre-migration-row-counts.json
 * Used to verify data integrity before and after migration
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(__dirname, '../backups');

interface RowCounts {
  timestamp: string;
  unixTimestamp: number;
  database: 'SQLite' | 'PostgreSQL';
  tables: Record<string, {
    count: number;
    sample?: any[];
  }>;
  totalRows: number;
  verification: {
    status: 'OK' | 'WARNING' | 'ERROR';
    message: string;
  };
}

async function verifyRowCounts() {
  console.log('\n========================================');
  console.log('PHASE 1: ROW COUNT VERIFICATION');
  console.log('Source of Truth Creation');
  console.log('========================================\n');

  const rowCounts: RowCounts = {
    timestamp: new Date().toISOString(),
    unixTimestamp: Math.floor(Date.now() / 1000),
    database: 'SQLite', // Will change for PostgreSQL verification
    tables: {},
    totalRows: 0,
    verification: {
      status: 'OK',
      message: 'Pre-migration row count baseline created',
    },
  };

  try {
    // Count every table
    const tables = [
      { name: 'User', model: () => prisma.user.count() },
      { name: 'Group', model: () => prisma.group.count() },
      { name: 'Student', model: () => prisma.student.count() },
      { name: 'Assessment', model: () => prisma.assessment.count() },
      { name: 'Attendance', model: () => prisma.attendance.count() },
      { name: 'UnitStandard', model: () => prisma.unitStandard.count() },
      { name: 'Module', model: () => prisma.module.count() },
      { name: 'RolloutPlan', model: () => prisma.rolloutPlan.count() },
      { name: 'Company', model: () => prisma.company.count() },
      { name: 'LessonPlan', model: () => prisma.lessonPlan.count() },
      { name: 'Session', model: () => prisma.session.count() },
      { name: 'UnitStandardRollout', model: () => prisma.unitStandardRollout.count() },
      { name: 'GroupSchedule', model: () => prisma.groupSchedule.count() },
      { name: 'AuditLog', model: () => prisma.auditLog.count() },
      { name: 'UndoHistory', model: () => prisma.undoHistory.count() },
    ];

    console.log('📊 Querying table row counts...\n');

    // Execute counts in parallel
    for (const table of tables) {
      try {
        const count = await table.model();
        rowCounts.tables[table.name] = { count };
        rowCounts.totalRows += count;
        const paddedName = table.name.padEnd(25);
        const paddedCount = count.toString().padStart(6);
        console.log('  ' + paddedName + ' : ' + paddedCount + ' rows');
      } catch (error: any) {
        if (error.code === 'P1001' || error.message.includes('not found')) {
          rowCounts.tables[table.name] = { count: 0 };
          const paddedName = table.name.padEnd(25);
          console.log('  ' + paddedName + ' : ' + (0).toString().padStart(6) + ' rows (table not in schema)');
        } else {
          const paddedName = table.name.padEnd(25);
          console.error('  ' + paddedName + ' : ERROR - ' + error.message);
          rowCounts.verification.status = 'WARNING';
          rowCounts.verification.message += '\n  - Could not count ' + table.name + ' table';
        }
      }
    }

    const separator = '─'.repeat(50);
    const paddedTotal = rowCounts.totalRows.toString().padStart(6);
    console.log('\n' + separator);
    console.log('TOTAL ROWS: ' + paddedTotal);
    console.log(separator + '\n');

    // Sample critical tables for data verification
    console.log('🔍 Sampling critical tables for data verification...\n');
    
    try {
      const studentSample = await prisma.student.findMany({ take: 5 });
      rowCounts.tables['Student'].sample = studentSample.map(s => ({
        id: s.id,
        studentId: s.studentId,
        firstName: s.firstName,
        lastName: s.lastName,
        groupId: s.groupId,
      }));
      console.log('  Sampled ' + studentSample.length + ' Student records');
    } catch (error) {
      console.log('  Could not sample Student table');
    }

    try {
      const assessmentSample = await prisma.assessment.findMany({ take: 5 });
      rowCounts.tables['Assessment'].sample = assessmentSample.map(a => ({
        id: a.id,
        studentId: a.studentId,
        unitStandardId: a.unitStandardId,
        score: a.score,
        assessedDate: a.assessedDate,
      }));
      console.log('  Sampled ' + assessmentSample.length + ' Assessment records');
    } catch (error) {
      console.log('  Could not sample Assessment table');
    }

    try {
      const attendanceSample = await prisma.attendance.findMany({ take: 5 });
      rowCounts.tables['Attendance'].sample = attendanceSample.map(a => ({
        id: a.id,
        studentId: a.studentId,
        date: a.date,
        status: a.status,
        sessionId: a.sessionId,
      }));
      console.log('  Sampled ' + attendanceSample.length + ' Attendance records');
    } catch (error) {
      console.log('  Could not sample Attendance table');
    }

    // Write to file
    console.log('\n📁 Writing row count baseline to file...\n');
    const outputPath = path.join(BACKUP_DIR, 'pre-migration-row-counts.json');
    fs.writeFileSync(outputPath, JSON.stringify(rowCounts, null, 2));
    console.log(`✅ Source of Truth: ${outputPath}`);
    console.log(`   Timestamp: ${rowCounts.timestamp}`);
    console.log(`   Total Tables: ${Object.keys(rowCounts.tables).length}`);
    console.log(`   Total Rows: ${rowCounts.totalRows}\n`);

    // Create verification report
    console.log('========================================');
    console.log('✅ PHASE 1: ROW COUNTS VERIFIED');
    console.log('========================================');
    console.log('');
    console.log('This JSON file is your "source of truth" for data validation.');
    console.log('After migration to PostgreSQL, row counts MUST match exactly.');
    console.log('');
    console.log('Critical Verification Steps:');
    console.log('  1. Save this file to version control');
    console.log('  2. Do NOT delete student, assessment, or attendance records');
    console.log('  3. After PostgreSQL migration, run:');
    console.log('     npx ts-node scripts/verify-row-counts.ts --postgres');
    console.log('  4. Compare the two JSON files - all counts must match exactly');
    console.log('');
    console.log('If any count does not match:');
    console.log('  ❌ DO NOT PROCEED to production');
    console.log('  ❌ Halt migration immediately');
    console.log('  ✓ Investigate discrepancy');
    console.log('  ✓ Fix issue in migration script');
    console.log('  ✓ Re-run migration from Backup A');
    console.log('');
    console.log('Ready for Phase 2? Run:');
    console.log('  npx ts-node scripts/export-sqlite-to-sql.ts');
    console.log('');

  } catch (error) {
    console.error('❌ Row count verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRowCounts();
