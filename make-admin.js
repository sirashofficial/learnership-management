const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeAshAdmin() {
  try {
    const user = await prisma.user.update({
      where: {
        email: 'ash@yeha.training'
      },
      data: {
        role: 'ADMIN'
      }
    });

    console.log('✅ Ash is now an ADMIN!');
    console.log('User:', user);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAshAdmin();
