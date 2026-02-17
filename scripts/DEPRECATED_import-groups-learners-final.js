const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

// Parse markdown file
function parseGroupsMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const groups = [];
  
  // Split by section headers (## GROUP NAME)
  const sections = content.split(/^##\s+/m).slice(1);
  
  sections.forEach(section => {
    const lines = section.trim().split('\n');
    const headerLine = lines[0];
    
    // Parse group name from header like "CITY LOGISTICS (LP) - 2026"
    const match = headerLine.match(/^(.+?)\s*\((LP|HP|WLP)\)\s*-\s*(\d{4})/);
    if (!match) return;
    
    const [, companyName, , year] = match;
    const learners = [];
    
    // Parse learner names (numbered list items)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const learnerMatch = line.match(/^\d+\.\s+(.+)$/);
      if (learnerMatch) {
        learners.push({
          firstName: learnerMatch[1].split(' ')[0],
          lastName: learnerMatch[1].split(' ').slice(1).join(' ') || learnerMatch[1],
          fullName: learnerMatch[1]
        });
      }
    }
    
    if (learners.length > 0) {
      groups.push({
        name: `${companyName.trim()} ${year}`,
        companyName: companyName.trim(),
        year,
        learners
      });
    }
  });
  
  return groups;
}

// DEPRECATED: Do not use. Use npm run seed:safe instead.
// Get or create default facilitator
async function getOrCreateDefaultFacilitator() {
  let facilitator = await db.user.findFirst({
    where: { role: 'FACILITATOR' }
  });
  
  if (!facilitator) {
    facilitator = await db.user.create({
      data: {
        email: 'facilitator@learnership.com',
        name: 'Default Facilitator',
        password: 'hashed_password',
        role: 'FACILITATOR'
      }
    });
  }
  
  return facilitator;
}

// Import groups and learners
async function importGroupsAndLearners() {
  try {
    console.log('Starting import of groups and learners...');
    
    const markdownPath = path.join(__dirname, '..', 'all_learnership_groups.md');
    if (!fs.existsSync(markdownPath)) {
      console.error(`File not found: ${markdownPath}`);
      process.exit(1);
    }
    
    const groupsData = parseGroupsMarkdown(markdownPath);
    const facilitator = await getOrCreateDefaultFacilitator();
    
    console.log(`Found ${groupsData.length} groups to import`);
    
    for (const groupData of groupsData) {
      try {
        // Check if group already exists
        let group = await db.group.findFirst({
          where: { name: groupData.name }
        });
        
        if (!group) {
          // Create new group
          const startDate = groupData.year === '2026' ? new Date('2026-02-09') : new Date('2025-02-09');
          const endDate = new Date(startDate);
          endDate.setFullYear(endDate.getFullYear() + 1);
          
          group = await db.group.create({
            data: {
              name: groupData.name,
              status: 'ACTIVE',
              startDate,
              endDate,
              location: groupData.companyName,
              coordinator: groupData.companyName
            }
          });
          
          console.log(`✅ Created group: ${groupData.name}`);
        } else {
          console.log(`⏭️  Group already exists: ${groupData.name}`);
        }
        
        // Import learners for this group
        let importedCount = 0;
        for (const learner of groupData.learners) {
          // Check if student already exists
          const existingStudent = await db.student.findFirst({
            where: { 
              email: `${learner.fullName.replace(/\s+/g, '.').toLowerCase()}@learnership.com`
            }
          });
          
          if (!existingStudent) {
            // Generate student ID
            const studentCount = await db.student.count({ where: { groupId: group.id } });
            const prefix = groupData.name.split(' ')[0].substring(0, 2).toUpperCase();
            const studentId = `${prefix}-${String(studentCount + 1).padStart(2, '0')}`;
            
            await db.student.create({
              data: {
                studentId,
                firstName: learner.firstName,
                lastName: learner.lastName,
                email: `${learner.fullName.replace(/\s+/g, '.').toLowerCase()}@learnership.com`,
                groupId: group.id,
                facilitatorId: facilitator.id,
                status: 'ACTIVE'
              }
            });
            
            importedCount++;
          }
        }
        
        console.log(`  Imported ${importedCount} learners for group: ${groupData.name}`);
        
      } catch (error) {
        console.error(`Error importing group ${groupData.name}:`, error.message);
      }
    }
    
    console.log('\n✅ Import completed successfully!');
    
  } catch (error) {
    console.error('Critical error during import:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Run import
importGroupsAndLearners();
