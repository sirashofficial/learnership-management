/**
 * PHASE 2: SQLite to PostgreSQL Data Migration
 * Reads from SQLite, transforms data types, handles foreign keys
 * Inserts into PostgreSQL with transaction rollback per table
 * Logs migration progress and validates data integrity
 */

import Database from 'better-sqlite3';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQLITE_PATH = path.join(__dirname, '../prisma/dev.db');
const LOG_DIR = path.join(__dirname, '../logs');
const TIMESTAMP = Math.floor(Date.now() / 1000);
const LOG_FILE = path.join(LOG_DIR, `migration-progress-${TIMESTAMP}.log`);

interface MigrationStats {
  tableName: string;
  sourceCount: number;
  insertedCount: number;
  failedCount: number;
  duration: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

let logStream: fs.WriteStream;

function log(message: string) {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] ${message}`;
  console.log(formatted);
  logStream.write(formatted + '\n');
}

interface Row {
  [key: string]: any;
}

/**
 * Transform SQLite data types to PostgreSQL compatible values
 */
function transformValue(value: any, fieldType: string): any {
  if (value === null || value === undefined) {
    return null;
  }

  // Boolean: SQLite stores as 0/1
  if (fieldType.includes('Boolean') || fieldType.includes('BOOLEAN')) {
    return value === 1 || value === true || value === 'true';
  }

  // DateTime: SQLite stores as ISO string or timestamps, PostgreSQL expects ISO string
  if (fieldType.includes('DateTime') || fieldType.includes('DATETIME')) {
    if (!value) return null;
    
    // Handle numeric timestamps (milliseconds)
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    
    // Handle string timestamps
    if (typeof value === 'string') {
      // Check if it's a numeric string (timestamp)
      if (/^\d+$/.test(value.trim())) {
        const num = parseInt(value, 10);
        return new Date(num).toISOString();
      }
      // Otherwise treat as ISO string
      return new Date(value).toISOString();
    }
    
    return new Date(value).toISOString();
  }

  // JSON: Already handled by SQLite, validate for PostgreSQL
  if (fieldType.includes('Json') || fieldType.includes('JSON')) {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }

  // Int, String, etc - pass through
  return value;
}

/**
 * Get column definitions from SQLite schema
 */
function getColumnDefinitions(db: any, tableName: string): Map<string, string> {
  const columns = new Map<string, string>();
  try {
    const info = db.prepare(`PRAGMA table_info([${tableName}])`).all() as any[];
    for (const col of info) {
      columns.set(col.name, col.type);
    }
  } catch (error) {
    log(`  ⚠ Warning: Could not get column info for ${tableName}`);
  }
  return columns;
}

/**
 * Main migration function
 */
async function migrateData() {
  console.log('\n========================================');
  console.log('PHASE 2: DATA MIGRATION');
  console.log('SQLite → PostgreSQL');
  console.log('========================================\n');

  // Setup logging
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

  log('Migration started');
  log(`SQLite source: ${SQLITE_PATH}`);
  log(`PostgreSQL target: ${process.env.DATABASE_URL || 'NO CONNECTION STRING SET'}`);

  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable not set for PostgreSQL');
    log('ERROR: DATABASE_URL not configured');
    process.exit(1);
  }

  const stats: Map<string, MigrationStats> = new Map();
  const startTime = Date.now();

  try {
    // Connect to SQLite (read-only)
    const sqliteDb = new Database(SQLITE_PATH, { readonly: true });
    
    // Connect to PostgreSQL - parse connection string to avoid sslmode conflicts
    const connectionUrl = new URL(process.env.DATABASE_URL || 'postgresql://');
    const pgPool = new Pool({
      host: connectionUrl.hostname,
      port: parseInt(connectionUrl.port || '5432', 10),
      database: connectionUrl.pathname.slice(1),
      user: connectionUrl.username,
      password: connectionUrl.password,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    const pgClient = await pgPool.connect();

    // Get all tables
    const tables = sqliteDb
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      )
      .all() as any[];

    console.log(`Found ${tables.length} tables to migrate\n`);
    log(`Found ${tables.length} tables to migrate`);

    // Disable foreign key constraints during migration
    log('Disabling PostgreSQL foreign key constraints');
    await pgClient.query('SET CONSTRAINTS ALL DEFERRED');

    // Table order: Dependencies first
    const tableOrder = [
      'User',
      'Company',
      'Group',
      'Student',
      'Module',
      'UnitStandard',
      'Plan',
      'LessonPlan',
      'Session',
      'Assessment',
      'Attendance',
      'RolloutPlan',
      'UnitStandardRollout',
      'GroupSchedule',
      'Progress',
      'GroupCourse',
      'GroupRolloutPlan',
      'FacilitatorTask',
      'AuditLog',
      'UndoHistory',
      'ReminderPreference',
    ];

    // Migrate each table
    for (const tableName of tableOrder) {
      const table = tables.find(t => t.name === tableName);
      if (!table) continue;

      const tableStartTime = Date.now();
      const migrationStat: MigrationStats = {
        tableName,
        sourceCount: 0,
        insertedCount: 0,
        failedCount: 0,
        duration: 0,
        status: 'SUCCESS',
      };

      try {
        // Get row count from SQLite
        const countResult = sqliteDb.prepare(`SELECT COUNT(*) as count FROM [${tableName}]`).get() as any;
        const rowCount = countResult?.count || 0;
        migrationStat.sourceCount = rowCount;

        console.log(`\n📦 ${tableName.padEnd(25)} : ${rowCount} rows`);
        log(`Starting migration of ${tableName} (${rowCount} rows)`);

        if (rowCount === 0) {
          console.log(`  → Skipped (empty table)`);
          log(`✅ ${tableName}: Skipped (empty table)`);
          stats.set(tableName, migrationStat);
          continue;
        }

        // Get all rows from SQLite
        const rows = sqliteDb.prepare(`SELECT * FROM [${tableName}]`).all() as Row[];
        const columnDefs = getColumnDefinitions(sqliteDb, tableName);
        
        // Debug: Log column definitions for this table
        if (rowCount > 0) {
          log(`Column definitions for ${tableName}:${Array.from(columnDefs.entries()).map(([col, type]) => `  ${col}: ${type}`).join(', ')}`);
        }

        // Begin transaction for this table
        const tableTransaction = await pgClient.query('BEGIN');

        let insertedCount = 0;
        let failedCount = 0;
        let rowNumber = 0;

        // Insert rows in batches
        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);

          for (const row of batch) {
            try {
              // Transform values
              const columns = Object.keys(row);
              const values = columns.map((col, idx) => {
                const originalValue = row[col];
                const colType = columnDefs.get(col) || '';
                const transformedValue = transformValue(originalValue, colType);
                
                // Debug first row of problematic tables
                if (rowNumber === 0 && (tableName === 'LessonPlan' || tableName === 'Student' || tableName === 'Module')) {
                  log(`  [DEBUG] ${col}<${colType}>: ${originalValue} (${typeof originalValue}) -> ${transformedValue} (${typeof transformedValue})`);
                }
                return transformedValue;
              });

              const columnList = columns.map(col => `"${col}"`).join(', ');
              const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
              const query = `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

