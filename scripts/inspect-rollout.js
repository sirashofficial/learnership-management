#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  const group = await prisma.group.findFirst({
    where: { name: 'FLINT GROUP (LP) - 2025' },
  });

  if (group && group.notes) {
    const parsed = JSON.parse(group.notes);
    console.log('Group:', group.name);
    console.log('Rollout Plan:', JSON.stringify(parsed.rolloutPlan, null, 2).substring(0, 1000));
  } else {
    console.log('No notes found or group missing');
  }

  await prisma.$disconnect();
})();
