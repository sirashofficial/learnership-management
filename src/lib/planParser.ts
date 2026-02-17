import * as fs from 'fs/promises';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export interface UnitStandard {
  id: string;
  title: string;
  credits: number;
  startDate: string;
  endDate: string;
  summativeDate: string;
  assessingDate: string;
  code?: string;
}

export interface Module {
  moduleIndex?: number;
  moduleNumber?: number;
  moduleName?: string;
  unitStandards: UnitStandard[];
  workplaceActivityEndDate?: string;
  workplaceActivity?: {
    startDate: string;
    endDate: string;
    label: string;
  };
}

export interface RolloutPlan {
  groupName: string;
  startDate: string;
  endDate: string;
  numLearners?: number;
  modules: Module[];
}

// Parse Markdown rollout plan files
export function extractRolloutPlanFromMD(content: string): RolloutPlan {
  const lines = content.split('\n');

  // Extract group name
  const groupLine = lines.find((l) => l.includes('**GROUP:**')) || '';
  const groupName = groupLine.split('**GROUP:**')[1]?.trim() || 'Unknown Group';

  // Extract start/end dates
  const startLine = lines.find((l) => l.includes('**START DATE:**')) || '';
  const startDate = startLine.split('**START DATE:**')[1]?.trim() || '';
  const endLine = lines.find((l) => l.includes('**END DATE:**')) || '';
  const endDate = endLine.split('**END DATE:**')[1]?.trim() || '';

  // Extract learners (optional)
  const learnersLine = lines.find((l) => l.includes('**LEARNERS:**')) || '';
  const numLearners = parseInt(learnersLine.split('**LEARNERS:**')[1]?.trim() || '0', 10) || 0;

  const modules: Module[] = [];
  let currentModule: Partial<Module> | null = null;
  let currentUnit: Partial<UnitStandard> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect module: ## MODULE X - Name
    const moduleMatch = line.match(/^##\s*MODULE\s*(\d+)\s*-\s*(.+)/i);
    if (moduleMatch) {
      if (currentModule && currentModule.unitStandards?.length) {
        modules.push(currentModule as Module);
      }
      currentModule = {
        moduleIndex: parseInt(moduleMatch[1], 10),
        moduleName: moduleMatch[2].trim(),
        unitStandards: [],
      };
      continue;
    }

    // Detect unit standard: ### Unit Standard CODE: Title
    const unitMatch = line.match(/^###\s*Unit Standard\s*([^:]+):\s*(.+)/i);
    if (unitMatch && currentModule) {
      if (currentUnit && Object.keys(currentUnit).length > 0) {
        currentModule.unitStandards?.push(currentUnit as UnitStandard);
      }
      currentUnit = {
        id: unitMatch[1].trim(),
        title: unitMatch[2].trim(),
        credits: 0,
        startDate: '',
        endDate: '',
        summativeDate: '',
        assessingDate: '',
      };
      continue;
    }

    const workplaceMatch = line.match(/Workplace\s+Activity.*?(\d{2}\/\d{2}\/\d{4})\s*[-–]\s*(\d{2}\/\d{2}\/\d{4})/i);
    if (workplaceMatch && currentModule) {
      const startDate = workplaceMatch[1];
      const endDate = workplaceMatch[2];
      currentModule.workplaceActivity = {
        startDate,
        endDate,
        label: `Workplace Activity - (${startDate} - ${endDate})`,
      };
      continue;
    }

    // Parse bullet points inside unit block
    if (currentUnit) {
      const startDateMatch = line.match(/\*\*Start Date:\*\*\s*(\S+)/);
      if (startDateMatch) currentUnit.startDate = startDateMatch[1];

      const endDateMatch = line.match(/\*\*End Date:\*\*\s*(\S+)/);
      if (endDateMatch) currentUnit.endDate = endDateMatch[1];

      const summativeMatch = line.match(/\*\*Summative Date:\*\*\s*(\S+)/);
      if (summativeMatch) currentUnit.summativeDate = summativeMatch[1];

      const assessingMatch = line.match(/\*\*Assessing Date:\*\*\s*(\S+)/);
      if (assessingMatch) currentUnit.assessingDate = assessingMatch[1];

      const creditsMatch = line.match(/\*\*Credits:\*\*\s*(\d+)/);
      if (creditsMatch) currentUnit.credits = parseInt(creditsMatch[1], 10);
    }
  }

  // Push last unit and module
  if (currentUnit && currentModule) {
    currentModule.unitStandards?.push(currentUnit as UnitStandard);
  }
  if (currentModule && currentModule.unitStandards?.length) {
    modules.push(currentModule as Module);
  }

  return {
    groupName,
    startDate,
    endDate,
    numLearners,
    modules,
  };
}

// Main entry point - detects file type and parses accordingly
export async function extractRolloutPlan(filePath: string): Promise<RolloutPlan> {
  if (filePath.endsWith('.md')) {
    const content = await fs.readFile(filePath, 'utf-8');
    return extractRolloutPlanFromMD(content);
  }

  if (filePath.endsWith('.docx') || filePath.endsWith('.pdf')) {
    return extractRolloutPlanFromDocument(filePath);
  }

  throw new Error(`Unsupported file type: ${filePath}`);
}

const normalizeDate = (day: string, month: string, year: string) => {
  const normalizedYear = year.length === 2 ? `20${year}` : year;
  return `${day}/${month}/${normalizedYear}`;
};

const moduleNumberFromLabel = (label: string) => {
  const normalized = label.trim().toLowerCase();
  const map: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };
  if (map[normalized]) {
    return map[normalized];
  }
  const numeric = parseInt(normalized, 10);
  return Number.isNaN(numeric) ? null : numeric;
};

