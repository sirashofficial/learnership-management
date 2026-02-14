const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const db = new PrismaClient();

async function cleanAndReloadData() {
  try {
    console.log('🧹 Cleaning old data and reloading only from all_learnership_groups.md...\n');
    
    // Delete ALL existing data
    console.log('Deleting old data...');
    await db.assessment.deleteMany({});
    await db.attendance.deleteMany({});
    await db.formativeCompletion.deleteMany({});
    await db.moduleProgress.deleteMany({});
    await db.unitStandardProgress.deleteMany({});
    await db.courseProgress.deleteMany({});
    await db.pOEChecklist.deleteMany({});
    await db.session.deleteMany({});
    await db.unitStandardRollout.deleteMany({});
    await db.groupRolloutPlan.deleteMany({});
    await db.lessonPlan.deleteMany({});
    await db.groupCourse.deleteMany({});
    await db.groupSchedule.deleteMany({});
    await db.student.deleteMany({});
    await db.group.deleteMany({});
    console.log('✅ Old data deleted\n');
    
    // Read markdown file
    const mdPath = path.join(__dirname, '..', 'all_learnership_groups.md');
    const content = fs.readFileSync(mdPath, 'utf8');
    
    // Parse groups and students
    const groupPattern = /## ([^\n]+) - (\d{4})\n\n([\s\S]*?)(?=##|$)/g;
    let match;
    let groupCount = 0;
    let studentCount = 0;
    
    const groups = [];
    
    while ((match = groupPattern.exec(content)) !== null) {
      const groupNameFull = match[1].trim();
      const year = match[2];
      const studentsText = match[3];
      
      // Extract group name (remove "(LP)")
      const groupName = groupNameFull.replace(/\s*\(LP\)\s*/, '').trim() + ` (${year})`;
      
      // Parse students
      const studentLines = studentsText
        .split('\n')
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*/, '').trim());
      
      groups.push({
        name: groupName,
        year: parseInt(year),
        students: studentLines
      });
    }
    
    console.log(`📊 Found ${groups.length} groups to import:\n`);
    
    // Create groups and students
    for (const group of groups) {
      try {
        // Create user first (facilitator)
        let user = await db.user.findFirst({
          where: { role: 'FACILITATOR' }
        });
        
        if (!user) {
          user = await db.user.create({
            data: {
              email: `facilitator-${group.year}@lms.local`,
              name: 'Default Facilitator',
              password: 'hashedpassword',
              role: 'FACILITATOR'
            }
          });
        }
        
        // Create group (group name is also company name)
        const dbGroup = await db.group.create({
          data: {
            name: group.name,
            location: 'South Africa',
            startDate: new Date(`${group.year}-01-15`),
            endDate: new Date(`${group.year}-12-31`),
            status: 'ACTIVE'
          }
        });
        
        groupCount++;
        
        // Create students
        for (let i = 0; i < group.students.length; i++) {
          const [firstName, ...lastNameParts] = group.students[i].split(' ');
          const lastName = lastNameParts.join(' ');
          
          const studentId = `${group.year}-${group.name.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`;
          
          await db.student.create({
            data: {
              studentId,
              firstName,
              lastName,
              groupId: dbGroup.id,
              facilitatorId: user.id,
              status: 'ACTIVE'
            }
          });
          
          studentCount++;
        }
        
        console.log(`✅ ${group.name}: ${group.students.length} students`);
        
      } catch (error) {
        console.error(`❌ Error importing ${group.name}:`, error.message);
      }
    }
    
    console.log(`\n${'-'.repeat(60)}`);
    console.log(`📊 IMPORT COMPLETE`);
    console.log(`${'-'.repeat(60)}`);
    console.log(`✅ Created ${groupCount} groups`);
    console.log(`✅ Created ${studentCount} students`);
    
    const finalGroups = await db.group.findMany();
    const finalStudents = await db.student.findMany();
    console.log(`\nTotal in database: ${finalGroups.length} groups, ${finalStudents.length} students`);
    
  } catch (error) {
    console.error('❌ Critical error:', error.message);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

cleanAndReloadData();
