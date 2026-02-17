const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const group = await prisma.group.findFirst({
    where: { name: 'FLINT GROUP (LP) - 2025' },
    include: { rolloutPlan: true },
  });

  if (!group) {
    console.log('Group not found');
    return;
  }

  console.log('GroupRolloutPlan:', group.rolloutPlan);
  await prisma.$disconnect();
})();
