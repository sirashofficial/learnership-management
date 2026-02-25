/**
 * PHASE 1: BACKUP C - Export SQLite to Plain SQL
 * Generates a complete SQL dump with all INSERT statements
 * Can be used to restore database if PostgreSQL migration fails
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../prisma/dev.db');
const BACKUP_DIR = path.join(__dirname, '../backups');
const OUTPUT_PATH = path.join(BACKUP_DIR, 'sqlite-export-complete.sql');

function escapeSqlString(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'object') {
    return "'" + JSON.stringify(value).replace(/'/g, "''") + "'";
  }
  // String
  return "'" + value.toString().replace(/'/g, "''") + "'";
}

async function exportSqliteToSql() {
  console.log('\n========================================');
  console.log('PHASE 1: BACKUP C - SQLite to SQL Export');
  console.log('========================================\n');

  try {
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`SQLite database not found at ${DB_PATH}`);
    }

    console.log(`📊 Database: ${DB_PATH}`);
    console.log(`📁 Output: ${OUTPUT_PATH}\n`);

    const db = new Database(DB_PATH, { readonly: true });
    let sqlDump = '';
    let totalRecords = 0;

    // Get all tables
    const tablesResult = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      )
      .all() as any[];

    console.log(`📋 Found ${tablesResult.length} tables\n`);

    // Add header
    sqlDump += `-- SQLite Database Export\n`;
    sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
    sqlDump += `-- Database: ${DB_PATH}\n`;
    sqlDump += `-- This is a complete backup. Can be imported into SQLite or PostgreSQL.\n\n`;
    sqlDump += `-- DISABLE FOREIGN KEYS DURING IMPORT:\n`;
    sqlDump += `-- SQLite: PRAGMA foreign_keys = OFF;\n`;
    sqlDump += `-- PostgreSQL: SET CONSTRAINTS ALL DEFERRED;\n\n`;

    // Export each table
    for (const table of tablesResult) {
      const tableName = table.name;
      
      // Get column info
      const columnsResult = db.prepare('PRAGMA table_info("' + tableName + '")').all() as any[];
      const columns = columnsResult.map(col => col.name);
      
      // Get row count
      const countResult = db.prepare('SELECT COUNT(*) as count FROM "' + tableName + '"').get() as any;
      const rowCount = countResult?.count || 0;

      console.log(`  ${tableName.padEnd(30)} : ${rowCount} rows`);

      sqlDump += `\n-- Table: ${tableName}\n`;
      sqlDump += `-- Rows: ${rowCount}\n`;
      sqlDump += `DELETE FROM ${tableName};\n`;

      if (rowCount > 0) {
        const rows = db.prepare('SELECT * FROM "' + tableName + '"').all() as any[];
        
        for (const row of rows) {
          const values = columns.map(col => escapeSqlString(row[col]));
          const columnList = columns.map(col => `"${col}"`).join(', ');
          const valueList = values.join(', ');
          sqlDump += `INSERT INTO "${tableName}" (${columnList}) VALUES (${valueList});\n`;
          totalRecords++;
        }
      }
    }

    // Add footer
    sqlDump += `\n-- End of export\n`;
    sqlDump += `-- Total records: ${totalRecords}\n`;
    sqlDump += `-- Tables: ${tablesResult.length}\n`;

    // Write to file
    fs.writeFileSync(OUTPUT_PATH, sqlDump);
    const fileSize = fs.statSync(OUTPUT_PATH).size;

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`TOTAL RECORDS: ${totalRecords}`);
    console.log(`${'─'.repeat(50)}\n`);

    console.log('========================================');
    console.log('✅ SQL EXPORT COMPLETE');
    console.log('========================================');
    console.log(`
File: ${OUTPUT_PATH}
Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB
Records: ${totalRecords}
Tables: ${tablesResult.length}

This SQL dump can be used to:
  1. Restore to SQLite if PostgreSQL migration fails
  2. Import into PostgreSQL for manual verification
  3. Compare with PostgreSQL backup after migration

Usage:
  SQLite:  sqlite3 dev.db < sqlite-export-complete.sql
  PostgreSQL: psql -d your_db < sqlite-export-complete.sql

Next Steps:
  1. Commit this backup file
  2. Run: npx ts-node scripts/migrate-data-sqlite-to-postgres.ts
  3. Verify PostgreSQL matches this backup
`);

    db.close();

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportSqliteToSql();
