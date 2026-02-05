const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Starting migration: Site → Group, creating Companies...');

    // Get all groups
    const groups = await prisma.group.findMany();
    
    console.log(`Found ${groups.length} groups`);

    // For each group, create a company if companyName exists
    for (const group of groups) {
      if (group.companyName) {
        console.log(`Creating company for group: ${group.name}`);
        
        // Check if company already exists
        let company = await prisma.company.findFirst({
          where: { name: group.companyName }
        });

        if (!company) {
          company = await prisma.company.create({
            data: {
              name: group.companyName,
              contactPerson: group.contactPerson,
              email: group.email,
              phone: group.phone,
              address: group.address,
              industry: group.industry || 'General'
            }
          });
          console.log(`✓ Created company: ${company.name}`);
        } else {
          console.log(`✓ Company already exists: ${company.name}`);
        }

        // Update group to link to company
        await prisma.group.update({
          where: { id: group.id },
          data: { companyId: company.id }
        });
        console.log(`✓ Linked group "${group.name}" to company "${company.name}"`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('Summary:');
    const companyCount = await prisma.company.count();
    console.log(`- Total companies created: ${companyCount}`);
    console.log(`- Total groups updated: ${groups.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
