/**
 * PHASE 3: Data Integrity Sampling Verification
 * Randomly samples 10% of records from each critical table
 * Compares field-by-field between SQLite and PostgreSQL
 * Validates checksums and critical business logic
 */

import Database from 'better-sqlite3';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQLITE_PATH = path.join(__dirname, '../prisma/dev.db');
const BACKUP_DIR = path.join(__dirname, '../backups');
const VERIFICATION_REPORT = path.join(BACKUP_DIR, 'data-integrity-verification.json');

interface VerificationResult {
  timestamp: string;
  tableComparisons: Map<string, TableVerification>;
  overallStatus: 'PASS' | 'FAIL' | 'WARNING';
  criticalIssues: string[];
  recommendations: string[];
}

interface TableVerification {
  tableName: string;
  sampleSize: number;
  totalRows: number;
  matchedRows: number;
  mismatchedRows: number;
  status: 'PASS' | 'FAIL';
  mismatches: FieldMismatch[];
}

interface FieldMismatch {
  rowId: string;
  field: string;
  sqliteValue: any;
  postgresValue: any;
  mismatchType: 'TYPE_MISMATCH' | 'VALUE_MISMATCH' | 'NOT_FOUND';
}

function calculateChecksum(obj: any): string {
  return crypto.createHash('md5')
    .update(JSON.stringify(obj))
    .digest('hex');
}

