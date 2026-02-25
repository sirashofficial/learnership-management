/**
 * Analyze PostgreSQL Tables and Update Statistics
 * 
 * After adding indexes, PostgreSQL needs to update its statistics
 * to know about the new indexes and plan queries optimally.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeTables() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   PostgreSQL ANALYZE - Update Statistics');
  console.log('═══════════════════════════════════════════════════════\n');

  const tables = [
    'Assessment',
    'Attendance',
    'Student',
    'UnitStandard',
    'Group',
    'Module',
  ];

  for (const table of tables) {
    try {
      console.log(`Analyzing ${table}...`);
      await prisma.$executeRawUnsafe(`ANALYZE "${table}"`);
      console.log(`✅ ${table} analyzed`);
    } catch (error) {
      console.error(`❌ Failed to analyze ${table}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log('\n✅ Database statistics updated');
  console.log('Indexes are now ready for query optimization\n');
}

analyzeTables()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
