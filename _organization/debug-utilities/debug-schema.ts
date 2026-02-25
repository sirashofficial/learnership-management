import Database from 'better-sqlite3';

const db = new Database('prisma/dev.db', { readonly: true });

const cols = db.prepare('PRAGMA table_info(LessonPlan)').all() as any[];
console.log('LessonPlan columns:');
cols.forEach((c) => {
  console.log(`  ${c.name.padEnd(20)} : ${c.type}`);
});

db.close();
