const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGroups() {
  try {
    const groups = await prisma.group.findMany({
      include: {
        company: true,
        _count: {
          select: { students: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`\nFound ${groups.length} groups:\n`);
    groups.forEach(g => {
      console.log(`- ${g.name}`);
      console.log(`  Company: ${g.company?.name || 'No company'}`);
      console.log(`  Students: ${g._count.students}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkGroups();
