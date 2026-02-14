const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const rolloutRoot = path.join(__dirname, 'Roll Out');

const SUFFIX_WORDS = ['sa', 'pty', 'ltd', 'ptyltd', 'group', 'co', 'company'];
const PREFERRED_MATCHES = [
  {
    group: 'monteagle 26',
    fileBase: 'monteagle_group_2026_rollout_plan',
  },
  {
    group: 'packaging world 25',
    fileBase: 'packaging_world_2026_rollout_plan',
  },
  {
    group: 'packing world 25',
    fileBase: 'packaging_world_2026_rollout_plan',
  },
];

function expandTwoDigitYear(value) {
  return String(value || '').replace(/\b(\d{2})'?\b/g, (_, year) => {
    const yearNum = Number(year);
    if (yearNum >= 20 && yearNum <= 30) {
      return `20${year}`;
    }
    return year;
  });
}

function normalizeName(value, { expandYears = false } = {}) {
  const expanded = expandYears ? expandTwoDigitYear(value) : String(value || '');
  return expanded.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function simplifyGroupName(value) {
  const cleaned = expandTwoDigitYear(value).replace(/[^a-z0-9\s]/gi, ' ');
  const tokens = cleaned
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .filter(token => !SUFFIX_WORDS.includes(token));
  return tokens.join(' ');
}

function extractYear(value) {
  const match = expandTwoDigitYear(value).match(/(19|20)\d{2}/);
  return match ? match[0] : null;
}

function extractStartDate(content) {
  const match = content.match(/^\s*\*{0,2}START\s*DATE\*{0,2}\s*[:\-]\s*(.+)$/im);
  if (!match) {
    return null;
  }
  const raw = match[1].replace(/[*_]/g, ' ').trim();
  const dateMatch = raw.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{1,2}-\d{1,2})/);
  return dateMatch ? dateMatch[1] : raw;
}

function parseDate(value) {
  if (!value) return null;
  const raw = value.trim();
  const dmY = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmY) {
    const day = Number(dmY[1]);
    const month = Number(dmY[2]);
    const year = Number(dmY[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date) {
  if (!date) return null;
  return date.toLocaleDateString('en-GB', { timeZone: 'UTC' });
}

async function listFiles(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function scoreMatch(group, file) {
  const groupNorm = normalizeName(group.name, { expandYears: true });
  const groupSimple = normalizeName(simplifyGroupName(group.name), { expandYears: false });
  const fileNorm = normalizeName(file.baseName, { expandYears: true });
  const groupYear = extractYear(group.name);

  let score = 0;
  if (groupNorm && fileNorm && groupNorm === fileNorm) {
    score = 3;
  } else if (groupNorm && fileNorm && (fileNorm.includes(groupNorm) || groupNorm.includes(fileNorm))) {
    score = 2;
  } else if (groupSimple && fileNorm && (fileNorm.includes(groupSimple) || groupSimple.includes(fileNorm))) {
    score = 1;
  }

  if (score > 0 && groupYear && file.baseName.includes(groupYear)) {
    score += 1;
  }

  return score;
}

function findPreferredFile(groupName, fileEntries) {
  const normalizedGroup = normalizeName(groupName, { expandYears: true });
  const preferred = PREFERRED_MATCHES.find(
    entry => normalizeName(entry.group, { expandYears: true }) === normalizedGroup
  );
  if (!preferred) {
    return null;
  }
  const target = normalizeName(preferred.fileBase, { expandYears: true });
  return (
    fileEntries.find(entry => normalizeName(entry.baseName, { expandYears: true }) === target) ||
    fileEntries.find(entry => normalizeName(entry.baseName, { expandYears: true }).includes(target)) ||
    null
  );
}

async function main() {
  const files = await listFiles(rolloutRoot);
  const fileEntries = await Promise.all(
    files.map(async filePath => {
      const baseName = path.basename(filePath, path.extname(filePath));
      const content = await fs.promises.readFile(filePath, 'utf8');
      const startDateRaw = extractStartDate(content);
      const startDateParsed = parseDate(startDateRaw);
      return {
        filePath,
        fileName: path.basename(filePath),
        baseName,
        startDateRaw,
        startDateParsed,
      };
    })
  );

  const groups = await prisma.group.findMany({
    select: { name: true, startDate: true },
    orderBy: { name: 'asc' },
  });

  const rows = groups.map(group => {
    const preferredMatch = findPreferredFile(group.name, fileEntries);
    const scored = fileEntries
      .map(file => ({ file, score: scoreMatch(group, file) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    let match = null;
    let ambiguous = false;
    if (preferredMatch) {
      match = preferredMatch;
    } else if (scored.length > 0) {
      const topScore = scored[0].score;
      const topMatches = scored.filter(item => item.score === topScore);
      ambiguous = topMatches.length > 1;
      match = topMatches[0].file;
    }

    const dbDateParsed = group.startDate ? new Date(group.startDate) : null;
    const dbDateFormatted = formatDate(dbDateParsed);
    const fileDateFormatted = match ? formatDate(match.startDateParsed) : null;

    let status = 'NO FILE';
    if (match) {
      if (!dbDateFormatted || !fileDateFormatted) {
        status = 'MISSING DATE';
      } else if (dbDateFormatted === fileDateFormatted) {
        status = 'MATCH';
      } else {
        status = 'MISMATCH';
      }
    }

    return {
      dbGroup: group.name,
      matchedFile: match ? match.fileName : 'NO MATCH',
      dbDate: dbDateFormatted || 'N/A',
      fileDate: fileDateFormatted || 'N/A',
      status,
      ambiguous,
    };
  });

  const header = 'DB Group Name | Matched File | Start Date Match?';
  const divider = '--------------------|----------------------|------------------';
  console.log(header);
  console.log(divider);
  rows.forEach(row => {
    const ambiguousNote = row.ambiguous ? ' (AMBIGUOUS)' : '';
    console.log(
      `${row.dbGroup} | ${row.matchedFile}${ambiguousNote} | DB: ${row.dbDate} -> File: ${row.fileDate} ${row.status}`
    );
  });
}

main()
  .catch(error => {
    console.error('Error:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
