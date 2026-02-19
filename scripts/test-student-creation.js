const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStudentCreation() {
  try {
    console.log('\n🧪 Testing Student Creation...\n');
    
    // Get first user and group
    const firstUser = await prisma.user.findFirst();
    const firstGroup = await prisma.group.findFirst();
    
    if (!firstUser) {
      console.error('❌ No users found! Create a user first.');
      return;
    }
    
    if (!firstGroup) {
      console.error('❌ No groups found! Create a group first.');
      return;
    }
    
    console.log(`✅ Found facilitator: ${firstUser.name} (${firstUser.id})`);
    console.log(`✅ Found group: ${firstGroup.name} (${firstGroup.id})\n`);
    
    // Test data
    const testStudent = {
      studentId: `TEST${Date.now()}`,
      firstName: 'Test',
      lastName: 'Student',
      email: `test${Date.now()}@example.com`,
      phone: '+27 11 123 4567',
      idNumber: '1234567890123',
      groupId: firstGroup.id,
      facilitatorId: firstUser.id,
      status: 'ACTIVE',
      progress: 0,
    };
    
    console.log('📝 Creating test student with data:');
    console.log(JSON.stringify(testStudent, null, 2));
    console.log('');
    
    // Create student
    const student = await prisma.student.create({
      data: testStudent,
      include: {
        group: true,
        facilitator: true,
      },
    });
    
    console.log('✅ Student created successfully!');
    console.log(`   Name: ${student.firstName} ${student.lastName}`);
    console.log(`   ID: ${student.id}`);
    console.log(`   Student ID: ${student.studentId}`);
    console.log(`   Group: ${student.group.name}`);
    console.log(`   Facilitator: ${student.facilitator.name}\n`);
    
    // Clean up - delete test student
    await prisma.student.delete({
      where: { id: student.id },
    });
    
    console.log('🧹 Test student deleted\n');
    console.log('✅ ALL TESTS PASSED! Student creation is working.\n');
    
  } catch (error) {
    console.error('❌ TEST FAILED!');
    console.error('Error:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.meta) console.error('Meta:', error.meta);
  } finally {
    await prisma.$disconnect();
  }
}

testStudentCreation();
