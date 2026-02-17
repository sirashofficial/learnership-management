#!/usr/bin/env node
/**
 * Direct Rollout Plan Update Script
 * Manually provides parsed data from markdown files and updates database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Pre-parsed rollout plans from manually reading the markdown files
const rolloutPlans = {
  'FLINT GROUP (LP) - 2025': {
    startDate: '01/07/2025',
    endDate: '30/06/2026',
    modules: [
      {
        moduleNumber: 1,
        unitStandards: [
          { id: '7480', code: '7480', startDate: '01/07/2025', endDate: '01/07/2025', summativeDate: '02/07/2025', assessingDate: '03/07/2025', credits: 2 },
          { id: '9008', code: '9008', startDate: '04/07/2025', endDate: '04/07/2025', summativeDate: '07/07/2025', assessingDate: '08/07/2025', credits: 3 },
          { id: '9007', code: '9007', startDate: '09/07/2025', endDate: '11/07/2025', summativeDate: '14/07/2025', assessingDate: '15/07/2025', credits: 5 },
          { id: '7469', code: '7469', startDate: '16/07/2025', endDate: '16/07/2025', summativeDate: '17/07/2025', assessingDate: '18/07/2025', credits: 3 },
          { id: '9009', code: '9009', startDate: '21/07/2025', endDate: '21/07/2025', summativeDate: '22/07/2025', assessingDate: '23/07/2025', credits: 3 },
        ]
      },
      {
        moduleNumber: 2,
        unitStandards: [
          { id: '13915', code: '13915', startDate: '07/08/2025', endDate: '08/08/2025', summativeDate: '11/08/2025', assessingDate: '12/08/2025', credits: 4 },
          { id: '8963-8964', code: '8963/8964', startDate: '13/08/2025', endDate: '22/08/2025', summativeDate: '25/08/2025', assessingDate: '26/08/2025', credits: 10 },
          { id: '8962-8967', code: '8962/8967', startDate: '27/08/2025', endDate: '05/09/2025', summativeDate: '08/09/2025', assessingDate: '09/09/2025', credits: 10 },
        ]
      },
      {
        moduleNumber: 3,
        unitStandards: [
          { id: '119673', code: '119673', startDate: '25/09/2025', endDate: '01/10/2025', summativeDate: '02/10/2025', assessingDate: '03/10/2025', credits: 7 },
          { id: '119669', code: '119669', startDate: '06/10/2025', endDate: '09/10/2025', summativeDate: '10/10/2025', assessingDate: '13/10/2025', credits: 6 },
          { id: '119672', code: '119672', startDate: '14/10/2025', endDate: '20/10/2025', summativeDate: '21/10/2025', assessingDate: '22/10/2025', credits: 7 },
          { id: '114974', code: '114974', startDate: '23/10/2025', endDate: '23/10/2025', summativeDate: '24/10/2025', assessingDate: '27/10/2025', credits: 2 },
        ]
      },
      {
        moduleNumber: 4,
        unitStandards: [
          { id: '119667', code: '119667', startDate: '11/11/2025', endDate: '18/11/2025', summativeDate: '19/11/2025', assessingDate: '20/11/2025', credits: 8 },
          { id: '119712', code: '119712', startDate: '21/11/2025', endDate: '28/11/2025', summativeDate: '01/12/2025', assessingDate: '02/12/2025', credits: 8 },
          { id: '119671', code: '119671', startDate: '03/12/2025', endDate: '12/12/2025', summativeDate: '13/01/2026', assessingDate: '13/01/2026', credits: 10 },
        ]
      },
      {
        moduleNumber: 5,
        unitStandards: [
          { id: '119666', code: '119666', startDate: '28/01/2026', endDate: '04/02/2026', summativeDate: '05/02/2026', assessingDate: '06/02/2026', credits: 10 },
          { id: '119670', code: '119670', startDate: '09/02/2026', endDate: '16/02/2026', summativeDate: '17/02/2026', assessingDate: '18/02/2026', credits: 8 },
          { id: '119674', code: '119674', startDate: '19/02/2026', endDate: '02/03/2026', summativeDate: '03/03/2026', assessingDate: '04/03/2026', credits: 10 },
        ]
      },
      {
        moduleNumber: 6,
        unitStandards: [
          { id: '119668', code: '119668', startDate: '19/03/2026', endDate: '26/03/2026', summativeDate: '27/03/2026', assessingDate: '30/03/2026', credits: 8 },
          { id: '13932', code: '13932', startDate: '31/03/2026', endDate: '07/04/2026', summativeDate: '08/04/2026', assessingDate: '09/04/2026', credits: 5 },
          { id: '13929', code: '13929', startDate: '10/04/2026', endDate: '13/04/2026', summativeDate: '14/04/2026', assessingDate: '15/04/2026', credits: 3 },
          { id: '13930', code: '13930', startDate: '16/04/2026', endDate: '17/04/2026', summativeDate: '20/04/2026', assessingDate: '21/04/2026', credits: 4 },
          { id: '114959', code: '114959', startDate: '22/04/2026', endDate: '24/04/2026', summativeDate: '28/04/2026', assessingDate: '29/04/2026', credits: 4 },
          { id: '113924', code: '113924', startDate: '30/04/2026', endDate: '30/04/2026', summativeDate: '04/05/2026', assessingDate: '05/05/2026', credits: 2 },
        ]
      }
    ]
  },
  'WAHL CLIPPERS (LP) - 2025': {
    startDate: '01/05/2025',
    endDate: '30/04/2026',
    modules: [
      {
        moduleNumber: 1,
        unitStandards: [
          { id: '7480', code: '7480', startDate: '05/05/2025', endDate: '06/05/2025', summativeDate: '07/05/2025', assessingDate: '08/05/2025', credits: 3 },
          { id: '9008', code: '9008', startDate: '09/05/2025', endDate: '12/05/2025', summativeDate: '13/05/2025', assessingDate: '14/05/2025', credits: 3 },
          { id: '9007', code: '9007', startDate: '15/05/2025', endDate: '19/05/2025', summativeDate: '20/05/2025', assessingDate: '21/05/2025', credits: 5 },
          { id: '7469', code: '7469', startDate: '22/05/2025', endDate: '23/05/2025', summativeDate: '26/05/2025', assessingDate: '27/05/2025', credits: 2 },
          { id: '9009', code: '9009', startDate: '28/05/2025', endDate: '29/05/2025', summativeDate: '30/05/2025', assessingDate: '02/06/2025', credits: 3 },
        ]
      },
      {
        moduleNumber: 2,
        unitStandards: [
          { id: '13915', code: '13915', startDate: '17/06/2025', endDate: '18/06/2025', summativeDate: '19/06/2025', assessingDate: '20/06/2025', credits: 4 },
          { id: '8963-8964', code: '8963/8964', startDate: '22/06/2025', endDate: '23/06/2025', summativeDate: '25/06/2025', assessingDate: '26/06/2025', credits: 10 },
          { id: '8962-8967', code: '8962/8967', startDate: '27/06/2025', endDate: '08/07/2025', summativeDate: '09/07/2025', assessingDate: '10/07/2025', credits: 10 },
        ]
      },
      {
        moduleNumber: 3,
        unitStandards: [
          { id: '119673', code: '119673', startDate: '28/07/2025', endDate: '01/08/2025', summativeDate: '04/08/2025', assessingDate: '05/08/2025', credits: 7 },
          { id: '119669', code: '119669', startDate: '06/08/2025', endDate: '11/08/2025', summativeDate: '12/08/2025', assessingDate: '13/08/2025', credits: 6 },
          { id: '119672', code: '119672', startDate: '14/08/2025', endDate: '20/08/2025', summativeDate: '21/08/2025', assessingDate: '22/08/2025', credits: 7 },
          { id: '114974', code: '114974', startDate: '25/08/2025', endDate: '26/08/2025', summativeDate: '27/08/2025', assessingDate: '28/08/2025', credits: 2 },
        ]
      },
      {
        moduleNumber: 4,
        unitStandards: [
          { id: '119667', code: '119667', startDate: '15/09/2025', endDate: '23/09/2025', summativeDate: '25/09/2025', assessingDate: '26/09/2025', credits: 8 },
          { id: '119712', code: '119712', startDate: '29/09/2025', endDate: '06/10/2025', summativeDate: '07/10/2025', assessingDate: '08/10/2025', credits: 8 },
          { id: '119671', code: '119671', startDate: '09/10/2025', endDate: '17/10/2025', summativeDate: '20/10/2025', assessingDate: '21/10/2025', credits: 10 },
        ]
      },
      {
        moduleNumber: 5,
        unitStandards: [
          { id: '119666', code: '119666', startDate: '03/11/2025', endDate: '10/11/2025', summativeDate: '11/11/2025', assessingDate: '12/11/2025', credits: 10 },
          { id: '119670', code: '119670', startDate: '13/11/2025', endDate: '20/11/2025', summativeDate: '21/11/2025', assessingDate: '24/11/2025', credits: 8 },
          { id: '119674', code: '119674', startDate: '25/11/2025', endDate: '03/12/2025', summativeDate: '04/12/2025', assessingDate: '05/12/2025', credits: 10 },
        ]
      },
      {
        moduleNumber: 6,
        unitStandards: [
          { id: '119668', code: '119668', startDate: '19/01/2026', endDate: '26/01/2026', summativeDate: '27/01/2026', assessingDate: '28/01/2026', credits: 8 },
          { id: '13932', code: '13932', startDate: '29/01/2026', endDate: '03/02/2026', summativeDate: '04/02/2026', assessingDate: '05/02/2026', credits: 5 },
          { id: '13929', code: '13929', startDate: '06/02/2026', endDate: '12/02/2026', summativeDate: '16/02/2026', assessingDate: '17/02/2026', credits: 3 },
          { id: '13930', code: '13930', startDate: '18/02/2026', endDate: '20/02/2026', summativeDate: '23/02/2026', assessingDate: '24/02/2026', credits: 4 },
          { id: '114959', code: '114959', startDate: '25/02/2026', endDate: '26/02/2026', summativeDate: '27/02/2026', assessingDate: '02/03/2026', credits: 4 },
          { id: '113924', code: '113924', startDate: '25/02/2026', endDate: '26/02/2026', summativeDate: '27/02/2026', assessingDate: '02/03/2026', credits: 2 },
        ]
      }
    ]
  }
};

async function updateGroups() {
  console.log('Updating rollout plans...\n');

  for (const [groupName, plan] of Object.entries(rolloutPlans)) {
    try {
      const group = await prisma.group.findFirst({
        where: { name: groupName }
      });

      if (!group) {
        console.log(`✗ Group not found: ${groupName}`);
        continue;
      }

      const unitCount = plan.modules.reduce((sum, m) => sum + m.unitStandards.length, 0);

      await prisma.group.update({
        where: { id: group.id },
        data: {
          notes: JSON.stringify({ rolloutPlan: plan })
        }
      });

      console.log(`✓ ${groupName}`);
      console.log(`  ├─ Modules: ${plan.modules.length}`);
      console.log(`  ├─ Unit Standards: ${unitCount}`);
      console.log(`  └─ Period: ${plan.startDate} to ${plan.endDate}\n`);
    } catch (e) {
      console.error(`✗ Error updating ${groupName}:`, e.message);
    }
  }

  await prisma.$disconnect();
  console.log('Done!');
}

updateGroups().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
