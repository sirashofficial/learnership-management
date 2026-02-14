// Script to count students in the database
const { PrismaClient } = require('prisma/prisma-client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.student.count();
  console.log('Student count:', count);
  await prisma.$disconnect();
}

main();
