#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function verify() {
  const prisma = new PrismaClient();
  const groups = await prisma.group.findMany();
  
  let output = 'VERIFICATION RESULTS\n' + '='.repeat(100) + '\n\n';
  
  for (const group of groups) {
    let plan = null;
    let unitCount = 0;
    let moduleCount = 0;
    
    if (group.notes) {
      try {
        plan = JSON.parse(group.notes).rolloutPlan;
        moduleCount = plan.modules?.length || 0;
        unitCount = plan.modules?.reduce((sum, m) => sum + (m.unitStandards?.length || 0), 0) || 0;
      } catch (e) {
        // ignore
      }
    }
    
    const status = unitCount === 24 ? '✓' : '✗';
    output += `${status} ${group.name.padEnd(45)} | Units: ${String(unitCount).padEnd(2)} | Modules: ${moduleCount}\n`;
  }
  
  output += '\n' + '='.repeat(100) + '\n';
  
  // Write to file
  fs.writeFileSync('verify_results.txt', output);
  console.log('Results written to verify_results.txt');
  
  await prisma.$disconnect();
}

verify().catch(e => console.error(e));
