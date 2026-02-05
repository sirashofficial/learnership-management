const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDataSync() {
  try {
    console.log('🔍 Checking data consistency...\n');

    // Check current state
    const groupCount = await prisma.group.count();
    const studentCount = await prisma.student.count();
    const studentsWithoutGroup = await prisma.student.count({
      where: { groupId: null }
    });

    console.log('Current State:');
    console.log(`- Groups: ${groupCount}`);
    console.log(`- Students: ${studentCount}`);
    console.log(`- Students without group: ${studentsWithoutGroup}\n`);

    if (groupCount === 0) {
      console.log('⚠️  No groups found! Creating default groups from existing data...\n');
      
      // Get all unique site/group combinations from students
      const students = await prisma.student.findMany();
      const uniqueGroupNames = [...new Set(students.map(s => s.site || s.group).filter(Boolean))];
      
      console.log(`Found ${uniqueGroupNames.length} unique group names from students`);
      
      // Create groups
      for (const groupName of uniqueGroupNames) {
        const group = await prisma.group.create({
          data: {
            name: groupName,
            location: 'To be updated',
            coordinator: 'To be assigned',
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-12-15'),
            status: 'Active',
            notes: 'Migrated from legacy site data'
          }
        });
        console.log(`✓ Created group: ${group.name} (ID: ${group.id})`);
        
        // Link students to this group
        const studentsForGroup = students.filter(s => 
          (s.site === groupName || s.group === groupName) && !s.groupId
        );
        
        if (studentsForGroup.length > 0) {
          await prisma.student.updateMany({
            where: {
              id: { in: studentsForGroup.map(s => s.id) }
            },
            data: {
              groupId: group.id
            }
          });
          console.log(`  → Linked ${studentsForGroup.length} students to this group`);
        }
      }
    } else if (studentsWithoutGroup > 0) {
      console.log('⚠️  Found students without groups. Attempting to link...\n');
      
      const orphanedStudents = await prisma.student.findMany({
        where: { groupId: null }
      });
      
      for (const student of orphanedStudents) {
        // Try to find group by name match
        const groupName = student.site || student.group;
        if (groupName) {
          const matchingGroup = await prisma.group.findFirst({
            where: {
              name: { contains: groupName, mode: 'insensitive' }
            }
          });
          
          if (matchingGroup) {
            await prisma.student.update({
              where: { id: student.id },
              data: { groupId: matchingGroup.id }
            });
            console.log(`✓ Linked ${student.firstName} ${student.lastName} to ${matchingGroup.name}`);
          } else {
            console.log(`⚠️  Could not find group for ${student.firstName} ${student.lastName} (${groupName})`);
          }
        }
      }
    }

    // Final check
    console.log('\n✅ Final State:');
    const finalGroups = await prisma.group.count();
    const finalStudents = await prisma.student.count();
    const finalOrphans = await prisma.student.count({ where: { groupId: null } });
    
    console.log(`- Groups: ${finalGroups}`);
    console.log(`- Students: ${finalStudents}`);
    console.log(`- Students without group: ${finalOrphans}`);
    
    // Show group breakdown
    console.log('\n📊 Group Breakdown:');
    const groups = await prisma.group.findMany({
      include: {
        _count: {
          select: { students: true }
        }
      }
    });
    
    for (const group of groups) {
      console.log(`  ${group.name}: ${group._count.students} students`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixDataSync();
