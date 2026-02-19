const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const group = await prisma.group.findFirst({
      where: { name: "Azelis 26'" },
    });

    if (group) {
      console.log('Group found:', group.name);
      console.log('\nNotes field content:');
      if (group.notes) {
        const parsed = JSON.parse(group.notes);
        console.log(JSON.stringify(parsed, null, 2));
      } else {
        console.log('Notes field is empty/null');
      }
    } else {
      console.log('Group not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
