const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    console.log('📋 All Groups in Database:\n');
    groups.forEach((group, index) => {
      console.log(`${index + 1}. ID: ${group.id}`);
      console.log(`   Name: "${group.name}"\n`);
    });

    console.log(`\n✅ Total Groups: ${groups.length}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
