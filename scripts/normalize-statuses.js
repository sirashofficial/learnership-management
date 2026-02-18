const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function normalizeStatuses() {
  try {
    console.log('Normalizing group statuses...\n');
    
    // Update all "Active" to "ACTIVE"
    const result = await prisma.group.updateMany({
      where: {
        status: 'Active'
      },
      data: {
        status: 'ACTIVE'
      }
    });
    
    console.log(`✓ Updated ${result.count} groups from "Active" to "ACTIVE"`);
    
    // Verify the change
    const groups = await prisma.group.findMany({
      select: {
        name: true,
        status: true
      }
    });
    
    console.log('\nVerification - All groups now have:');
    const statusCounts = {};
    groups.forEach(g => {
      statusCounts[g.status] = (statusCounts[g.status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\n✓ Status normalization complete!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

normalizeStatuses();
