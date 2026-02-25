import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickCheck() {
  console.log('\n🔍 Quick Database Check\n');
  
  try {
    const students = await prisma.student.count();
    const groups = await prisma.group.count();
    const users = await prisma.user.count();
    const assessments = await prisma.assessment.count();
    
    console.log('Database Counts:');
    console.log('  Students:', students);
    console.log('  Groups:', groups);
    console.log('  Users:', users);
    console.log('  Assessments:', assessments);
    console.log();
    
    // Check if there are any user-group or user-student associations
    const firstUser = await prisma.user.findFirst();
    console.log('First User:', firstUser?.email || 'None found');
    
    // Check sample data
    const sampleStudents = await prisma.student.findMany({ take: 3 });
    console.log('\nSample Students:');
    sampleStudents.forEach(s => console.log(`  - ${s.firstName} ${s.lastName} (Group: ${s.groupId})`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickCheck();
