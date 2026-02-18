#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

// Master curriculum - 24 units
const masterCurriculum = [
  // Module 1: Numeracy (5 units)
  { moduleNum: 1, code: '7480', title: 'Demonstrate understanding of rational and irrational numbers' },
  { moduleNum: 1, code: '9008', title: 'Identify, describe, compare, classify, explore shape and motion' },
  { moduleNum: 1, code: '9007', title: 'Work with a range of patterns and functions' },
  { moduleNum: 1, code: '7469', title: 'Use mathematics to investigate and monitor financial aspects' },
  { moduleNum: 1, code: '9009', title: 'Apply basic knowledge of statistics and probability' },
  // Module 2: HIV/AIDS (3 units)
  { moduleNum: 2, code: '13915', title: 'Demonstrate knowledge and understanding of HIV/AIDS' },
  { moduleNum: 2, code: '8963/8964', title: 'Access and use information / Write for a defined context' },
  { moduleNum: 2, code: '8962/8967', title: 'Maintain and adapt oral communication' },
  // Module 3: Marketing (4 units)
  { moduleNum: 3, code: '119673', title: 'Identify and demonstrate entrepreneurial ideas' },
  { moduleNum: 3, code: '119669', title: 'Match new venture opportunity to market needs' },
  { moduleNum: 3, code: '119672', title: 'Manage marketing and selling processes' },
  { moduleNum: 3, code: '114974', title: 'Apply the basic skills of customer service' },
  // Module 4: Business Sector (3 units)
  { moduleNum: 4, code: '119667', title: 'Identify composition of industry/sector' },
  { moduleNum: 4, code: '119712', title: 'Tender for business or work' },
  { moduleNum: 4, code: '119671', title: 'Administer contracts' },
  // Module 5: Financial (3 units)
  { moduleNum: 5, code: '119666', title: 'Determine financial requirements' },
  { moduleNum: 5, code: '119670', title: 'Produce a business plan' },
  { moduleNum: 5, code: '119674', title: 'Manage finances' },
  // Module 6: Operations (6 units)
  { moduleNum: 6, code: '119668', title: 'Manage business operations' },
  { moduleNum: 6, code: '13932', title: 'Prepare and process documents for financial and banking' },
  { moduleNum: 6, code: '13929', title: 'Co-ordinate meetings, minor events' },
  { moduleNum: 6, code: '13930', title: 'Monitor and control receiving and satisfaction of visitors' },
  { moduleNum: 6, code: '114959', title: 'Behave in a professional manner' },
  { moduleNum: 6, code: '113924', title: 'Apply basic business ethics' },
];

// Group rollout data from source files - dates and group info
const groupData = {
  'FLINT GROUP (LP) - 2025': { startDate: '01/07/2025', endDate: '30/06/2026' },
  'WAHL CLIPPERS (LP) - 2025': { startDate: '01/05/2025', endDate: '30/04/2026' },
  'AZELIS (LP) - 2025': { startDate: '01/08/2025', endDate: '31/07/2026' },
  'AZELIS SA (LP) - 2026': { startDate: '28/11/2025', endDate: '27/11/2026' },
  'MONTEAGLE (LP) - 2025': { startDate: '01/03/2025', endDate: '28/02/2026' },
  'MONTEAGLE (LP) - 2026': { startDate: '20/11/2025', endDate: '19/11/2026' },
  'PACKAGING WORLD (LP) - 2025': { startDate: '01/09/2025', endDate: '31/08/2026' },
  'BEYOND INSIGHTS (LP) - 2026': { startDate: '01/01/2026', endDate: '31/12/2026' },
  'CITY LOGISTICS (LP) - 2026': { startDate: '01/12/2025', endDate: '30/11/2026' },
};

async function standardizeAllGroups() {
  const prisma = new PrismaClient();
  let successCount = 0;

  console.log('STANDARDIZING ALL GROUPS TO 24-UNIT CURRICULUM\n');

  for (const [groupName, dates] of Object.entries(groupData)) {
    try {
      const group = await prisma.group.findFirst({ where: { name: groupName } });
      if (!group) {
        console.log(`✗ ${groupName} - NOT FOUND`);
        continue;
      }

      // Build modules with master curriculum
      const modules = [1, 2, 3, 4, 5, 6].map(moduleNum => ({
        moduleNumber: moduleNum,
        unitStandards: masterCurriculum
          .filter(u => u.moduleNum === moduleNum)
          .map(u => ({
            id: u.code,
            code: u.code,
            title: u.title,
            startDate: '',
            endDate: '',
            summativeDate: '',
            assessingDate: '',
            credits: 0,
          })),
      }));

      const rolloutPlan = {
        groupName,
        startDate: dates.startDate,
        endDate: dates.endDate,
        numLearners: 0,
        modules,
      };

      await prisma.group.update({
        where: { id: group.id },
        data: { notes: JSON.stringify({ rolloutPlan }) },
      });

      const totalUnits = modules.reduce((sum, m) => sum + m.unitStandards.length, 0);
      console.log(`✓ ${groupName.padEnd(40)} | 24 units across 6 modules`);
      successCount++;
    } catch (e) {
      console.log(`✗ ${groupName} - ${e.message}`);
    }
  }

  console.log(`\nCompleted: ${successCount}/9 groups standardized\n`);
  await prisma.$disconnect();
}

standardizeAllGroups().catch(e => console.error('Error:', e)).finally(() => process.exit(0));
