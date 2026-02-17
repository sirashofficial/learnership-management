#!/usr/bin/env node
/**
 * Comprehensive Rollout Plan Seeder
 * Parses all authoritative markdown rollout plans and populates the database
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Parse DD/MM/YYYY to Date
function parseDate(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    return new Date(match[3], match[2] - 1, match[1]);
  }
  return null;
}

// Parse unit standards from markdown content
function parseRolloutMarkdown(content) {
  const units = [];
  
  // Enhanced regex to capture unit standard blocks
  const unitPattern = 
    /### Unit Standard (\d+(?:\/\d+)?):.*?\n([\s\S]*?)(?=(?:###|Workplace Activity|## MODULE|\*\*Workplace Activity|$))/gi;

  let match;
  while ((match = unitPattern.exec(content)) !== null) {
    const unitId = match[1];
    const block = match[2];

    // Extract dates
    const startMatch = /\*\*Start Date:\*\*\s*(\d{1,2}\/\d{1,2}\/\d{4})/i.exec(block);
    const endMatch = /\*\*End Date:\*\*\s*(\d{1,2}\/\d{1,2}\/\d{4})/i.exec(block);
    const summativeMatch = /\*\*Summative Date:\*\*\s*(\d{1,2}\/\d{1,2}\/\d{4})/i.exec(block);
    const assessingMatch = /\*\*Assessing Date:\*\*\s*(\d{1,2}\/\d{1,2}\/\d{4})/i.exec(block);

    // Extract from table format (for Flint/Wahl)
    const tableMatch = 
      /\|\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*\|\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*\|\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*\|\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*\|\s*(\d+(?:\/\d+)?)/i.exec(block);

    let startDate, endDate, summativeDate, assessingDate;

    if (tableMatch) {
      // Table format
      startDate = parseDate(tableMatch[1]);
      endDate = parseDate(tableMatch[2]);
      summativeDate = parseDate(tableMatch[3]);
      assessingDate = parseDate(tableMatch[4]);
    } else {
      // Markdown format
      startDate = startMatch ? parseDate(startMatch[1]) : null;
      endDate = endMatch ? parseDate(endMatch[1]) : null;
      summativeDate = summativeMatch ? parseDate(summativeMatch[1]) : null;
      assessingDate = assessingMatch ? parseDate(assessingMatch[1]) : null;
    }

    if (startDate && endDate) {
      units.push({
        id: unitId.replace(/\//g, '-'), // e.g., "7480" or "8963-8964"
        standardId: unitId,
        startDate,
        endDate,
        summativeDate,
        assessingDate,
      });
    }
  }

  return units;
}

// Map unit standard IDs to database unit standard IDs
async function getUnitStandardId(unitCode) {
  // First, find by code
  let us = await prisma.unitStandard.findFirst({
    where: {
      code: {
        contains: unitCode.split('/')[0], // Take the first part if combined
      },
    },
  });

  if (!us) {
    // Try the full code
    us = await prisma.unitStandard.findFirst({
      where: {
        code: unitCode,
      },
    });
  }

  return us?.id || null;
}

async function seedRolloutPlans() {
  console.log('\n' + '='.repeat(100));
  console.log('ROLLOUT PLAN SEEDING SCRIPT');
  console.log('='.repeat(100) + '\n');

  const rolloutDir = path.join(__dirname, '..', 'public', 'rollout-plans');
  const nvcPath = path.join(__dirname, '..', '..', 'NVC_Implementation_Plan.md');

  const files = [
    {
      path: nvcPath,
      groupNames: ['FLINT GROUP (LP) - 2025', 'WAHL CLIPPERS (LP) - 2025'],
      sections: ['FLINT GROUP', 'WAHL GROUP'],
    },
    {
      path: path.join(rolloutDir, 'Azelis_2025_Rollout_Plan.md'),
      groupNames: ['AZELIS (LP) - 2025'],
    },
    {
      path: path.join(rolloutDir, 'Azelis_2026_Rollout_Plan.md'),
      groupNames: ['AZELIS SA (LP) - 2026'],
    },
    {
      path: path.join(rolloutDir, 'Monteagle_2025_Rollout_Plan.md'),
      groupNames: ['MONTEAGLE (LP) - 2025'],
    },
    {
      path: path.join(rolloutDir, 'Monteagle_Group_2026_Rollout_Plan.md'),
      groupNames: ['MONTEAGLE (LP) - 2026'],
    },
    {
      path: path.join(rolloutDir, 'Packaging_World_2026_Rollout_Plan.md'),
      groupNames: ['PACKAGING WORLD (LP) - 2025'],
    },
    {
      path: path.join(rolloutDir, 'Beyond_Insights_2026_Rollout_Plan.md'),
      groupNames: ['BEYOND INSIGHTS (LP) - 2026'],
    },
    {
      path: path.join(rolloutDir, 'City_Logistics_2026_Rollout_Plan.md'),
      groupNames: ['CITY LOGISTICS (LP) - 2026'],
    },
  ];

  let seedCount = 0;
  let errorCount = 0;

  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      console.log(`⚠ Skipping: File not found - ${file.path}`);
      continue;
    }

    const content = fs.readFileSync(file.path, 'utf-8');
    
    // If this is the NVC file, handle sections separately
    if (file.sections) {
      for (let i = 0; i < file.groupNames.length; i++) {
        const groupName = file.groupNames[i];
        const section = file.sections[i];
        
        // Extract section content
        const sectionStart = content.indexOf(`# ${section}`);
        if (sectionStart === -1) {
          console.log(`⚠ Section not found: # ${section}`);
          continue;
        }

        const sectionEnd = i < file.sections.length - 1 
          ? content.indexOf(`# ${file.sections[i + 1]}`, sectionStart)
          : content.length;

        const sectionContent = content.substring(sectionStart, sectionEnd);
        await seedGroup(groupName, sectionContent);
        seedCount++;
      }
    } else {
      for (const groupName of file.groupNames) {
        await seedGroup(groupName, content);
        seedCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log(`Seeding Complete: ${seedCount} groups updated`);
  console.log('='.repeat(100) + '\n');
}

async function seedGroup(groupName, content) {
  try {
    // Find group
    const group = await prisma.group.findFirst({
      where: {
        name: groupName,
      },
    });

    if (!group) {
      console.log(`✗ Group not found: ${groupName}`);
      return;
    }

    // Parse rollout data
    const units = parseRolloutMarkdown(content);
    console.log(`✓ ${groupName} | Parsed ${units.length} unit standards`);

    // Clear existing rollout records for this group
    await prisma.unitStandardRollout.deleteMany({
      where: {
        groupId: group.id,
      },
    });

    let createdCount = 0;

    // Create rollout records
    for (const unit of units) {
      try {
        // The unit standards might not exist in DB, so we'll create entries anyway
        // or find existing ones
        const existingUnit = await prisma.unitStandard.findFirst({
          where: {
            code: {
              contains: unit.standardId.split('/')[0],
            },
          },
        });

        if (existingUnit) {
          await prisma.unitStandardRollout.create({
            data: {
              groupId: group.id,
              unitStandardId: existingUnit.id,
              startDate: unit.startDate,
              endDate: unit.endDate,
              summativeDate: unit.summativeDate,
              assessingDate: unit.assessingDate,
            },
          });
          createdCount++;
        }
      } catch (e) {
        // Unit standard might not exist, skip silently
        // console.log(`  - Skipped unit: ${unit.standardId}`);
      }
    }

    console.log(`  ├─ Created ${createdCount} rollout records`);
  } catch (error) {
    console.error(`✗ Error processing ${groupName}:`, error.message);
  }
}

seedRolloutPlans()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
