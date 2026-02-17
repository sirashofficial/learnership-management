#!/usr/bin/env node
/**
 * Fast Rollout Seeder from COMPLETE_ROLLOUT_VERIFICATION.md
 * Directly parses the verification MD and updates all 9 groups
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Parse programme overview table from MD
function parseProgrammeOverview(mdContent) {
  const overview = {};
  const lines = mdContent.split('\n');
  
  let inTable = false;
  for (const line of lines) {
    if (line.includes('| # | Group Name |')) {
      inTable = true;
      continue;
    }
    if (inTable && line.trim().startsWith('|---')) continue;
    if (inTable) {
      if (!line.startsWith('|')) break;
      
      const cols = line.split('|').map(c => c.trim());
      if (cols.length < 8) continue;
      
      const groupName = cols[2].replace(/\*\*/g, '').trim();
      const startDate = cols[3].trim();
      const endDate = cols[4].trim();
      const induction = cols[5].trim();
      
      overview[groupName] = { startDate, endDate, induction };
    }
  }
  
  return overview;
}

// Parse module details for each group
function parseGroupModules(mdContent, groupStartMarker) {
  const modules = [];
  const lines = mdContent.split('\n');
  
  // Find the group section
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(groupStartMarker)) {
      startIdx = i;
      break;
    }
  }
  
  if (startIdx === -1) return modules;
  
  // Find the module table
  let tableStart = -1;
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].includes('| Module | Date Range |')) {
      tableStart = i + 1;
      break;
    }
    // Stop if we hit the next group
    if (i > startIdx && lines[i].match(/^###\s+\d+️⃣/)) break;
  }
  
  if (tableStart === -1) return modules;
  
  // Parse table rows
  let moduleNumber = 1;
  for (let i = tableStart; i < lines.length; i++) {
    const line = lines[i];
    
    // Stop at next section
    if (!line.startsWith('|') || line.includes('---')) break;
    if (line.includes('Note:') || line.includes('for reference')) break;
    
    // Extract dates from row like: | **Module 1** | 03/03/2025 - 03/04/2025 | ... |
    const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/);
    
    if (dateMatch) {
      modules.push({
        moduleNumber: moduleNumber++,
        startDate: dateMatch[1],
        endDate: dateMatch[2]
      });
    }
  }
  
  return modules;
}

// Build complete rollout plan with 24 unit standards
function buildRolloutPlan(groupName, overview, modules) {
  const overviewData = overview[groupName] || {};
  
  // Master curriculum - same for all groups
  const masterModules = [
    {
      moduleNumber: 1,
      unitStandards: [
        { code: '7480', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 3 },
        { code: '9008', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 3 },
        { code: '9007', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 5 },
        { code: '7469', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 2 },
        { code: '9009', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 3 }
      ]
    },
    {
      moduleNumber: 2,
      unitStandards: [
        { code: '13915', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 4 },
        { code: '8963/8964', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 10 },
        { code: '8962/8967', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 10 }
      ]
    },
    {
      moduleNumber: 3,
      unitStandards: [
        { code: '119673', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 7 },
        { code: '119669', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 6 },
        { code: '119672', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 7 },
        { code: '114974', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 2 }
      ]
    },
    {
      moduleNumber: 4,
      unitStandards: [
        { code: '119667', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 8 },
        { code: '119712', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 8 },
        { code: '119671', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 10 }
      ]
    },
    {
      moduleNumber: 5,
      unitStandards: [
        { code: '119666', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 8 },
        { code: '119670', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 8 },
        { code: '119674', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 10 }
      ]
    },
    {
      moduleNumber: 6,
      unitStandards: [
        { code: '119668', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 8 },
        { code: '13932', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 5 },
        { code: '13929', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 3 },
        { code: '13930', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 4 },
        { code: '114959', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 4 },
        { code: '113924', startDate: '', endDate: '', summativeDate: '', assessingDate: '', credits: 2 }
      ]
    }
  ];
  
  // Assign module dates from parsed data
  for (const parsedModule of modules) {
    const masterModule = masterModules.find(m => m.moduleNumber === parsedModule.moduleNumber);
    if (masterModule) {
      // Distribute dates across units in the module
      const startDate = parsedModule.startDate;
      const endDate = parsedModule.endDate;
      
      // Simple distribution: first unit starts on startDate, dates progress through module
      for (let i = 0; i < masterModule.unitStandards.length; i++) {
        masterModule.unitStandards[i].startDate = startDate;
        masterModule.unitStandards[i].endDate = endDate;
        // Summative and assessing dates - just after end date for simplicity
        masterModule.unitStandards[i].summativeDate = endDate;
        masterModule.unitStandards[i].assessingDate = endDate;
      }
    }
  }
  
  return {
    groupName,
    startDate: overviewData.startDate || '',
    endDate: overviewData.endDate || '',
    induction: overviewData.induction || '',
    numLearners: 0,
    modules: masterModules
  };
}

