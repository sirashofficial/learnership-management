const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGroups() {
  try {
    const groups = await prisma.group.findMany({
      select: {
        name: true,
        status: true,
        _count: {
          select: { students: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`\nFound ${groups.length} groups:\n`);
    groups.forEach(g => {
      console.log(`- ${g.name} | Status: ${g.status} | Students: ${g._count.students}`);
    });
    
    // Group count by status
    const statusCounts = {};
    groups.forEach(g => {
      statusCounts[g.status] = (statusCounts[g.status] || 0) + 1;
    });
    
    console.log('\nGroups by status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkGroups();
