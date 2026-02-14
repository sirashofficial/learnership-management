const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.group.findMany({
    select: { id: true, name: true, notes: true },
    orderBy: { name: 'asc' },
  });

  const azelis = rows.filter((row) => row.name === 'AZELIS (2025)');
  console.log('AZELIS (2025) rows:', azelis);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
});
