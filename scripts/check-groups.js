const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGroups() {
  try {
    const groups = await prisma.group.findMany({
      include: {
        _count: {
          select: { students: true }
        }
      }
    });
    console.log(`Found ${groups.length} groups:`);
    groups.forEach(g => {
      console.log(`- ${g.name} (ID: ${g.id}, Students: ${g._count.students})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkGroups();
