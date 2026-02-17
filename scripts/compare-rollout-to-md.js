#!/usr/bin/env node
/*
  Compare rollout plan data in the database to COMPLETE_ROLLOUT_VERIFICATION.md.
  Focuses on programme start/end and module date ranges from the MD file.
*/

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const mdPath = path.join(process.cwd(), 'COMPLETE_ROLLOUT_VERIFICATION.md');

function normalizeDate(value) {
  if (!value || typeof value !== 'string') return '';
  return value.trim();
}

function parseProgrammeOverview(lines) {
  const overview = new Map();
  let inTable = false;
  for (const line of lines) {
    if (line.startsWith('| # | Group Name |')) {
      inTable = true;
      continue;
    }
    if (inTable && line.trim().startsWith('|---')) continue;
    if (inTable) {
      if (!line.startsWith('|')) break;
      const cols = line.split('|').map((c) => c.trim());
      if (cols.length < 8) continue;
      const group = cols[2].replace(/\*\*/g, '').trim();
      const startDate = normalizeDate(cols[3]);
      const endDate = normalizeDate(cols[4]);
      const induction = normalizeDate(cols[5]);
      overview.set(group, { startDate, endDate, induction });
    }
  }
  return overview;
}

function parseGroupName(line) {
  let name = line.replace(/^###\s+/, '').trim();
  name = name.replace(/^[^A-Z]+/, '').trim();
  return name;
}

function parseModuleTable(lines, startIndex) {
  const modules = new Map();
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('### ')) break;
    if (!line.startsWith('| **Module')) continue;
    const dates = line.match(/(\d{2}\/\d{2}\/\d{4})/g) || [];
    if (dates.length >= 2) {
      const moduleMatch = line.match(/\*\*Module\s+(\d+)\*\*/);
      if (!moduleMatch) continue;
      const moduleNumber = parseInt(moduleMatch[1], 10);
      modules.set(moduleNumber, {
        startDate: normalizeDate(dates[0]),
        endDate: normalizeDate(dates[1]),
      });
    }
  }
  return modules;
}

function parseMd(content) {
  const lines = content.split(/\r?\n/);
  const overview = parseProgrammeOverview(lines);
  const groups = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('### ')) {
      const name = parseGroupName(line);
      const modules = parseModuleTable(lines, i + 1);
      if (modules.size > 0) {
        groups.set(name, { modules });
      }
    }
  }

  return { overview, groups };
}

function computeModuleRanges(rolloutPlan) {
  const modules = new Map();
  if (!rolloutPlan || !Array.isArray(rolloutPlan.modules)) return modules;

  for (const module of rolloutPlan.modules) {
    const unitStandards = Array.isArray(module.unitStandards) ? module.unitStandards : [];
    let minStart = '';
    let maxEnd = '';
    for (const unit of unitStandards) {
      const start = normalizeDate(unit.startDate);
      const end = normalizeDate(unit.assessingDate || unit.endDate);
      if (start && (!minStart || start < minStart)) minStart = start;
      if (end && (!maxEnd || end > maxEnd)) maxEnd = end;
    }
    if (module.moduleNumber != null) {
      modules.set(module.moduleNumber, { startDate: minStart, endDate: maxEnd });
    }
  }
  return modules;
}

function compareDates(label, mdDate, dbDate, diffs) {
  if (!mdDate || !dbDate) return;
  if (mdDate !== dbDate) {
    diffs.push(`${label}: md=${mdDate} db=${dbDate}`);
  }
}

async function run() {
  if (!fs.existsSync(mdPath)) {
    console.error(`MD file not found: ${mdPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(mdPath, 'utf-8');
  const { overview, groups } = parseMd(content);

  const dbGroups = await prisma.group.findMany({});

  const results = [];
  for (const [name, mdData] of groups.entries()) {
    const group = dbGroups.find((g) => g.name === name);
    if (!group || !group.notes) {
      results.push({ name, status: 'missing-db', diffs: [] });
      continue;
    }

    let notes;
    try {
      notes = JSON.parse(group.notes);
    } catch (error) {
      results.push({ name, status: 'invalid-notes', diffs: [error.message] });
      continue;
    }

    const rolloutPlan = notes.rolloutPlan;
    if (!rolloutPlan) {
      results.push({ name, status: 'missing-rollout', diffs: [] });
      continue;
    }

    const diffs = [];

    const overviewRow = overview.get(name);
    if (overviewRow) {
      compareDates('programme.startDate', overviewRow.startDate, normalizeDate(rolloutPlan.startDate), diffs);
      compareDates('programme.endDate', overviewRow.endDate, normalizeDate(rolloutPlan.endDate), diffs);
    }

    const dbModules = computeModuleRanges(rolloutPlan);
    for (const [moduleNumber, mdModule] of mdData.modules.entries()) {
      const dbModule = dbModules.get(moduleNumber);
      if (!dbModule) {
        diffs.push(`module ${moduleNumber}: missing in db`);
        continue;
      }
      compareDates(`module ${moduleNumber}.startDate`, mdModule.startDate, dbModule.startDate, diffs);
      compareDates(`module ${moduleNumber}.endDate`, mdModule.endDate, dbModule.endDate, diffs);
    }

    results.push({ name, status: diffs.length ? 'mismatch' : 'match', diffs });
  }

  console.log('COMPARE ROLLOUTS TO MD');
  console.log('='.repeat(80));
  for (const result of results) {
    console.log(`\n${result.name}: ${result.status}`);
    for (const diff of result.diffs) {
      console.log(`  - ${diff}`);
    }
  }

  console.log('\nNote: Workplace activity periods are not stored in Group.notes, so they are not compared.');
}

run()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