function parseUnitStandardsWithModules(text: string): Map<number, UnitStandard[]> {
  const moduleMap = new Map<number, UnitStandard[]>();
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const modulePattern = /^MODULE\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|\d+)/i;
  const codePattern = /^(\d{4,5}(?:\/\d{4,5})?)$/;
  const datePattern = /(\d{2})\/(\d{2})\/(\d{2,4})/g;

  let currentModule: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const moduleMatch = line.match(modulePattern);
    if (moduleMatch) {
      const moduleNumber = moduleNumberFromLabel(moduleMatch[1]);
      if (moduleNumber) {
        currentModule = moduleNumber;
        if (!moduleMap.has(moduleNumber)) {
          moduleMap.set(moduleNumber, []);
        }
      }
      continue;
    }

    const codeMatch = line.match(codePattern);
    if (!codeMatch) {
      continue;
    }

    if (!currentModule) {
      currentModule = 1;
      if (!moduleMap.has(currentModule)) {
        moduleMap.set(currentModule, []);
      }
    }

    const code = codeMatch[1];
    const dates: string[] = [];

    for (let j = i + 1; j < Math.min(lines.length, i + 14); j++) {
      const nextLine = lines[j];
      if (modulePattern.test(nextLine) || codePattern.test(nextLine)) {
        break;
      }
      let match: RegExpExecArray | null;
      datePattern.lastIndex = 0;
      while ((match = datePattern.exec(nextLine)) !== null) {
        dates.push(normalizeDate(match[1], match[2], match[3]));
      }
    }

    if (dates.length < 2) {
      continue;
    }

    const [startDate, endDate, summativeDate, assessingDate] = dates;
    const unit: UnitStandard = {
      id: code,
      code,
      title: '',
      startDate,
      endDate,
      summativeDate: summativeDate || '',
      assessingDate: assessingDate || '',
      credits: 0,
    };

    moduleMap.get(currentModule)!.push(unit);
  }

  return moduleMap;
}