              await pgClient.query(query, values);
              insertedCount++;
              rowNumber++;
            } catch (error: any) {
              failedCount++;
              rowNumber++;
              // Log only first error per table
              if (failedCount === 1) {
                log(`  ERROR on row ${rowNumber}: ${error.message}`);
              }
            }
          }

          // Log progress
          const progress = Math.min(i + batchSize, rowCount);
          if ((i / batchSize) % 10 === 0) {
            console.log(`  → Progress: ${progress}/${rowCount} (${Math.round((progress / rowCount) * 100)}%)`);
            log(`${tableName}: Progress ${progress}/${rowCount}`);
          }
        }

        // Commit transaction
        await pgClient.query('COMMIT');

        migrationStat.insertedCount = insertedCount;
        migrationStat.failedCount = failedCount;
        migrationStat.duration = Date.now() - tableStartTime;

        if (failedCount > 0) {
          migrationStat.status = 'PARTIAL';
          console.log(`  ⚠ Partial: ${insertedCount}/${rowCount} (${failedCount} failed)`);
          log(`⚠ ${tableName}: PARTIAL - ${insertedCount} inserted, ${failedCount} failed`);
        } else {
          console.log(`  ✅ Complete: ${insertedCount}/${rowCount}`);
          log(`✅ ${tableName}: SUCCESS - ${insertedCount}/${rowCount}`);
        }

        stats.set(tableName, migrationStat);

      } catch (error: any) {
        migrationStat.status = 'FAILED';
        migrationStat.duration = Date.now() - tableStartTime;
        stats.set(tableName, migrationStat);
        console.error(`  ❌ Failed: ${error.message}`);
        log(`❌ ${tableName}: FAILED - ${error.message}`);
        
        // Attempt rollback
        try {
          await pgClient.query('ROLLBACK');
        } catch {}
      }
    }

    // Re-enable foreign key constraints
    log('Re-enabling PostgreSQL foreign key constraints');
    await pgClient.query('SET CONSTRAINTS ALL IMMEDIATE');

    // Close connections
    pgClient.release();
    await pgPool.end();
    sqliteDb.close();

    // Summary
    const totalDuration = Date.now() - startTime;
    const successCount = Array.from(stats.values()).filter(s => s.status === 'SUCCESS').length;
    const partialCount = Array.from(stats.values()).filter(s => s.status === 'PARTIAL').length;
    const failedCount = Array.from(stats.values()).filter(s => s.status === 'FAILED').length;
    const totalInserted = Array.from(stats.values()).reduce((sum, s) => sum + s.insertedCount, 0);
    const totalSource = Array.from(stats.values()).reduce((sum, s) => sum + s.sourceCount, 0);

    console.log('\n========================================');
    console.log('MIGRATION SUMMARY');
    console.log('========================================\n');
    console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`Tables: ${successCount} ✅ | ${partialCount} ⚠ | ${failedCount} ❌`);
    console.log(`Records: ${totalInserted}/${totalSource} inserted\n`);

    log(`\nMigration completed in ${(totalDuration / 1000).toFixed(2)}s`);
    log(`Summary: ${successCount} successful, ${partialCount} partial, ${failedCount} failed`);
    log(`Total records inserted: ${totalInserted}/${totalSource}`);

    // Write stats to JSON
    const statsPath = path.join(LOG_DIR, `migration-stats-${TIMESTAMP}.json`);
    const statsObj = {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: totalDuration,
      summary: { successCount, partialCount, failedCount, totalInserted, totalSource },
      tables: Array.from(stats.entries()).map(([name, stat]) => ({ name, ...stat })),
    };
    fs.writeFileSync(statsPath, JSON.stringify(statsObj, null, 2));

    console.log(`
Log file: ${LOG_FILE}
Stats file: ${statsPath}

Next Steps:
  1. Review log file for any errors
  2. Run: npx ts-node scripts/verify-row-counts.ts --postgres
  3. Compare row counts with pre-migration baseline
  4. Run: npx ts-node scripts/verify-data-sampling.ts
  5. If all checks pass, proceed to Phase 3
`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    log(`CRITICAL ERROR: ${error}`);
    process.exit(1);
  } finally {
    logStream.end();
  }
}

migrateData();
