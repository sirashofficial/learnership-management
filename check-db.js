const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
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
    
    console.log(`\nFound ${groups.length} groups in database:\n`);
    groups.forEach(g => {
      console.log(`- ${g.name} (${g._count.students} students, Company: ${g.company?.name || 'None'})`);
    });
    console.log('');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
