const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log(`\nFound ${users.length} users in database:\n`);
    
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  Role: ${user.role}`);
      console.log(`  ID: ${user.id}`);
      console.log('');
    });

    if (users.length === 0) {
      console.log('⚠️  No users found! Creating a default user...\n');
      
      const defaultUser = await prisma.user.create({
        data: {
          email: 'facilitator@example.com',
          name: 'Default Facilitator',
          password: 'password123',
          role: 'FACILITATOR',
        },
      });
      
      console.log('✅ Default user created:');
      console.log(`   Name: ${defaultUser.name}`);
      console.log(`   Email: ${defaultUser.email}`);
      console.log(`   ID: ${defaultUser.id}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
