const fs = require('fs');
const path = require('path');

const baseDir = process.cwd();
const nvcPath = path.join(baseDir, '..', 'NVC_Implementation_Plan.md');

const content = fs.readFileSync(nvcPath, 'utf-8');

function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  return dateStr.trim();
}

function parseTableFormat(content) {
  const modules = {};
  const matches = Array.from(content.matchAll(/## MODULE (\d+)/gi));
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const moduleNum = parseInt(match[1], 10);
    const sectionStart = typeof match.index === 'number' ? match.index : 0;
    const nextMatch = matches[i + 1];
    const sectionEnd = nextMatch && typeof nextMatch.index === 'number' ? nextMatch.index : content.length;
    const moduleContent = content.substring(sectionStart, sectionEnd);
    const tableRows = moduleContent.split('\n').filter((line) => line.startsWith('|') && line.includes('/'));
    const unitStandards = [];
    for (const row of tableRows) {
      const cols = row.split('|').map((c) => c.trim()).filter((c) => c);
      if (cols.length >= 5) {
        unitStandards.push({
          id: cols[4],
          code: cols[4],
          startDate: parseDate(cols[0]),
          endDate: parseDate(cols[1]),
          summativeDate: parseDate(cols[2]),
          assessingDate: parseDate(cols[3]),
        });
      }
    }
    if (unitStandards.length > 0) {
      modules[moduleNum] = { moduleNumber: moduleNum, unitStandards };
    }
  }
  return modules;
}

function parseListFormat(content) {
  const modules = {};
  const lines = content.split('\n');
  let currentModule = null;
  let unitStandards = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const moduleMatch = /^## MODULE (\d+)/.exec(line);
    if (moduleMatch) {
      if (currentModule !== null && unitStandards.length > 0) {
        modules[currentModule] = { moduleNumber: currentModule, unitStandards };
      }
      currentModule = parseInt(moduleMatch[1]);
      unitStandards = [];
      continue;
    }
    const unitMatch = /^### Unit Standard ([\d/]+)/.exec(line);
    if (unitMatch && currentModule !== null) {
      const unitId = unitMatch[1];
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
        if (/^(#{2,3} |Workplace Activity)/.test(nextLine)) break;
      }
      if (startDate || endDate) {
        unitStandards.push({ id: unitId, code: unitId, startDate, endDate, summativeDate, assessingDate, credits });
      }
    }
  }
  if (currentModule !== null && unitStandards.length > 0) {
    modules[currentModule] = { moduleNumber: currentModule, unitStandards };
  }
  return modules;
}

function parseRolloutData(content) {
  const hasTableFormat = /\|\s*\d{1,2}\/\d{1,2}\/\d{4}/.test(content);
  return hasTableFormat ? parseTableFormat(content) : parseListFormat(content);
}

console.log('hasTableFormat:', /\|\s*\d{1,2}\/\d{1,2}\/\d{4}/.test(content));
const modules = parseRolloutData(content);
const moduleCount = Object.keys(modules).length;
const unitCount = Object.values(modules).reduce((sum, m) => sum + m.unitStandards.length, 0);
console.log('modules:', moduleCount, 'units:', unitCount);