async function seedFromMd() {
  const mdPath = path.join(process.cwd(), 'COMPLETE_ROLLOUT_VERIFICATION.md');
  
  if (!fs.existsSync(mdPath)) {
    console.error(`MD file not found: ${mdPath}`);
    process.exit(1);
  }
  
  const mdContent = fs.readFileSync(mdPath, 'utf-8');
  
  console.log('\n' + '='.repeat(100));
  console.log('FAST ROLLOUT SEEDING FROM MD');
  console.log('='.repeat(100) + '\n');
  
  const overview = parseProgrammeOverview(mdContent);
  
  const groupMappings = [
    { name: 'MONTEAGLE (LP) - 2025', marker: '1️⃣ MONTEAGLE (LP) - 2025' },
    { name: 'WAHL CLIPPERS (LP) - 2025', marker: '2️⃣ WAHL CLIPPERS (LP) - 2025' },
    { name: 'FLINT GROUP (LP) - 2025', marker: '3️⃣ FLINT GROUP (LP) - 2025' },
    { name: 'AZELIS (LP) - 2025', marker: '4️⃣ AZELIS (LP) - 2025' },
    { name: 'PACKAGING WORLD (LP) - 2025', marker: '5️⃣ PACKAGING WORLD (LP) - 2025' },
    { name: 'MONTEAGLE (LP) - 2026', marker: '6️⃣ MONTEAGLE (LP) - 2026' },
    { name: 'AZELIS SA (LP) - 2026', marker: '7️⃣ AZELIS SA (LP) - 2026' },
    { name: 'CITY LOGISTICS (LP) - 2026', marker: '8️⃣ CITY LOGISTICS (LP) - 2026' },
    { name: 'BEYOND INSIGHTS (LP) - 2026', marker: '9️⃣ BEYOND INSIGHTS (LP) - 2026' }
  ];
  
  let successCount = 0;
  
  for (const mapping of groupMappings) {
    const modules = parseGroupModules(mdContent, mapping.marker);
    const rolloutPlan = buildRolloutPlan(mapping.name, overview, modules);
    
    const group = await prisma.group.findFirst({
      where: { name: mapping.name }
    });
    
    if (!group) {
      console.log(`✗ Group not found: ${mapping.name}`);
      continue;
    }
    
    await prisma.group.update({
      where: { id: group.id },
      data: {
        notes: JSON.stringify({ rolloutPlan })
      }
    });
    
    console.log(`✓ ${mapping.name}`);
    console.log(`  ├─ Modules: ${modules.length} | Units: 24`);
    console.log(`  └─ ${modules[0]?.startDate || 'N/A'} to ${modules[modules.length-1]?.endDate || 'N/A'}`);
    
    successCount++;
  }
  
  console.log('\n' + '='.repeat(100));
  console.log(`Seeding Complete: ${successCount}/9 groups updated`);
  console.log('='.repeat(100) + '\n');
}

seedFromMd()
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
