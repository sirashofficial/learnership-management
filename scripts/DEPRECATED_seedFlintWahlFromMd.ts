const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const mdPath = path.resolve('C:\\Users\\LATITUDE 5400\\Downloads\\NVC_Implementation_Plan.md');

const parsePlanDate = (value: string) => {
  const parts = value.split('/').map((part) => Number(part.trim()));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }
  const [day, month, year] = parts;
  return new Date(year, month - 1, day);
};

const extractSection = (content: string, header: string) => {
  const headerLine = `# ${header}`;
  const startIndex = content.indexOf(headerLine);
  if (startIndex === -1) return null;

  const otherHeader = header === 'FLINT GROUP' ? '# WAHL GROUP' : null;
  if (otherHeader) {
    const nextIndex = content.indexOf(otherHeader, startIndex + headerLine.length);
    if (nextIndex !== -1) {
      return content.slice(startIndex, nextIndex);
    }
  }

  return content.slice(startIndex);
};

const parseHeader = (section: string) => {
  const headerMatch = section.match(/\*\*Start Date:\*\*\s*([^|]+)\|\s*\*\*End Date:\*\*\s*([^|]+)(?:\|\s*\*\*Learners:\*\*\s*(\d+))?/i);
  const inductionMatch = section.match(/\*\*Learnership Induction:\*\*\s*([^\n]+)/i);

  return {
    startDate: headerMatch ? headerMatch[1].trim() : '',
    endDate: headerMatch ? headerMatch[2].trim() : '',
    numLearners: headerMatch && headerMatch[3] ? Number(headerMatch[3]) : undefined,
    inductionDate: inductionMatch ? inductionMatch[1].trim() : undefined,
  };
};

const parseModules = (section: string) => {
  const modules = [] as any[];
  const moduleRegex = /##\s*MODULE\s+(\d+)\s*(?:-|–|â€“)\s*(.+)/g;
  const matches = Array.from(section.matchAll(moduleRegex));

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const moduleNumber = Number(match[1]);
    const moduleName = match[2].trim();
    const startIndex = match.index ?? 0;
    const endIndex = i + 1 < matches.length ? (matches[i + 1].index ?? section.length) : section.length;
    const moduleBlock = section.slice(startIndex, endIndex);

    const unitStandards = [] as any[];
    const tableRows = moduleBlock
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('|') && /\d{2}\/\d{2}\/\d{4}/.test(line));

    for (const row of tableRows) {
      const cols = row
        .split('|')
        .map((col) => col.trim())
        .filter((col) => col.length > 0);

      if (cols.length < 7) {
        continue;
      }

      unitStandards.push({
        startDate: cols[0],
        endDate: cols[1],
        summativeDate: cols[2],
        assessingDate: cols[3],
        id: cols[4],
        title: cols[5],
        credits: Number(cols[6]),
      });
    }

    const workplaceMatch = moduleBlock.match(/Workplace Activity[^()]*\((\d{2}\/\d{2}\/\d{4})\s*[-–]\s*(\d{2}\/\d{2}\/\d{4})\)/i);
    const workplaceActivity = workplaceMatch
      ? {
          startDate: workplaceMatch[1],
          endDate: workplaceMatch[2],
          label: `Workplace Activity - (${workplaceMatch[1]} - ${workplaceMatch[2]})`,
        }
      : undefined;

    const totalCredits = unitStandards.reduce((sum, unit) => sum + (Number(unit.credits) || 0), 0);

    modules.push({
      moduleNumber,
      moduleName,
      unitStandards,
      workplaceActivity,
      totalCredits,
    });
  }

  return modules;
};

const buildPlan = (section: string, dbGroupName: string) => {
  const header = parseHeader(section);
  const modules = parseModules(section);
  const totalCredits = modules.reduce((sum, module) => sum + (Number(module.totalCredits) || 0), 0);

  return {
    groupName: dbGroupName,
    startDate: header.startDate,
    endDate: header.endDate,
    inductionDate: header.inductionDate,
    numLearners: header.numLearners,
    modules,
    totalCredits,
    requiredCredits: 138,
  };
};

async function seedFromMd() {
  if (!fs.existsSync(mdPath)) {
    console.error(`MD file not found: ${mdPath}`);
    return;
  }

  const content = fs.readFileSync(mdPath, 'utf8');

  const targets = [
    { header: 'FLINT GROUP', dbName: 'FLINT GROUP (2025)' },
    { header: 'WAHL GROUP', dbName: 'WAHL CLIPPERS (2025)' },
  ];

  for (const target of targets) {
    const section = extractSection(content, target.header);
    if (!section) {
      console.error(`Section not found for ${target.header}`);
      continue;
    }

    const plan = buildPlan(section, target.dbName);
    const startDate = parsePlanDate(plan.startDate);

    const group = await prisma.group.findFirst({ where: { name: target.dbName } });
    if (!group) {
      console.error(`Group not found in DB: ${target.dbName}`);
      continue;
    }

    await prisma.group.update({
      where: { id: group.id },
      data: {
        notes: JSON.stringify({ rolloutPlan: plan }),
        ...(startDate ? { startDate } : {}),
      },
    });

    const totalUnits = plan.modules.reduce((sum, module) => sum + module.unitStandards.length, 0);
    console.log(`✅ Updated ${target.dbName}: ${plan.modules.length} modules, ${totalUnits} units`);
  }
}

seedFromMd()
  .catch((error) => {
    console.error('Error seeding plans:', error);
  })
  .finally(() => prisma.$disconnect());
