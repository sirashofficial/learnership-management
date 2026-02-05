/**
 * Safe Migration: Site → Group
 * Migrates existing data before schema change
 */

import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'prisma', 'dev.db');
const db = new Database(dbPath);

console.log('Starting safe migration: Site → Group\n');

try {
  // Step 1: Check current state
  const siteCount = db.prepare('SELECT COUNT(*) as count FROM Site').get() as { count: number };
  const studentCount = db.prepare('SELECT COUNT(*) as count FROM Student WHERE groupId IS NULL').get() as { count: number };
  const sessionCount = db.prepare('SELECT COUNT(*) as count FROM Session WHERE groupId IS NULL').get() as { count: number };
  
  console.log(`Sites in database: ${siteCount.count}`);
  console.log(`Students without groupId: ${studentCount.count}`);
  console.log(`Sessions without groupId: ${sessionCount.count}\n`);

  // Step 2: Copy Sites to Groups (with conflict handling)
  console.log('Migrating Sites to Groups...');
  const sites = db.prepare('SELECT * FROM Site').all() as any[];
  
  for (const site of sites) {
    // Check if this group already exists
    const exists = db.prepare('SELECT id FROM "Group" WHERE id = ?').get(site.id);
    
    if (!exists) {
      // Insert as new group - use current Group table structure
      db.prepare(`
        INSERT INTO "Group" (id, name, company, address, contactName, contactPhone, startDate, endDate, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now', '+180 days'), ?, ?, ?)
      `).run(
        site.id,
        site.name,
        'Migrated Company', // Placeholder company
        site.address,
        site.contactName,
        site.contactPhone,
        site.status,
        site.createdAt,
        site.updatedAt
      );
      console.log(`  ✓ Created group: ${site.name}`);
    } else {
      console.log(`  - Group already exists: ${site.name}`);
    }
  }

  // Step 3: Update Students
  console.log('\nUpdating Students...');
  const studentsUpdated = db.prepare(`
    UPDATE Student 
    SET groupId = siteId
    WHERE groupId IS NULL AND siteId IS NOT NULL
  `).run();
  console.log(`  ✓ Updated ${studentsUpdated.changes} students`);

  // Step 4: Update Sessions
  console.log('\nUpdating Sessions...');
  const sessionsUpdated = db.prepare(`
    UPDATE Session
    SET groupId = siteId
    WHERE groupId IS NULL AND siteId IS NOT NULL
  `).run();
  console.log(`  ✓ Updated ${sessionsUpdated.changes} sessions`);

  // Step 5: Update LessonPlans (skip if column doesn't exist yet)
  console.log('\nUpdating LessonPlans...');
  try {
    const lessonPlansUpdated = db.prepare(`
      UPDATE LessonPlan
      SET groupId = siteId
      WHERE groupId IS NULL AND siteId IS NOT NULL
    `).run();
    console.log(`  ✓ Updated ${lessonPlansUpdated.changes} lesson plans`);
  } catch (error: any) {
    if (error.message.includes('no such column')) {
      console.log(`  - LessonPlan.groupId doesn't exist yet, skipping`);
    } else {
      throw error;
    }
  }

  // Verification
  console.log('\n--- Verification ---');
  const finalStudentCount = db.prepare('SELECT COUNT(*) as count FROM Student WHERE groupId IS NOT NULL').get() as { count: number };
  const finalSessionCount = db.prepare('SELECT COUNT(*) as count FROM Session WHERE groupId IS NOT NULL').get() as { count: number };
  const finalGroupCount = db.prepare('SELECT COUNT(*) as count FROM "Group"').get() as { count: number };
  
  console.log(`Students with groupId: ${finalStudentCount.count}`);
  console.log(`Sessions with groupId: ${finalSessionCount.count}`);
  console.log(`Total Groups: ${finalGroupCount.count}`);

  console.log('\n✅ Migration completed successfully!');
  console.log('\nYou can now run: npx prisma db push --accept-data-loss\n');

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
