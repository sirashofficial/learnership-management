const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'ash@yeha.training' }
    });

    if (existing) {
      console.log('✅ User ash@yeha.training already exists');
      return;
    }

    // Create the user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'ash@yeha.training',
        name: 'Ash Demo',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('✅ Demo user created successfully!');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Password: password123');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
