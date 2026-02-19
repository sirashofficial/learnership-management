const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'ash@yeha.training' }
    });

    if (user) {
      console.log('Test user found:', user.email, user.role);
    } else {
      console.log('Test user not found. Let me check all users:');
      const allUsers = await prisma.user.findMany();
      console.log('All users:', allUsers.map(u => ({ email: u.email, role: u.role })));
    }

    console.log('\n');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
