const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.group.findFirst({
  where: { name: { contains: 'monteagle', mode: 'insensitive' } },
  select: { id: true, name: true, startDate: true, endDate: true, notes: true }
}).then(g => {
  if (!g) { console.log('Not found'); return; }
  console.log('Name:', g.name);
  console.log('Group Start:', g.startDate, 'Group End:', g.endDate);
  if (g.notes) {
    try {
      const parsed = JSON.parse(g.notes);
      const plan = parsed.rolloutPlan;
      if (plan) {
        console.log('Plan startDate:', plan.startDate, 'endDate:', plan.endDate);
        if (plan.modules) plan.modules.forEach(m => {
          const us = m.unitStandards || [];
          console.log('Module', m.moduleNumber, '| first unit start:', us[0]?.startDate, '| last unit end:', us[us.length-1]?.endDate, '| workplaceEnd:', m.workplaceActivityEndDate);
        });
      } else {
        console.log('No rolloutPlan key in notes');
        console.log('Notes keys:', Object.keys(parsed));
      }
    } catch(e) { console.log('Notes parse error:', e.message); }
  } else {
    console.log('No notes field');
  }
}).finally(() => db.$disconnect());
