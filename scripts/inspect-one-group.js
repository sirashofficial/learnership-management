const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const group = await prisma.group.findFirst({
    where: { name: 'FLINT GROUP (LP) - 2025' }
  });
  
  if (!group || !group.notes) {
    console.log('No group or notes found');
    process.exit(0);
  }
  
  try {
    const notes = JSON.parse(group.notes);
    const rp = notes.rolloutPlan;
    console.log('FLINT GROUP Rollout Plan Structure:');
    console.log('=====================================');
    console.log(`Group Name: ${rp.groupName}`);
    console.log(`Start: ${rp.startDate}`);
    console.log(`End: ${rp.endDate}`);
    console.log(`Modules: ${rp.modules.length}`);
    
    let totalUnits = 0;
    for (const mod of rp.modules) {
      const units = mod.unitStandards || [];
      totalUnits += units.length;
      console.log(`\nModule ${mod.moduleNumber}: ${units.length} units`);
      if (units.length > 0) {
        const sample = units[0];
        console.log(`  - Sample: ${sample.code} (${sample.credits} credits) ${sample.startDate || 'n/a'} → ${sample.endDate || 'n/a'}`);
      }
    }
    
    console.log(`\nTOTAL UNITS: ${totalUnits}`);
  } catch (e) {
    console.error('Parse error:', e.message);
  }
  
  await prisma.$disconnect();
})();
