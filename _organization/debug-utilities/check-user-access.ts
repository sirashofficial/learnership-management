import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserAccess() {
  console.log('\n👤 User Access Check\n');
  
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      }
    });
    
    console.log('All Users in Database:');
    users.forEach(u => console.log(`  - ${u.email} (${u.role}) [ID: ${u.id}]`));
    console.log();
    
    // Check the user from the middleware logs
    const loggedInUserId = 'bccc124a-32c6-4bda-9082-6ca9c78b8781';
    const currentUser = await prisma.user.findUnique({
      where: { id: loggedInUserId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      }
    });
    
    if (currentUser) {
      console.log('Currently Logged In User:');
      console.log(`  Email: ${currentUser.email}`);
      console.log(`  Role: ${currentUser.role}`);
      console.log(`  Name: ${currentUser.name || 'N/A'}`);
      console.log();
      
      // Check what data exists
      console.log('Total Data Available:');
      const counts = {
        students: await prisma.student.count(),
        groups: await prisma.group.count(),
        modules: await prisma.module.count(),
        lessonPlans: await prisma.lessonPlan.count(),
        sessions: await prisma.session.count(),
        assessments: await prisma.assessment.count(),
      };
      
      Object.entries(counts).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      
    } else {
      console.log('❌ User from middleware not found in database!');
      console.log(`   Looking for ID: ${loggedInUserId}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAccess();
