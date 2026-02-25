import Database from 'better-sqlite3';

const db = new Database('prisma/dev.db', { readonly: true });

// Check timestamps in different tables
console.log('=== Timestamp Format Analysis ===\n');

const tables = ['LessonPlan', 'Student', 'Module', 'UnitStandard'];

for (const table of tables) {
  try {
    const rows = db.prepare(`SELECT createdAt FROM ${table} LIMIT 3`).all() as any[];
    console.log(`${table}:`);
    for (const row of rows) {
      const val = row.createdAt;
      console.log(`  ${val} (type: ${typeof val}, length: ${String(val).length})`);
    }
    console.log('');
  } catch (e) {
    console.log(`${table}: Error - ${(e as Error).message}\n`);
  }
}

db.close();
