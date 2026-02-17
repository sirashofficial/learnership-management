#!/usr/bin/env node
/**
 * Comprehensive Rollout Plan Analysis Report
 * Compares current DB state with authoritative source documents
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper to parse DD/MM/YYYY dates
function parseDate(dateStr) {
  if (!dateStr) return null;
  // Try DD/MM/YYYY format first
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    return new Date(match[3], match[2] - 1, match[1]);
  }
  return null;
}

async function analyzeRolloutPlans() {
  console.log('\n' + '='.repeat(100));
  console.log('ROLLOUT PLAN ANALYSIS REPORT');
  console.log('='.repeat(100) + '\n');

  const groups = await prisma.group.findMany({
    include: {
      unitStandardRollouts: true,
    },
  });

  const analysis = {
    totalGroups: groups.length,
    groups: [],
  };

  for (const group of groups) {
    const unitCount = group.unitStandardRollouts?.length || 0;

    let minDate = null,
      maxDate = null;

    if (group.unitStandardRollouts && group.unitStandardRollouts.length > 0) {
      for (const rollout of group.unitStandardRollouts) {
        if (rollout.startDate) {
          const d = new Date(rollout.startDate);
          if (!minDate || d < minDate) minDate = d;
        }
        if (rollout.endDate) {
          const d = new Date(rollout.endDate);
          if (!maxDate || d > maxDate) maxDate = d;
        }
      }
    }

    analysis.groups.push({
      name: group.name,
      companyName: group.name, // Fallback
      modules: 6, // Standard count
      unitStandards: unitCount,
      startDate: minDate ? minDate.toISOString().split('T')[0] : 'N/A',
      endDate: maxDate ? maxDate.toISOString().split('T')[0] : 'N/A',
    });
  }

  // Sort by group name
  analysis.groups.sort((a, b) => a.name.localeCompare(b.name));

  // Print summary table
  console.log('CURRENT DATABASE STATE:\n');
  console.log(
    'Group Name'.padEnd(45) +
      'Modules'.padEnd(10) +
      'Units'.padEnd(8) +
      'Start Date'.padEnd(12) +
      'End Date'
  );
  console.log('-'.repeat(100));

  for (const g of analysis.groups) {
    console.log(
      g.name.padEnd(45) +
        String(g.modules).padEnd(10) +
        String(g.unitStandards).padEnd(8) +
        g.startDate.padEnd(12) +
        g.endDate
    );
  }

  console.log('\n' + '='.repeat(100));
  console.log('AUTHORITATIVE SOURCE DOCUMENT DATA:\n');

  const sourceData = {
    'FLINT GROUP (LP) - 2025': {
      startDate: '01/07/2025',
      endDate: '30/06/2026',
      unitCount: 28,
      modules: 6,
      notes: 'From: NVC_Implementation_Plan.md',
    },
    'WAHL CLIPPERS (LP) - 2025': {
      startDate: '01/05/2025',
      endDate: '30/04/2026',
      unitCount: 30,
      modules: 6,
      notes: 'From: NVC_Implementation_Plan.md',
    },
    'AZELIS (LP) - 2025': {
      startDate: '01/08/2025',
      endDate: '31/07/2026',
      unitCount: 24,
      modules: 6,
      notes: 'From: public/rollout-plans/Azelis_2025_Rollout_Plan.md',
    },
    'AZELIS SA (LP) - 2026': {
      startDate: '28/11/2025',
      endDate: '27/11/2026',
      unitCount: 24,
      modules: 6,
      notes: 'From: public/rollout-plans/Azelis_2026_Rollout_Plan.md',
    },
    'MONTEAGLE (LP) - 2025': {
      startDate: '01/03/2025',
      endDate: '28/02/2026',
      unitCount: 24,
      modules: 6,
      notes: 'From: public/rollout-plans/Monteagle_2025_Rollout_Plan.md',
    },
    'MONTEAGLE (LP) - 2026': {
      startDate: '20/11/2025',
      endDate: '19/11/2026',
      unitCount: 24,
      modules: 6,
      notes: 'From: public/rollout-plans/Monteagle_Group_2026_Rollout_Plan.md',
    },
    'PACKAGING WORLD (LP) - 2025': {
      startDate: '01/09/2025',
      endDate: '31/08/2026',
      unitCount: 24,
      modules: 6,
      notes: 'From: public/rollout-plans/Packaging_World_2026_Rollout_Plan.md',
    },
    'BEYOND INSIGHTS (LP) - 2026': {
      startDate: '01/01/2026',
      endDate: '31/12/2026',
      unitCount: 24,
      modules: 6,
      notes: 'From: public/rollout-plans/Beyond_Insights_2026_Rollout_Plan.md',
    },
    'CITY LOGISTICS (LP) - 2026': {
      startDate: '01/12/2025',
      endDate: '30/11/2026',
      unitCount: 24,
      modules: 6,
      notes: 'From: public/rollout-plans/City_Logistics_2026_Rollout_Plan.md',
    },
  };

  console.log(
    'Group Name'.padEnd(45) +
      'Expected Units'.padEnd(16) +
      'Current Units'.padEnd(16) +
      'Match'
  );
  console.log('-'.repeat(100));

  for (const [groupName, source] of Object.entries(sourceData)) {
    const current = analysis.groups.find((g) => g.name === groupName);
    const currentUnits = current?.unitStandards || 0;
    const match = currentUnits === source.unitCount ? '✓' : '✗ MISMATCH';
    console.log(
      groupName.padEnd(45) +
        String(source.unitCount).padEnd(16) +
        String(currentUnits).padEnd(16) +
        match
    );
  }

  console.log('\n' + '='.repeat(100));
  console.log('DETAILED SOURCE DATA:\n');

  for (const [groupName, source] of Object.entries(sourceData)) {
    console.log(`${groupName}`);
    console.log(`  Start: ${source.startDate} | End: ${source.endDate}`);
    console.log(`  Units: ${source.unitCount} | Modules: ${source.modules}`);
    console.log(`  Source: ${source.notes}\n`);
  }

  console.log('='.repeat(100) + '\n');
}

analyzeRolloutPlans()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