function parseUnitStandards(text: string): UnitStandard[] {
  const unitStandards: UnitStandard[] = [];
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const datePattern = /(\d{2})\/(\d{2})\/(\d{2,4})/g;
  const codePattern = /\b(\d{4,5}(?:\/\d{4,5})?)\b/;

  const collectDatesAround = (index: number) => {
    const matches: Array<{ idx: number; date: string }> = [];
    const start = Math.max(0, index - 12);
    const end = Math.min(lines.length - 1, index + 12);

    for (let j = start; j <= end; j++) {
      const line = lines[j];
      let match: RegExpExecArray | null;
      datePattern.lastIndex = 0;
      while ((match = datePattern.exec(line)) !== null) {
        matches.push({ idx: j, date: normalizeDate(match[1], match[2], match[3]) });
      }
    }

    return matches.sort((a, b) => a.idx - b.idx).map((item) => item.date);
  };

  const collectCreditsAround = (index: number) => {
    for (let j = index + 1; j < Math.min(lines.length, index + 6); j++) {
      const nextLine = lines[j];
      const creditMatch = /^(\d{1,3})$/.exec(nextLine);
      if (creditMatch) {
        return parseInt(creditMatch[1], 10);
      }
    }
    return 0;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const exactCode = /^\d{4,5}(?:\/\d{4,5})?$/.test(line) ? line : null;
    const inlineCodeMatch = exactCode ? null : codePattern.exec(line);
    const code = exactCode || inlineCodeMatch?.[1];
    if (!code) continue;

    if (unitStandards.some((unit) => unit.code === code)) {
      continue;
    }

    let title = '';
    if (!exactCode && inlineCodeMatch) {
      title = line.replace(code, '').replace(/[-–]/g, '').trim();
    }
    if (!title && lines[i + 1] && !/\d{2}\/\d{2}\/\d{2,4}/.test(lines[i + 1])) {
      title = lines[i + 1];
    }

    const dateCandidates = collectDatesAround(i);
    const [startDate, endDate, summativeDate, assessingDate] = dateCandidates;
    const credits = collectCreditsAround(i);

    if (startDate && endDate) {
      unitStandards.push({
        id: code,
        code,
        title,
        startDate,
        endDate,
        summativeDate: summativeDate || '',
        assessingDate: assessingDate || '',
        credits,
      });
    }
  }

  return unitStandards;
}

function parseWorkplaceActivityEndDates(text: string): Map<number, string> {
  const dates = new Map<number, string>();
  const workplacePattern = /Workplace\s+Activity\s*[-–]\s*\((\d{2})\/(\d{2})\/(\d{2,4})\s*[-–]\s*(\d{2})\/(\d{2})\/(\d{2,4})\)/gi;

  let match: RegExpExecArray | null;
  let moduleCount = 1;

  while ((match = workplacePattern.exec(text)) !== null) {
    const endDateStr = normalizeDate(match[4], match[5], match[6]);
    if (moduleCount <= 6) {
      dates.set(moduleCount, endDateStr);
      moduleCount++;
    }
  }

  return dates;
}

function organizeUnitsByModule(unitStandards: UnitStandard[]): Map<number, UnitStandard[]> {
  const moduleMap = new Map<number, UnitStandard[]>();
  for (let i = 1; i <= 6; i++) {
    moduleMap.set(i, []);
  }

  const unitsPerModule = Math.ceil(unitStandards.length / 6);
  unitStandards.forEach((unit, index) => {
    const moduleNum = Math.floor(index / unitsPerModule) + 1;
    if (moduleNum <= 6) {
      moduleMap.get(moduleNum)!.push(unit);
    }
  });

  return moduleMap;
}

async function extractText(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);

  if (filePath.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  if (filePath.endsWith('.pdf')) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text || '';
    } finally {
      await parser.destroy();
    }
  }

  return '';
}

async function extractRolloutPlanFromDocument(filePath: string): Promise<RolloutPlan> {
  const text = await extractText(filePath);
  if (!text || text.trim().length === 0) {
    return { groupName: '', startDate: '', endDate: '', numLearners: 0, modules: [] };
  }

  const moduleMapWithHeadings = parseUnitStandardsWithModules(text);
  const workplaceActivityDates = parseWorkplaceActivityEndDates(text);
  let modules: Module[] = [];

  if (moduleMapWithHeadings.size > 0) {
    modules = Array.from(moduleMapWithHeadings.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([moduleNum, moduleUnits]) => ({
        moduleNumber: moduleNum,
        unitStandards: moduleUnits,
        workplaceActivityEndDate: workplaceActivityDates.get(moduleNum) || undefined,
      }));
  } else {
    const unitStandards = parseUnitStandards(text);
    const moduleMap = organizeUnitsByModule(unitStandards);
    for (let moduleNum = 1; moduleNum <= 6; moduleNum++) {
      const moduleUnits = moduleMap.get(moduleNum) || [];
      if (moduleUnits.length === 0) continue;

      const workplaceEndDate = workplaceActivityDates.get(moduleNum) || undefined;
      modules.push({
        moduleNumber: moduleNum,
        unitStandards: moduleUnits,
        workplaceActivityEndDate: workplaceEndDate,
      });
    }
  }

  return {
    groupName: '',
    startDate: '',
    endDate: '',
    numLearners: 0,
    modules,
  };
}
