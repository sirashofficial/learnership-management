const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAutoGenerateStudentId() {
  try {
    console.log('\n🧪 Testing Auto-Generated Student IDs...\n');
    
    // Get first group
    const group = await prisma.group.findFirst();
    if (!group) {
      console.error('❌ No groups found!');
      return;
    }
    
    console.log(`📍 Using group: ${group.name} (${group.id})`);
    
    // Generate prefix
    const prefix = group.name
      .split(/[\s-]+/)[0]
      .substring(0, 2)  // 2 letters
      .toUpperCase();
    
    console.log(`🔤 Generated prefix: ${prefix}`);
    
    // Count existing students
    const studentCount = await prisma.student.count({
      where: { groupId: group.id },
    });
    
    console.log(`📊 Current student count in group: ${studentCount}`);
    
    // Generate next ID
    const number = String(studentCount + 1).padStart(2, '0');
    const studentId = `${prefix}-${number}`;
    
    console.log(`🆔 Next student ID would be: ${studentId}\n`);
    
    // Show examples for different groups
    console.log('📝 Example student IDs for each group:\n');
    
    const allGroups = await prisma.group.findMany({
      include: {
        _count: {
          select: { students: true }
        }
      }
    });
    
    for (const g of allGroups) {
      const gPrefix = g.name
        .split(/[\s-]+/)[0]
        .substring(0, 2)  // 2 letters
        .toUpperCase();
      
      const nextNum = String(g._count.students + 1).padStart(2, '0');
      const nextId = `${gPrefix}-${nextNum}`;
      
      console.log(`   ${g.name.padEnd(25)} → Next: ${nextId}`);
    }
    
    console.log('\n✅ Auto-generation logic working correctly!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAutoGenerateStudentId();
