import Database from 'better-sqlite3';
import { Pool } from 'pg';
import * as fs from 'fs';

const sqliteDb = new Database('prisma/dev.db', { readonly: true });
const pgPool = new Pool({
  host: 'aws-1-eu-west-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.kbiwvnggvmykvgzmjauy',
  password: 'Kingashthe7.',
  ssl: { rejectUnauthorized: false },
});

const tables = [
  'User', 'Company', 'Group', 'Student', 'Module', 'UnitStandard',
  'LessonPlan', 'Session', 'Assessment', 'Attendance', 'RolloutPlan',
  'UnitStandardRollout', 'GroupSchedule', 'GroupCourse', 'GroupRolloutPlan',
  'FacilitatorTask', 'AuditLog', 'UndoHistory', 'ReminderPreference'
];

async function verify() {
  console.log('\n========================================');
  console.log('PHASE 3: MIGRATION VERIFICATION');
  console.log('========================================\n');

  const pgClient = await pgPool.connect();
  let totalSqlite = 0;
  let totalPostgres = 0;
  let allMatch = true;

  console.log('Table'.padEnd(30) + 'SQLite'.padStart(10) + 'PostgreSQL'.padStart(12) + '  Status');
  console.log('─'.repeat(65));

  for (const table of tables) {
    try {
      // SQLite count
      const sqliteCount = sqliteDb.prepare(`SELECT COUNT(*) as count FROM [${table}]`).get() as any;
      const sqliteRows = sqliteCount.count;

      // PostgreSQL count
      const pgResult = await pgClient.query(`SELECT COUNT(*) as count FROM "${table}"`);
      const pgRows = parseInt(pgResult.rows[0].count, 10);

      totalSqlite += sqliteRows;
      totalPostgres += pgRows;

      const match = sqliteRows === pgRows;
      if (!match) allMatch = false;

      const status = match ? '✅' : '❌ MISMATCH';
      console.log(
        table.padEnd(30) +
        sqliteRows.toString().padStart(10) +
        pgRows.toString().padStart(12) +
        `  ${status}`
      );
    } catch (error) {
      console.log(table.padEnd(30) + '  ERROR: ' + (error as Error).message);
    }
  }

  console.log('─'.repeat(65));
  console.log(
    'TOTAL'.padEnd(30) +
    totalSqlite.toString().padStart(10) +
    totalPostgres.toString().padStart(12) +
    `  ${allMatch ? '✅ ALL MATCH' : '❌ DISCREPANCY'}`
  );

  await pgClient.release();
  await pgPool.end();
  sqliteDb.close();

  console.log('\n========================================');
  if (allMatch) {
    console.log('✅ VERIFICATION PASSED');
    console.log('All row counts match exactly!');
    console.log('\nReady for Phase 4: Blue-Green Cutover');
  } else {
    console.log('❌ VERIFICATION FAILED');
    console.log('Row count mismatch detected!');
    console.log('⚠️ DO NOT proceed to production');
  }
  console.log('========================================\n');

  process.exit(allMatch ? 0 : 1);
}

verify().catch(console.error);
