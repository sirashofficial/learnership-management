const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const group = await prisma.group.findFirst({
    where: { name: 'FLINT GROUP (LP) - 2025' },
  });

  if (!group) {
    console.log('Group not found');
    return;
  }

  await prisma.group.update({
    where: { id: group.id },
    data: { notes: group.notes },
  });

  console.log('Update ok');
  await prisma.$disconnect();
})();
