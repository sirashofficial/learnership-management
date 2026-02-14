// Script to import groups and learners from all_learnership_groups.md
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('prisma/prisma-client');
const prisma = new PrismaClient();

const filePath = path.join(__dirname, '../all_learnership_groups.md');

async function main() {
  const content = fs.readFileSync(filePath, 'utf-8');
  const groupBlocks = content.split(/## /).slice(1); // Each group block

  for (const block of groupBlocks) {
    const [groupHeader, ...learnerLines] = block.split('\n');
    const groupName = groupHeader.trim();
    const learners = learnerLines.filter(l => l.match(/^\d+\.\s+/)).map(l => l.replace(/^\d+\.\s+/, '').trim());

    // Create or update group
    let group = await prisma.group.findFirst({ where: { name: groupName } });
    if (!group) {
      group = await prisma.group.create({
        data: {
          name: groupName,
          status: 'ACTIVE',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
        }
      });
      console.log(`Created group: ${groupName}`);
    } else {
      console.log(`Group exists: ${groupName}`);
    }

    // Add learners
    for (const learner of learners) {
      const exists = await prisma.student.findFirst({ where: { firstName: learner.split(' ')[0], lastName: learner.split(' ').slice(1).join(' '), groupId: group.id } });
      if (!exists) {
        await prisma.student.create({
          data: {
            firstName: learner.split(' ')[0],
            lastName: learner.split(' ').slice(1).join(' '),
            groupId: group.id,
            status: 'ACTIVE',
          }
        });
        console.log(`Added learner: ${learner} to group: ${groupName}`);
      }
    }
  }
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
