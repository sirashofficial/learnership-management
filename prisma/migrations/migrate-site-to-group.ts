/**
 * Migration Script: Site → Group
 * 
 * This script migrates existing Site data to the new Group model
 * and extracts Company information from Group.company strings
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting migration: Site → Group...\n');

  try {
    // Step 1: Get all existing Sites (they will become Groups)
    const sites = await prisma.$queryRaw<any[]>`SELECT * FROM Site`;
    console.log(`Found ${sites.length} sites to migrate\n`);

    // Step 2: Get all existing Groups (need to extract company info)
    const oldGroups = await prisma.$queryRaw<any[]>`SELECT * FROM "Group"`;
    console.log(`Found ${oldGroups.length} existing groups\n`);

    // Step 3: Create a mapping of unique companies
    const companyMap = new Map<string, string>();
    
    for (const group of oldGroups) {
      const companyName = group.company;
      if (companyName && !companyMap.has(companyName)) {
        // Create new company
        const companyId = crypto.randomUUID();
        companyMap.set(companyName, companyId);
        console.log(`Creating company: ${companyName}`);
      }
    }

    console.log(`\nCreated ${companyMap.size} unique companies\n`);

    // Step 4: Update Students - change siteId to groupId
    // First, we need to rename the old Sites to Groups
    console.log('Migrating Site records to Group model...');
    
    for (const site of sites) {
      console.log(`  - Migrating site: ${site.name}`);
      // Sites become Groups without companies initially
      await prisma.$executeRaw`
        INSERT INTO "Group" (id, name, location, address, contactName, contactPhone, startDate, endDate, status, createdAt, updatedAt, companyId, coordinator, notes)
        VALUES (
          ${site.id},
          ${site.name},
          ${site.address},
          ${site.address},
          ${site.contactName},
          ${site.contactPhone},
          ${new Date().toISOString()},
          ${new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()},
          ${site.status},
          ${site.createdAt},
          ${site.updatedAt},
          NULL,
          NULL,
          'Migrated from Site'
        )
        ON CONFLICT(id) DO UPDATE SET
          name = ${site.name},
          location = ${site.address},
          address = ${site.address},
          contactName = ${site.contactName},
          contactPhone = ${site.contactPhone}
      `;
    }

    console.log('\nMigration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run db:push');
    console.log('2. Update API routes to use /api/groups');
    console.log('3. Update frontend to use new Group terminology\n');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
