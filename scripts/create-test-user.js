const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

async function createTestUser() {
  const prisma = new PrismaClient();
  
  try {
    // Check if test user exists
    let user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (!user) {
      // Hash password
      const password = crypto.createHash('sha256').update('password123').digest('hex');
      
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: password,
          role: 'FACILITATOR'
        }
      });
      console.log('✅ Created test user');
    } else {
      console.log('✅ Test user already exists');
    }
    
    console.log('Email: test@example.com');
    console.log('Password: password123');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
