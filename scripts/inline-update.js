const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  console.log('Updating Flint and Wahl groups...');

  // Flint data
  const flintPlan = {
    groupName: 'FLINT GROUP (LP) - 2025',
    startDate: '01/07/2025',
    endDate: '30/06/2026',
    numLearners: 12,
    modules: [
      { moduleNumber: 1, unitStandards: [{ id: '7480', code: '7480', title: '', startDate: '01/07/2025', endDate: '01/07/2025', summativeDate: '02/07/2025', assessingDate: '03/07/2025', credits: 2 }, { id: '9008', code: '9008', title: '', startDate: '04/07/2025', endDate: '04/07/2025', summativeDate: '07/07/2025', assessingDate: '08/07/2025', credits: 3 }, { id: '9007', code: '9007', title: '', startDate: '09/07/2025', endDate: '11/07/2025', summativeDate: '14/07/2025', assessingDate: '15/07/2025', credits: 5 }, { id: '7469', code: '7469', title: '', startDate: '16/07/2025', endDate: '16/07/2025', summativeDate: '17/07/2025', assessingDate: '18/07/2025', credits: 3 }, { id: '9009', code: '9009', title: '', startDate: '21/07/2025', endDate: '21/07/2025', summativeDate: '22/07/2025', assessingDate: '23/07/2025', credits: 3 }] },
      { moduleNumber: 2, unitStandards: [{ id: '13915', code: '13915', title: '', startDate: '07/08/2025', endDate: '08/08/2025', summativeDate: '11/08/2025', assessingDate: '12/08/2025', credits: 4 }, { id: '8963/8964', code: '8963/8964', title: '', startDate: '13/08/2025', endDate: '22/08/2025', summativeDate: '25/08/2025', assessingDate: '26/08/2025', credits: 10 }, { id: '8962/8967', code: '8962/8967', title: '', startDate: '27/08/2025', endDate: '05/09/2025', summativeDate: '08/09/2025', assessingDate: '09/09/2025', credits: 10 }] },
      { moduleNumber: 3, unitStandards: [{ id: '119673', code: '119673', title: '', startDate: '25/09/2025', endDate: '01/10/2025', summativeDate: '02/10/2025', assessingDate: '03/10/2025', credits: 7 }, { id: '119669', code: '119669', title: '', startDate: '06/10/2025', endDate: '09/10/2025', summativeDate: '10/10/2025', assessingDate: '13/10/2025', credits: 6 }, { id: '119672', code: '119672', title: '', startDate: '14/10/2025', endDate: '20/10/2025', summativeDate: '21/10/2025', assessingDate: '22/10/2025', credits: 7 }, { id: '114974', code: '114974', title: '', startDate: '23/10/2025', endDate: '23/10/2025', summativeDate: '24/10/2025', assessingDate: '27/10/2025', credits: 2 }] },
      { moduleNumber: 4, unitStandards: [{ id: '119667', code: '119667', title: '', startDate: '11/11/2025', endDate: '18/11/2025', summativeDate: '19/11/2025', assessingDate: '20/11/2025', credits: 8 }, { id: '119712', code: '119712', title: '', startDate: '21/11/2025', endDate: '28/11/2025', summativeDate: '01/12/2025', assessingDate: '02/12/2025', credits: 8 }, { id: '119671', code: '119671', title: '', startDate: '03/12/2025', endDate: '12/12/2025', summativeDate: '13/01/2026', assessingDate: '13/01/2026', credits: 10 }] },
      { moduleNumber: 5, unitStandards: [{ id: '119666', code: '119666', title: '', startDate: '28/01/2026', endDate: '04/02/2026', summativeDate: '05/02/2026', assessingDate: '06/02/2026', credits: 10 }, { id: '119670', code: '119670', title: '', startDate: '09/02/2026', endDate: '16/02/2026', summativeDate: '17/02/2026', assessingDate: '18/02/2026', credits: 8 }, { id: '119674', code: '119674', title: '', startDate: '19/02/2026', endDate: '02/03/2026', summativeDate: '03/03/2026', assessingDate: '04/03/2026', credits: 10 }] },
      { moduleNumber: 6, unitStandards: [{ id: '119668', code: '119668', title: '', startDate: '19/03/2026', endDate: '26/03/2026', summativeDate: '27/03/2026', assessingDate: '30/03/2026', credits: 8 }, { id: '13932', code: '13932', title: '', startDate: '31/03/2026', endDate: '07/04/2026', summativeDate: '08/04/2026', assessingDate: '09/04/2026', credits: 5 }, { id: '13929', code: '13929', title: '', startDate: '10/04/2026', endDate: '13/04/2026', summativeDate: '14/04/2026', assessingDate: '15/04/2026', credits: 3 }, { id: '13930', code: '13930', title: '', startDate: '16/04/2026', endDate: '17/04/2026', summativeDate: '20/04/2026', assessingDate: '21/04/2026', credits: 4 }, { id: '114959', code: '114959', title: '', startDate: '22/04/2026', endDate: '24/04/2026', summativeDate: '28/04/2026', assessingDate: '29/04/2026', credits: 4 }, { id: '113924', code: '113924', title: '', startDate: '30/04/2026', endDate: '30/04/2026', summativeDate: '04/05/2026', assessingDate: '05/05/2026', credits: 2 }] }
    ]
  };

  // Wahl data
  const wahlPlan = {
    groupName: 'WAHL CLIPPERS (LP) - 2025',
    startDate: '01/05/2025',
    endDate: '30/04/2026',
    numLearners: 0,
    modules: [
      { moduleNumber: 1, unitStandards: [{ id: '7480', code: '7480', title: '', startDate: '05/05/2025', endDate: '06/05/2025', summativeDate: '07/05/2025', assessingDate: '08/05/2025', credits: 3 }, { id: '9008', code: '9008', title: '', startDate: '09/05/2025', endDate: '12/05/2025', summativeDate: '13/05/2025', assessingDate: '14/05/2025', credits: 3 }, { id: '9007', code: '9007', title: '', startDate: '15/05/2025', endDate: '19/05/2025', summativeDate: '20/05/2025', assessingDate: '21/05/2025', credits: 5 }, { id: '7469', code: '7469', title: '', startDate: '22/05/2025', endDate: '23/05/2025', summativeDate: '26/05/2025', assessingDate: '27/05/2025', credits: 2 }, { id: '9009', code: '9009', title: '', startDate: '28/05/2025', endDate: '29/05/2025', summativeDate: '30/05/2025', assessingDate: '02/06/2025', credits: 3 }] },
      { moduleNumber: 2, unitStandards: [{ id: '13915', code: '13915', title: '', startDate: '17/06/2025', endDate: '18/06/2025', summativeDate: '19/06/2025', assessingDate: '20/06/2025', credits: 4 }, { id: '8963/8964', code: '8963/8964', title: '', startDate: '22/06/2025', endDate: '23/06/2025', summativeDate: '25/06/2025', assessingDate: '26/06/2025', credits: 10 }, { id: '8962/8967', code: '8962/8967', title: '', startDate: '27/06/2025', endDate: '08/07/2025', summativeDate: '09/07/2025', assessingDate: '10/07/2025', credits: 10 }] },
      { moduleNumber: 3, unitStandards: [{ id: '119673', code: '119673', title: '', startDate: '28/07/2025', endDate: '01/08/2025', summativeDate: '04/08/2025', assessingDate: '05/08/2025', credits: 7 }, { id: '119669', code: '119669', title: '', startDate: '06/08/2025', endDate: '11/08/2025', summativeDate: '12/08/2025', assessingDate: '13/08/2025', credits: 6 }, { id: '119672', code: '119672', title: '', startDate: '14/08/2025', endDate: '20/08/2025', summativeDate: '21/08/2025', assessingDate: '22/08/2025', credits: 7 }, { id: '114974', code: '114974', title: '', startDate: '25/08/2025', endDate: '26/08/2025', summativeDate: '27/08/2025', assessingDate: '28/08/2025', credits: 2 }] },
      { moduleNumber: 4, unitStandards: [{ id: '119667', code: '119667', title: '', startDate: '15/09/2025', endDate: '23/09/2025', summativeDate: '25/09/2025', assessingDate: '26/09/2025', credits: 8 }, { id: '119712', code: '119712', title: '', startDate: '29/09/2025', endDate: '06/10/2025', summativeDate: '07/10/2025', assessingDate: '08/10/2025', credits: 8 }, { id: '119671', code: '119671', title: '', startDate: '09/10/2025', endDate: '17/10/2025', summativeDate: '20/10/2025', assessingDate: '21/10/2025', credits: 10 }] },
      { moduleNumber: 5, unitStandards: [{ id: '119666', code: '119666', title: '', startDate: '03/11/2025', endDate: '10/11/2025', summativeDate: '11/11/2025', assessingDate: '12/11/2025', credits: 10 }, { id: '119670', code: '119670', title: '', startDate: '13/11/2025', endDate: '20/11/2025', summativeDate: '21/11/2025', assessingDate: '24/11/2025', credits: 8 }, { id: '119674', code: '119674', title: '', startDate: '25/11/2025', endDate: '03/12/2025', summativeDate: '04/12/2025', assessingDate: '05/12/2025', credits: 10 }] },
      { moduleNumber: 6, unitStandards: [{ id: '119668', code: '119668', title: '', startDate: '19/01/2026', endDate: '26/01/2026', summativeDate: '27/01/2026', assessingDate: '28/01/2026', credits: 8 }, { id: '13932', code: '13932', title: '', startDate: '29/01/2026', endDate: '03/02/2026', summativeDate: '04/02/2026', assessingDate: '05/02/2026', credits: 5 }, { id: '13929', code: '13929', title: '', startDate: '06/02/2026', endDate: '12/02/2026', summativeDate: '16/02/2026', assessingDate: '17/02/2026', credits: 3 }, { id: '13930', code: '13930', title: '', startDate: '18/02/2026', endDate: '20/02/2026', summativeDate: '23/02/2026', assessingDate: '24/02/2026', credits: 4 }, { id: '114959', code: '114959', title: '', startDate: '25/02/2026', endDate: '26/02/2026', summativeDate: '27/02/2026', assessingDate: '02/03/2026', credits: 4 }, { id: '113924', code: '113924', title: '', startDate: '25/02/2026', endDate: '26/02/2026', summativeDate: '27/02/2026', assessingDate: '02/03/2026', credits: 2 }] }
    ]
  };

  try {
    await prisma.group.updateMany({
      data: [
        { where: { name: 'FLINT GROUP (LP) - 2025' }, data: { notes: JSON.stringify({ rolloutPlan: flintPlan }) } },
        { where: { name: 'WAHL CLIPPERS (LP) - 2025' }, data: { notes: JSON.stringify({ rolloutPlan: wahlPlan }) } }
      ]
    });
    console.log('✓ Updated successfully');
  } catch (e) {
    // updateMany doesn't work that way - use update
    const flintGroup = await prisma.group.findFirst({ where: { name: 'FLINT GROUP (LP) - 2025' } });
    const wahlGroup = await prisma.group.findFirst({ where: { name: 'WAHL CLIPPERS (LP) - 2025' } });

    if (flintGroup) {
      await prisma.group.update({ where: { id: flintGroup.id }, data: { notes: JSON.stringify({ rolloutPlan: flintPlan }) } });
      console.log('✓ Flint updated');
    }

    if (wahlGroup) {
      await prisma.group.update({ where: { id: wahlGroup.id }, data: { notes: JSON.stringify({ rolloutPlan: wahlPlan }) } });
      console.log('✓ Wahl updated');
    }
  }

  await prisma.$disconnect();
}

main().catch(e => console.error(e));
