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

function parseUnitStandards(text: string): UnitStandard[] {
  const unitStandards: UnitStandard[] = [];
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\d{4,5}$/.test(line)) {
      const code = line;
      let startDate: string | null = null;
      let endDate: string | null = null;
      let summativeDate: string | null = null;
      let assessingDate: string | null = null;
      let credits = 0;

      const datePattern = /(\d{2})\/(\d{2})\/(\d{4})/;
      let dateCount = 0;

      for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
        const prevLine = lines[j];
        const dateMatch = datePattern.exec(prevLine);

        if (dateMatch) {
          const dateStr = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
          if (dateCount === 0) {
            assessingDate = dateStr;
          } else if (dateCount === 1) {
            summativeDate = dateStr;
          } else if (dateCount === 2) {
            endDate = dateStr;
          } else if (dateCount === 3) {
            startDate = dateStr;
          }
          dateCount++;

          if (dateCount >= 4) break;
        }
      }

      for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
        const nextLine = lines[j];
        const creditMatch = /^(\d+)$/.exec(nextLine);
        if (creditMatch) {
          credits = parseInt(creditMatch[1], 10);
          break;
        }
      }

      if (startDate && endDate && assessingDate) {
        unitStandards.push({
          id: code,
          code,
          title: '',
          startDate,
          endDate,
          summativeDate: summativeDate || '',
          assessingDate,
          credits,
        });
      }
    }
  }

  return unitStandards;
}

function parseWorkplaceActivityEndDates(text: string): Map<number, string> {
  const dates = new Map<number, string>();
  const workplacePattern = /Workplace\s+Activity\s*[-–]\s*\((\d{2})\/(\d{2})\/(\d{4})\s*[-–]\s*(\d{2})\/(\d{2})\/(\d{4})\)/gi;

  let match: RegExpExecArray | null;
  let moduleCount = 1;

  while ((match = workplacePattern.exec(text)) !== null) {
    const endDateStr = `${match[4]}/${match[5]}/${match[6]}`;
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

  const unitStandards = parseUnitStandards(text);
  const workplaceActivityDates = parseWorkplaceActivityEndDates(text);
  const moduleMap = organizeUnitsByModule(unitStandards);

  const modules: Module[] = [];
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

  return {
    groupName: '',
    startDate: '',
    endDate: '',
    numLearners: 0,
    modules,
  };
}
