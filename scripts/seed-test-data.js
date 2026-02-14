const { PrismaClient } = require('prisma/prisma-client');
const prisma = new PrismaClient();

async function main() {
  // Add a module
  const module = await prisma.module.create({
    data: {
      name: 'Test Module',
      description: 'Module for testing',
    },
  });
  console.log('Module created:', module);

  // Add a facilitator user
  const user = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
      password: 'testpassword', // Adjust as needed
    },
  });
  console.log('Facilitator user created:', user);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
