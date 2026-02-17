#!/usr/bin/env node
/**
 * Master Curriculum Standardization
 * Ensures all 9 groups have the same 24 unit standards from NVC Level 2
 * with dates applied from each group's rollout plan
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Master curriculum structure - same for all groups
const masterUnits = {
  1: [ // Module 1: Numeracy
    { code: '7480', title: 'Demonstrate understanding of rational and irrational numbers and number systems' },
    { code: '9008', title: 'Identify, describe, compare, classify, explore shape and motion in 2- and 3-dimensional shapes' },
    { code: '9007', title: 'Work with a range of patterns and functions and solve problems' },
    { code: '7469', title: 'Use mathematics to investigate and monitor financial aspects of personal and community life' },
    { code: '9009', title: 'Apply basic knowledge of statistics and probability to influence use of data' },
  ],
  2: [ // Module 2: HIV/AIDS & Communications
    { code: '13915', title: 'Demonstrate knowledge and understanding of HIV/AIDS in a workplace' },
    { code: '8963/8964', title: 'Access and use information from texts / Write for a defined context' },
    { code: '8962/8967', title: 'Maintain and adapt oral communication / Use language and communication in occupational learning programmes' },
  ],
  3: [ // Module 3: Marketing Requirements
    { code: '119673', title: 'Identify and demonstrate entrepreneurial ideas and opportunities' },
    { code: '119669', title: 'Match new venture opportunity to market needs' },
    { code: '119672', title: 'Manage marketing and selling processes of a new venture' },
    { code: '114974', title: 'Apply the basic skills of customer service' },
  ],
  4: [ // Module 4: Business Sector & Industry
    { code: '119667', title: 'Identify the composition of a selected new venture\'s industry/sector and its procurement systems' },
    { code: '119712', title: 'Tender for business or work in a selected new venture' },
    { code: '119671', title: 'Administer contracts for a selected new venture' },
  ],
  5: [ // Module 5: Financial Requirements
    { code: '119666', title: 'Determine financial requirements of a new venture' },
    { code: '119670', title: 'Produce a business plan for a new venture' },
    { code: '119674', title: 'Manage finances for a new venture' },
  ],
  6: [ // Module 6: Business Operations
    { code: '119668', title: 'Manage business operations' },
    { code: '13932', title: 'Prepare and process documents for financial and banking processes' },
    { code: '13929', title: 'Co-ordinate meetings, minor events and travel arrangements' },
    { code: '13930', title: 'Monitor and control the receiving and satisfaction of visitors' },
    { code: '114959', title: 'Behave in a professional manner in a business environment' },
    { code: '113924', title: 'Apply basic business ethics in a work environment' },
  ]
};

async function standardizeAllGroups() {
  console.log('='.repeat(100));
  console.log('STANDARDIZING ALL GROUPS TO 24-UNIT CURRICULUM');
  console.log('='.repeat(100) + '\n');

  const groups = await prisma.group.findMany();

  for (const group of groups) {
    try {
      // Parse existing rollout plan to get module dates
      let existingPlan = null;
      if (group.notes) {
        existingPlan = JSON.parse(group.notes).rolloutPlan;
      }

      // Build new standardized rollout plan with master curriculum
      const newModules = [];

      for (const moduleNum in masterUnits) {
        const moduleNumber = parseInt(moduleNum);
        const unitStandards = [];

        // Get dates from existing module if available
        const existingModule = existingPlan?.modules?.find(m => m.moduleNumber === moduleNumber);
        const existingUnitsByCode = {};

        if (existingModule) {
          existingModule.unitStandards.forEach(us => {
            existingUnitsByCode[us.code] = us;
          });
        }

        // Map master curriculum units, using existing dates where available
        for (const unit of masterUnits[moduleNum]) {
          const existing = existingUnitsByCode[unit.code];
          unitStandards.push({
            id: unit.code,
            code: unit.code,
            title: unit.title,
            startDate: existing?.startDate || '',
            endDate: existing?.endDate || '',
            summativeDate: existing?.summativeDate || '',
            assessingDate: existing?.assessingDate || '',
            credits: existing?.credits || 0,
          });
        }

        newModules.push({
          moduleNumber,
          unitStandards,
        });
      }

      // Create standardized rollout plan
      const standardizedPlan = {
        groupName: group.name,
        startDate: existingPlan?.startDate || '',
        endDate: existingPlan?.endDate || '',
        numLearners: existingPlan?.numLearners || 0,
        modules: newModules,
      };

      // Update group
      await prisma.group.update({
        where: { id: group.id },
        data: { notes: JSON.stringify({ rolloutPlan: standardizedPlan }) },
      });

      const unitCount = newModules.reduce((sum, m) => sum + m.unitStandards.length, 0);
      console.log(`✓ ${group.name}`);
      console.log(`  └─ Standardized to ${unitCount} units across ${newModules.length} modules\n`);

    } catch (e) {
      console.error(`✗ Error updating ${group.name}:`, e.message);
    }
  }

  console.log('='.repeat(100));
  console.log('Standardization Complete');
  console.log('='.repeat(100) + '\n');

  await prisma.$disconnect();
}

standardizeAllGroups().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
