#!/usr/bin/env node
/**
 * Comprehensive Rollout Plan Updater
 * Parses authoritative markdown files and updates Group.notes with complete rollout data
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Parse DD/MM/YYYY to string in same format
function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  return dateStr.trim();
}

// Parse unit standards from markdown table format (Flint/Wahl)
function parseTableFormat(content) {
  const modules = {};

  // Split by MODULE sections
  const matches = Array.from(content.matchAll(/## MODULE (\d+)/gi));
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const moduleNum = parseInt(match[1], 10);
    const sectionStart = typeof match.index === 'number' ? match.index : 0;
    const nextMatch = matches[i + 1];
    const sectionEnd = nextMatch && typeof nextMatch.index === 'number' ? nextMatch.index : content.length;

    const moduleContent = content.substring(sectionStart, sectionEnd);

    // Parse table rows
    const tableRows = moduleContent.split('\n').filter((line) => line.startsWith('|') && line.includes('/'));

    const unitStandards = [];
    for (const row of tableRows) {
      const cols = row.split('|').map((c) => c.trim()).filter((c) => c);
      if (cols.length >= 5) {
        // Format: startDate | endDate | summativeDate | assessingDate | unitId | title | credits
        const unit = {
          id: cols[4],
          code: cols[4],
          title: cols.length > 5 ? cols[5] : '',
          startDate: parseDate(cols[0]),
          endDate: parseDate(cols[1]),
          summativeDate: parseDate(cols[2]),
          assessingDate: parseDate(cols[3]),
          credits: cols.length > 6 ? parseInt(cols[6]) || 0 : 0,
        };
        unitStandards.push(unit);
      }
    }

    if (unitStandards.length > 0) {
      modules[moduleNum] = { moduleNumber: moduleNum, unitStandards };
    }
  }

  return modules;
}

// Parse unit standards from markdown list format
function parseListFormat(content) {
  const modules = {};

  // Split by MODULE sections
  const lines = content.split('\n');
  let currentModule = null;
  let unitStandards = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for MODULE header
    const moduleMatch = /^## MODULE (\d+)/.exec(line);
    if (moduleMatch) {
      // Save previous module
      if (currentModule !== null && unitStandards.length > 0) {
        modules[currentModule] = { moduleNumber: currentModule, unitStandards };
      }
      currentModule = parseInt(moduleMatch[1]);
      unitStandards = [];
      continue;
    }

    // Check for Unit Standard header
    const unitMatch = /^### Unit Standard ([\d/]+)/.exec(line);
    if (unitMatch && currentModule !== null) {
      const unitId = unitMatch[1];

      // Extract dates from subsequent lines
      let startDate = '';
      let endDate = '';
      let summativeDate = '';
      let assessingDate = '';
      let credits = 0;

      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const nextLine = lines[j];

        let dateMatch = /^- \*\*Start Date:\*\*\s*(.+)/.exec(nextLine);
        if (dateMatch) startDate = parseDate(dateMatch[1]);

        dateMatch = /^- \*\*End Date:\*\*\s*(.+)/.exec(nextLine);
        if (dateMatch) endDate = parseDate(dateMatch[1]);

        dateMatch = /^- \*\*Summative Date:\*\*\s*(.+)/.exec(nextLine);
        if (dateMatch) summativeDate = parseDate(dateMatch[1]);

        dateMatch = /^- \*\*Assessing Date:\*\*\s*(.+)/.exec(nextLine);
        if (dateMatch) assessingDate = parseDate(dateMatch[1]);

        const creditsMatch = /^- \*\*Credits:\*\*\s*(\d+)/.exec(nextLine);
        if (creditsMatch) credits = parseInt(creditsMatch[1]);

        // Stop at next unit or workplace activity
        if (/^(#{2,3} |Workplace Activity)/.test(nextLine)) break;
      }

      if (startDate || endDate) {
        unitStandards.push({
          id: unitId,
          code: unitId,
          title: '',
          startDate,
          endDate,
          summativeDate,
          assessingDate,
          credits,
        });
      }
    }
  }

  // Save last module
  if (currentModule !== null && unitStandards.length > 0) {
    modules[currentModule] = { moduleNumber: currentModule, unitStandards };
  }

  return modules;
}

// Detect and parse the appropriate format
function parseRolloutData(content) {
  // Check if it's table format (contains | delimiters in data)
  const hasTableFormat = /\|\s*\d{1,2}\/\d{1,2}\/\d{4}/.test(content);

  let modules = {};
  if (hasTableFormat) {
    modules = parseTableFormat(content);
  } else {
    modules = parseListFormat(content);
  }

  // Convert to array
  return Object.values(modules);
}

// Extract group dates from content
function extractGroupDates(content) {
  const startMatch = /\*\*Start Date:\*\*\s*(\d{1,2}\/\d{1,2}\/\d{4})/i.exec(content);
  const endMatch = /\*\*End Date:\*\*\s*(\d{1,2}\/\d{1,2}\/\d{4})/i.exec(content);

  return {
    startDate: startMatch ? parseDate(startMatch[1]) : '',
    endDate: endMatch ? parseDate(endMatch[1]) : '',
  };
}

async function updateRolloutPlan(groupName, content) {
  try {
    console.log(`\n→ Processing group: ${groupName}`);
    // Find group
    console.log(`  Finding group record...`);
    const group = await prisma.group.findFirst({
      where: { name: groupName },
    });
    console.log(`  Found group: ${group ? group.id : 'not found'}`);

    if (!group) {
      console.log(`✗ Group not found: ${groupName}`);
      return false;
    }

    // Parse rollout data
    const modules = parseRolloutData(content);
    const { startDate, endDate } = extractGroupDates(content);

    if (modules.length === 0) {
      console.log(`⚠ No modules found for: ${groupName}`);
      return false;
    }

    // Count units
    const unitCount = modules.reduce((sum, m) => sum + m.unitStandards.length, 0);

    // Create rollout plan object
    const rolloutPlan = {
      groupName,
      startDate,
      endDate,
      numLearners: 0,
      modules,
    };

    // Update group notes
    console.log(`  Updating notes for ${groupName}...`);
    await prisma.group.update({
      where: { id: group.id },
      data: {
        notes: JSON.stringify({ rolloutPlan }),
      },
    });

    console.log(`✓ ${groupName}`);
    console.log(`  ├─ Modules: ${modules.length} | Units: ${unitCount}`);
    console.log(`  └─ Period: ${startDate} to ${endDate}`);

    return true;

  } catch (error) {
    console.error(`✗ Error processing ${groupName}:`, error.message);
    return false;
  }
}

async function seedAllRolloutPlans() {
  console.log('\n' + '='.repeat(100));
  console.log('COMPREHENSIVE ROLLOUT PLAN SEEDING');
  console.log('='.repeat(100) + '\n');

  const baseDir = process.cwd();
  const rolloutDir = path.join(baseDir, 'public', 'rollout-plans');
  const nvcPath = path.join(baseDir, '..', 'NVC_Implementation_Plan.md');

  // Configuration for each group
  const configs = [
    {
      file: nvcPath,
      groupName: 'FLINT GROUP (LP) - 2025',
      section: 'FLINT GROUP',
    },
    {
      file: nvcPath,
      groupName: 'WAHL CLIPPERS (LP) - 2025',
      section: 'WAHL GROUP',
    },
    {
      file: path.join(rolloutDir, 'Azelis_2025_Rollout_Plan.md'),
      groupName: 'AZELIS (LP) - 2025',
    },
    {
      file: path.join(rolloutDir, 'Azelis_2026_Rollout_Plan.md'),
      groupName: 'AZELIS SA (LP) - 2026',
    },
    {
      file: path.join(rolloutDir, 'Monteagle_2025_Rollout_Plan.md'),
      groupName: 'MONTEAGLE (LP) - 2025',
    },
    {
      file: path.join(rolloutDir, 'Monteagle_Group_2026_Rollout_Plan.md'),
      groupName: 'MONTEAGLE (LP) - 2026',
    },
    {
      file: path.join(rolloutDir, 'Packaging_World_2026_Rollout_Plan.md'),
      groupName: 'PACKAGING WORLD (LP) - 2025',
    },
    {
      file: path.join(rolloutDir, 'Beyond_Insights_2026_Rollout_Plan.md'),
      groupName: 'BEYOND INSIGHTS (LP) - 2026',
    },
    {
      file: path.join(rolloutDir, 'City_Logistics_2026_Rollout_Plan.md'),
      groupName: 'CITY LOGISTICS (LP) - 2026',
    },
  ];

  let successCount = 0;
  let failureCount = 0;

  for (const config of configs) {
    console.log(`\nReading file: ${config.file}`);
    if (!fs.existsSync(config.file)) {
      console.log(`⚠ File not found: ${config.file}`);
      failureCount++;
      continue;
    }

    let content = fs.readFileSync(config.file, 'utf-8');

    // If this file has a section (NVC file), extract that section
    if (config.section) {
      const sectionStart = content.indexOf(`# ${config.section}`);
      if (sectionStart === -1) {
        console.log(`⚠ Section not found: # ${config.section}`);
        failureCount++;
        continue;
      }

      // Find the end of this section (next # heading or end of file)
      const nextSection = content.indexOf('\n# ', sectionStart + 1);
      const sectionEnd = nextSection === -1 ? content.length : nextSection;
      content = content.substring(sectionStart, sectionEnd);
    }

    const success = await updateRolloutPlan(config.groupName, content);
    success ? successCount++ : failureCount++;
  }

  console.log('\n' + '='.repeat(100));
  console.log(`Seeding Complete: ${successCount} groups updated, ${failureCount} failed`);
  console.log('='.repeat(100) + '\n');
}

seedAllRolloutPlans()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
