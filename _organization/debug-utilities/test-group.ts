import Database from 'better-sqlite3';

const db = new Database('prisma/dev.db', { readonly: true });

try {
  const rows = db.prepare('SELECT COUNT(*) as cnt FROM `Group`').all() as any[];
  console.log('Group row count:', rows[0]?.cnt);
  
  const cols = db.prepare('PRAGMA table_info(`Group`)').all() as any[];
  console.log('Group columns:', cols.map((c: any) => `${c.name}:${c.type}`).join(', '));
} catch (e) {
  console.error('Error:', (e as Error).message);
}

db.close();
