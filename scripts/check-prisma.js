const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const group = await prisma.group.findFirst({
    where: { name: 'FLINT GROUP (LP) - 2025' },
  });
  console.log(Boolean(group));
  await prisma.$disconnect();
})();