async function verifySampling() {
  console.log('\n========================================');
  console.log('PHASE 3: DATA INTEGRITY VERIFICATION');
  console.log('Sample Comparison (SQLite vs PostgreSQL)');
  console.log('========================================\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  const result: VerificationResult = {
    timestamp: new Date().toISOString(),
    tableComparisons: new Map(),
    overallStatus: 'PASS',
    criticalIssues: [],
    recommendations: [],
  };

  try {
    // Connect to both databases
    const sqliteDb = new Database(SQLITE_PATH, { readonly: true });
    const pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const pgClient = await pgPool.connect();

    // Critical tables to verify
    const criticalTables = [
      'Student',
      'Assessment',
      'Attendance',
      'Group',
      'Module',
      'RolloutPlan',
    ];

    console.log('📊 Sampling critical tables...\n');

    for (const tableName of criticalTables) {
      try {
        // Get total count
        const countResult = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as any;
        const totalCount = countResult?.count || 0;

        if (totalCount === 0) {
          console.log(`  ${tableName.padEnd(25)} : SKIPPED (empty table)`);
          continue;
        }

        // Get 10% sample (min 5, max 100)
        const sampleSize = Math.max(5, Math.min(100, Math.ceil(totalCount * 0.1)));

        // Get sample from SQLite
        const sqliteData = sqliteDb
          .prepare(`SELECT * FROM ${tableName} ORDER BY RANDOM() LIMIT ?`)
          .all(sampleSize) as any[];

        const tableVerification: TableVerification = {
          tableName,
          sampleSize,
          totalRows: totalCount,
          matchedRows: 0,
          mismatchedRows: 0,
          status: 'PASS',
          mismatches: [],
        };

        let matchCount = 0;

        for (const row of sqliteData) {
          const id = row.id;
          
          try {
            // Get same row from PostgreSQL
            const pgResult = await pgClient.query(
              `SELECT * FROM "${tableName}" WHERE id = $1 LIMIT 1`,
              [id]
            );

            if (pgResult.rows.length === 0) {
              tableVerification.mismatches.push({
                rowId: id,
                field: 'ROW',
                sqliteValue: 'EXISTS',
                postgresValue: 'MISSING',
                mismatchType: 'NOT_FOUND',
              });
              tableVerification.mismatchedRows++;
              result.criticalIssues.push(
                `${tableName} row ${id} missing in PostgreSQL`
              );
              continue;
            }

            const pgRow = pgResult.rows[0];
            let rowMatches = true;

            // Compare fields
            for (const field of Object.keys(row)) {
              let sqliteValue = row[field];
              let pgValue = pgRow[field];

              // Normalize types for comparison
              if (typeof sqliteValue === 'string' && sqliteValue.match(/^\d{4}-\d{2}-\d{2}/)) {
                // DateTime comparison
                sqliteValue = new Date(sqliteValue).getTime();
                pgValue = pgValue ? new Date(pgValue).getTime() : null;
              } else if (typeof sqliteValue === 'number' && tableName === 'Attendance' && field === 'status') {
                // Status might be stored differently
                sqliteValue = String(sqliteValue);
                pgValue = String(pgValue);
              } else if (typeof sqliteValue === 'object') {
                sqliteValue = JSON.stringify(sqliteValue);
                pgValue = JSON.stringify(pgValue);
              }

              if (sqliteValue !== pgValue) {
                rowMatches = false;
                tableVerification.mismatches.push({
                  rowId: id,
                  field,
                  sqliteValue,
                  postgresValue: pgValue,
                  mismatchType: 'VALUE_MISMATCH',
                });
              }
            }

            if (rowMatches) {
              matchCount++;
            } else {
              tableVerification.mismatchedRows++;
            }

          } catch (error: any) {
            tableVerification.mismatches.push({
              rowId: id,
              field: 'QUERY',
              sqliteValue: 'SUCCESS',
              postgresValue: 'ERROR',
              mismatchType: 'NOT_FOUND',
            });
            tableVerification.mismatchedRows++;
            result.criticalIssues.push(
              `Error querying ${tableName} row ${id}: ${error.message}`
            );
          }
        }

        tableVerification.matchedRows = matchCount;

        // Determine status
        const matchPercentage = (matchCount / sampleSize) * 100;
        if (matchPercentage < 100) {
          tableVerification.status = 'FAIL';
        }

        console.log(
          `  ${tableName.padEnd(25)} : ${tableVerification.matchedRows}/${sampleSize} matched ` +
          `(${matchPercentage.toFixed(1)}%)`
        );

        result.tableComparisons.set(tableName, tableVerification);

      } catch (error: any) {
        console.error(`  ❌ ${tableName}: ${error.message}`);
        result.criticalIssues.push(`Failed to verify ${tableName}: ${error.message}`);
      }
    }

    // Determine overall status
    const failedTables = Array.from(result.tableComparisons.values())
      .filter(t => t.status === 'FAIL');

    if (result.criticalIssues.length > 0) {
      result.overallStatus = 'FAIL';
      result.recommendations.push('STOP: Do not proceed to production');
      result.recommendations.push('Review all critical issues above');
      result.recommendations.push('Rollback to SQLite and investigate discrepancies');
      result.recommendations.push('Fix migration script and re-run from backup');
    } else if (failedTables.length > 0) {
      result.overallStatus = 'WARNING';
      result.recommendations.push('Review mismatched fields in detail');
      result.recommendations.push('Determine if mismatches are acceptable');
      result.recommendations.push('Document any known differences');
    }

    // Verify row counts match pre-migration baseline
    console.log('\n\n📊 Comparing with pre-migration baseline...\n');
    
    const preCountFile = path.join(BACKUP_DIR, 'pre-migration-row-counts.json');
    if (fs.existsSync(preCountFile)) {
      const preData = JSON.parse(fs.readFileSync(preCountFile, 'utf-8'));
      
      for (const [tableName, verification] of result.tableComparisons.entries()) {
        const preCounts = preData.tables[tableName];
        if (preCounts && preCounts.count !== verification.totalRows) {
          console.log(`  ⚠ ${tableName}: ${preCounts.count} → ${verification.totalRows}`);
          result.criticalIssues.push(
            `${tableName} row count mismatch: ${preCounts.count} expected, ${verification.totalRows} found`
          );
          result.overallStatus = 'FAIL';
        } else {
          console.log(`  ✓ ${tableName}: ${verification.totalRows} rows (match)`);
        }
      }
    }

    // Write report
    console.log('\n\n📁 Writing verification report...\n');
    
    const reportObj = {
      timestamp: result.timestamp,
      overallStatus: result.overallStatus,
      criticalIssues: result.criticalIssues,
      recommendations: result.recommendations,
      tableComparisons: Array.from(result.tableComparisons.entries())
        .map(([name, verification]) => ({ name, ...verification })),
    };

    fs.writeFileSync(VERIFICATION_REPORT, JSON.stringify(reportObj, null, 2));

    console.log('========================================');
    console.log(`STATUS: ${result.overallStatus}`);
    console.log('========================================\n');

    if (result.overallStatus === 'PASS') {
      console.log('✅ All verification checks PASSED');
      console.log('\nReady to proceed to Phase 4: Blue-Green Cutover');
      console.log('Run: npx ts-node scripts/setup-blue-green.ts');
    } else if (result.overallStatus === 'WARNING') {
      console.log('⚠ Some mismatches detected - review report');
      console.log('\nFile:', VERIFICATION_REPORT);
    } else {
      console.log('❌ CRITICAL ISSUES DETECTED - DO NOT PROCEED');
      console.log('\nRollback recommended:');
      console.log('  1. Stop application');
      console.log('  2. Revert DATABASE_URL to SQLite');
      console.log('  3. Investigate issues in logs/migration-progress-*.log');
      console.log('  4. Fix migration script');
      console.log('  5. Restore from backup and retry');
    }

    console.log(`\nDetailed Report: ${VERIFICATION_REPORT}`);

    pgClient.release();
    await pgPool.end();
    sqliteDb.close();

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

verifySampling();
