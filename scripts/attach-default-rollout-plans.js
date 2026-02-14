const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

// Calculate default 12-month rollout plan based on group start date
function calculateDefaultRolloutPlan(startDate) {
  const start = new Date(startDate);
  const plan = {};
  
  // Each module approximately 2 months
  const modules = [
    { num: 1, duration: 30 }, // ~1 month
    { num: 2, duration: 45 }, // ~1.5 months
    { num: 3, duration: 45 }, // ~1.5 months
    { num: 4, duration: 45 }, // ~1.5 months
    { num: 5, duration: 60 }, // ~2 months
    { num: 6, duration: 60 }  // ~2 months
  ];
  
  let currentDate = new Date(start);
  
  modules.forEach(({ num }) => {
    plan[`module${num}StartDate`] = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 45); // 45 days per module average
    plan[`module${num}EndDate`] = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1); // Add 1 day buffer
  });
  
  return plan;
}

// Attach default rollout plans to groups
async function attachDefaultRolloutPlans() {
  try {
    console.log('Attaching default rollout plans to groups...');
    
    const groups = await db.group.findMany({
      include: {
        rolloutPlan: true
      }
    });
    
    console.log(`Processing ${groups.length} groups`);
    
    for (const group of groups) {
      if (!group.rolloutPlan) {
        // Calculate default plan based on group start date
        const rolloutData = calculateDefaultRolloutPlan(group.startDate);
        
        try {
          const rolloutPlan = await db.groupRolloutPlan.create({
            data: {
              groupId: group.id,
              ...rolloutData,
              rolloutDocPath: null // Will be updated when actual documents are found
            }
          });
          
          console.log(`✅ Created default rollout plan for group: ${group.name}`);
        } catch (error) {
          console.error(`Error creating rollout plan for ${group.name}:`, error.message);
        }
      } else {
        console.log(`⏭️  Group already has rollout plan: ${group.name}`);
      }
    }
    
    console.log('\n✅ Rollout plan attachment completed!');
    
  } catch (error) {
    console.error('Critical error:', error);
  } finally {
    await db.$disconnect();
  }
}

// Run
attachDefaultRolloutPlans();
