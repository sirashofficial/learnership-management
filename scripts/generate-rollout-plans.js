#!/usr/bin/env node

/**
 * Auto-Generate 12-month Rollout Plans for NVC L2 Groups
 * Uses the NVC L2 SYSTEMS PROMPT structure
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// NVC L2 Module structure
const NVC_L2_MODULES = [
  { moduleNum: 1, name: 'Numeracy', durationDays: 30 },
  { moduleNum: 2, name: 'HIV/AIDS & Communications', durationDays: 45 },
  { moduleNum: 3, name: 'Market Requirements', durationDays: 45 },
  { moduleNum: 4, name: 'Business Sector & Industry', durationDays: 45 },
  { moduleNum: 5, name: 'Financial Requirements', durationDays: 60 },
  { moduleNum: 6, name: 'Business Operations', durationDays: 60 },
];

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function generateRolloutPlans() {
  console.log('🌱 Generating rollout plans for NVC L2 groups...\n');

  try {
    // Get all groups
    const groups = await prisma.group.findMany({
      include: { rolloutPlan: true },
      orderBy: { name: 'asc' },
    });

    console.log(`📋 Found ${groups.length} total groups\n`);

    let successCount = 0;
    let skipCount = 0;

    for (const group of groups) {
      // Check if already has rollout plan
      if (group.rolloutPlan) {
        console.log(`⏭️  ${group.name} - Already has rollout plan`);
        skipCount++;
        continue;
      }

      try {
        const startDate = new Date(group.startDate);
        const planData = { groupId: group.id };

        let currentDate = new Date(startDate);

        console.log(`\n📅 ${group.name}:`);
        console.log(`   Start: ${startDate.toISOString().split('T')[0]}`);

        for (const module of NVC_L2_MODULES) {
          const moduleStartDate = new Date(currentDate);
          const moduleEndDate = addDays(currentDate, module.durationDays);

          planData[`module${module.moduleNum}StartDate`] = moduleStartDate;
          planData[`module${module.moduleNum}EndDate`] = moduleEndDate;

          console.log(
            `   Module ${module.moduleNum} (${module.name}): ${moduleStartDate
              .toISOString()
              .split('T')[0]} → ${moduleEndDate.toISOString().split('T')[0]}`
          );

          // Add 5-day buffer for workplace activity
          currentDate = addDays(moduleEndDate, 5);
        }

        // Create rollout plan
        await prisma.groupRolloutPlan.create({
          data: planData,
        });

        console.log(`   ✅ Rollout plan created`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }

    console.log(
      `\n✨ Complete!\n✅ Created: ${successCount} | ⏭️ Skipped: ${skipCount} | Total: ${groups.length}`
    );
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
generateRolloutPlans();
