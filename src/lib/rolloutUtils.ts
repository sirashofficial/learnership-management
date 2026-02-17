import { addDays, format, getDay, isWeekend, startOfDay } from 'date-fns';

// TypeScript types for rollout plan data
export type UnitStandardStatus = "not-started" | "in-progress" | "summative-done" | "complete";

export interface UnitStandard {
  id: string;
  code: string;
  title: string;
  credits: number;
  startDate: string;
  endDate: string;
  summativeDate?: string;
  assessingDate?: string;
  status?: UnitStandardStatus;
}

export interface WorkplaceActivity {
  startDate: string;
  endDate: string;
  label: string;
}

export interface Module {
  moduleNumber: number;
  moduleName: string;
  unitStandards: UnitStandard[];
  workplaceActivity?: WorkplaceActivity;
  workplaceActivityStartDate?: string;
  workplaceActivityEndDate?: string;
}

export interface RolloutPlan {
  groupName?: string;
  modules: Module[];
}

type GroupRolloutPlan = {
  module1StartDate?: string | Date | null;
  module1EndDate?: string | Date | null;
  module2StartDate?: string | Date | null;
  module2EndDate?: string | Date | null;
  module3StartDate?: string | Date | null;
  module3EndDate?: string | Date | null;
  module4StartDate?: string | Date | null;
  module4EndDate?: string | Date | null;
  module5StartDate?: string | Date | null;
  module5EndDate?: string | Date | null;
  module6StartDate?: string | Date | null;
  module6EndDate?: string | Date | null;
};

type UnitStandardRolloutRecord = {
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  summativeDate?: string | Date | null;
  assessingDate?: string | Date | null;
  unitStandard?: {
    id: string;
    code: string;
    title: string;
    credits: number;
    module?: {
      moduleNumber: number;
      name: string;
    };
  };
};

/**
 * Extracts the rollout plan from group.notes JSON
 * @param notes - The notes field from a group (JSON string)
 * @returns The rolloutPlan object or null if not found/invalid
 */
export function extractRolloutPlan(notes: string | null | undefined): RolloutPlan | null {
  if (!notes) return null;

  try {
    const parsed = JSON.parse(notes);
    if (parsed.rolloutPlan && Array.isArray(parsed.rolloutPlan.modules)) {
      return parsed.rolloutPlan;
    }
    return null;
  } catch (error) {
    console.error('Failed to parse rollout plan from notes:', error);
    return null;
  }
}

/**
 * Builds a minimal rollout plan from the GroupRolloutPlan table.
 * This keeps module-level dates available when notes JSON is missing.
 */
export function buildRolloutPlanFromGroupRollout(plan: GroupRolloutPlan | null | undefined): RolloutPlan | null {
  if (!plan) return null;

  const modules: Module[] = [];

  for (let moduleNumber = 1; moduleNumber <= 6; moduleNumber += 1) {
    const startKey = `module${moduleNumber}StartDate` as keyof GroupRolloutPlan;
    const endKey = `module${moduleNumber}EndDate` as keyof GroupRolloutPlan;
    const startDate = plan[startKey] ? String(plan[startKey]) : '';
    const endDate = plan[endKey] ? String(plan[endKey]) : '';

    if (!startDate && !endDate) continue;

    modules.push({
      moduleNumber,
      moduleName: `Module ${moduleNumber}`,
      unitStandards: [
        {
          id: `module-${moduleNumber}`,
          code: `module-${moduleNumber}`,
          title: `Module ${moduleNumber}`,
          credits: 0,
          startDate,
          endDate,
          status: 'not-started',
        },
      ],
      workplaceActivityStartDate: endDate || undefined,
      workplaceActivityEndDate: endDate || undefined,
    });
  }

  if (modules.length === 0) return null;

  return { modules };
}

function formatPlanDateValue(value: string | Date | null | undefined): string {
  if (!value) return '';
  if (value instanceof Date) return format(value, 'dd/MM/yyyy');
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  if (trimmed.includes('/')) return trimmed;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? trimmed : format(parsed, 'dd/MM/yyyy');
}

/**
 * Builds a detailed rollout plan from UnitStandardRollout records.
 */
export function buildRolloutPlanFromUnitRollouts(
  rollouts: UnitStandardRolloutRecord[] | null | undefined
): RolloutPlan | null {
  if (!Array.isArray(rollouts) || rollouts.length === 0) return null;

  const modulesMap = new Map<number, Module>();

  for (const rollout of rollouts) {
    const unit = rollout.unitStandard;
    const moduleNumber = unit?.module?.moduleNumber;
    if (!unit || !moduleNumber) continue;

    if (!modulesMap.has(moduleNumber)) {
      modulesMap.set(moduleNumber, {
        moduleNumber,
        moduleName: unit.module?.name || `Module ${moduleNumber}`,
        unitStandards: [],
      });
    }

    const moduleEntry = modulesMap.get(moduleNumber);
    if (!moduleEntry) continue;

    moduleEntry.unitStandards.push({
      id: unit.id,
      code: unit.code,
      title: unit.title,
      credits: unit.credits || 0,
      startDate: formatPlanDateValue(rollout.startDate),
      endDate: formatPlanDateValue(rollout.endDate),
      summativeDate: formatPlanDateValue(rollout.summativeDate),
      assessingDate: formatPlanDateValue(rollout.assessingDate),
      status: 'not-started',
    });
  }

  const modules = Array.from(modulesMap.values())
    .map((module) => ({
      ...module,
      unitStandards: module.unitStandards
        .filter((unit) => unit.startDate || unit.endDate)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    }))
    .sort((a, b) => a.moduleNumber - b.moduleNumber);

  if (modules.length === 0) return null;

  return { modules };
}

/**
 * Converts date string from ISO format to DD/MM/YYYY format
 * @param dateStr - Date string in "YYYY-MM-DD" format
 * @returns Formatted date string "DD/MM/YYYY" or empty string if invalid
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  } catch (error) {
    return dateStr || '';
  }
}

/**
 * Checks if today's date falls between the start and end dates
 * @param startDate - Start date in "YYYY-MM-DD" format
 * @param endDate - End date in "YYYY-MM-DD" format
 * @returns true if today is between the dates (inclusive)
 */
export function isCurrentlyActive(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): boolean {
  if (!startDate || !endDate) return false;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    return today >= start && today <= end;
  } catch (error) {
    return false;
  }
}

/**
 * Calculates the total credits across all modules in the rollout plan
 * @param plan - The rollout plan object
 * @returns Total credits sum
 */
export function getTotalCredits(plan: RolloutPlan | null): number {
  if (!plan || !plan.modules) return 0;

  return plan.modules.reduce((total, module) => {
    if (!module.unitStandards) return total;
    
    const moduleCredits = module.unitStandards.reduce((sum, us) => {
      return sum + (us.credits || 0);
    }, 0);
    
    return total + moduleCredits;
  }, 0);
}

/**
 * Calculates credits earned for completed unit standards
 * @param plan - The rollout plan object
 * @param completedIds - Array of unit standard IDs that are completed
 * @returns Total earned credits
 */
export function getEarnedCredits(plan: RolloutPlan | null, completedIds: string[]): number {
  if (!plan || !plan.modules || !completedIds) return 0;

  const completedSet = new Set(completedIds);

  return plan.modules.reduce((total, module) => {
    if (!module.unitStandards) return total;
    
    const moduleEarned = module.unitStandards.reduce((sum, us) => {
      if (completedSet.has(us.id)) {
        return sum + (us.credits || 0);
      }
      return sum;
    }, 0);
    
    return total + moduleEarned;
  }, 0);
}

/**
 * Gets the projected completion date (end date of the last unit standard)
 * @param plan - The rollout plan object
 * @returns The latest end date found, or null if no dates exist
 */
export function getProjectedCompletionDate(plan: RolloutPlan | null): string | null {
  if (!plan || !plan.modules) return null;

  let latestDate: Date | null = null;
  let latestDateStr: string | null = null;

  for (const module of plan.modules) {
    if (!module.unitStandards) continue;

    for (const us of module.unitStandards) {
      if (us.endDate) {
        try {
          const endDate = new Date(us.endDate);
          if (!latestDate || endDate > latestDate) {
            latestDate = endDate;
            latestDateStr = us.endDate;
          }
        } catch (error) {
          // Skip invalid dates
        }
      }
    }
  }

  return latestDateStr;
}

/**
 * Compares projected progress vs actual progress
 * @param plan - The rollout plan object
 * @param completedIds - Array of unit standard IDs that are completed
 * @returns Object with projected vs actual status
 */
export function calculateProjectedVsActual(
  plan: RolloutPlan | null,
  completedIds: string[]
): {
  projectedModule: number | null;
  projectedDate: string | null;
  actualModule: number | null;
  weeksAhead: number;
  status: "on-track" | "ahead" | "behind";
} {
  const result = {
    projectedModule: null as number | null,
    projectedDate: null as string | null,
    actualModule: null as number | null,
    weeksAhead: 0,
    status: "on-track" as "on-track" | "ahead" | "behind",
  };

  if (!plan || !plan.modules) return result;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const completedSet = new Set(completedIds || []);

  // Find where learners SHOULD be (projected)
  for (const module of plan.modules) {
    if (!module.unitStandards) continue;

    for (const us of module.unitStandards) {
      if (us.startDate && us.endDate) {
        try {
          const start = new Date(us.startDate);
          const end = new Date(us.endDate);
          start.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);

          if (today >= start && today <= end) {
            result.projectedModule = module.moduleNumber;
            result.projectedDate = us.endDate;
            break;
          }
        } catch (error) {
          // Skip invalid dates
        }
      }
    }

    if (result.projectedModule) break;
  }

  // If no active unit standard, find the next upcoming one
  if (!result.projectedModule) {
    for (const module of plan.modules) {
      if (!module.unitStandards) continue;

      for (const us of module.unitStandards) {
        if (us.startDate) {
          try {
            const start = new Date(us.startDate);
            start.setHours(0, 0, 0, 0);

            if (today < start) {
              result.projectedModule = module.moduleNumber;
              result.projectedDate = us.startDate;
              break;
            }
          } catch (error) {
            // Skip
          }
        }
      }

      if (result.projectedModule) break;
    }
  }

  // Find where learners ACTUALLY are (based on completed IDs)
  let lastCompletedModule = null;
  let lastCompletedEndDate: Date | null = null;

  for (const module of plan.modules) {
    if (!module.unitStandards) continue;

    for (const us of module.unitStandards) {
      if (completedSet.has(us.id)) {
        lastCompletedModule = module.moduleNumber;
        
        if (us.endDate) {
          try {
            const endDate = new Date(us.endDate);
            endDate.setHours(0, 0, 0, 0);
            
            if (!lastCompletedEndDate || endDate > lastCompletedEndDate) {
              lastCompletedEndDate = endDate;
            }
          } catch (error) {
            // Skip
          }
        }
      }
    }
  }

  result.actualModule = lastCompletedModule;

  // Calculate status
  if (result.projectedModule && result.actualModule) {
    if (result.actualModule > result.projectedModule) {
      result.status = "ahead";
      
      // Calculate weeks ahead
      if (result.projectedDate && lastCompletedEndDate) {
        try {
          const projectedDate = new Date(result.projectedDate);
          projectedDate.setHours(0, 0, 0, 0);
          
          const daysDiff = Math.floor(
            (lastCompletedEndDate.getTime() - projectedDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          result.weeksAhead = Math.floor(daysDiff / 7);
        } catch (error) {
          // Skip calculation
        }
      }
    } else if (result.actualModule < result.projectedModule) {
      result.status = "behind";
      
      // Calculate weeks behind (negative)
      if (result.projectedDate && lastCompletedEndDate) {
        try {
          const projectedDate = new Date(result.projectedDate);
          projectedDate.setHours(0, 0, 0, 0);
          
          const daysDiff = Math.floor(
            (lastCompletedEndDate.getTime() - projectedDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          result.weeksAhead = Math.floor(daysDiff / 7);
        } catch (error) {
          // Skip calculation
        }
      }
    } else {
      result.status = "on-track";
    }
  } else if (!result.actualModule && result.projectedModule) {
    result.status = "behind";
  } else if (result.actualModule && !result.projectedModule) {
    result.status = "ahead";
  }

  return result;
}

export interface ModuleRollout {
  moduleNumber: number;
  name: string;
  credits: number;
  startDate: Date;
  endDate: Date;
}

export interface UnitStandardRollout {
  codes: string[];
  title: string;
  credits: number;
  creditsByCode?: Record<string, number>;
  durationDays: number;
  startDate: Date;
  endDate: Date;
  summativeDate: Date;
  assessingDate: Date;
}

export interface DetailedModuleRollout extends ModuleRollout {
  unitStandards: UnitStandardRollout[];
  workplaceActivityStartDate: Date;
  workplaceActivityEndDate: Date;
}

export interface DetailedRolloutPlan {
  inductionDate: Date;
  modules: DetailedModuleRollout[];
}

const NVC_L2_MODULES = [
  {
    moduleNumber: 1,
    name: 'Numeracy',
    credits: 16,
    unitStandards: [
      { codes: ['7480'], title: 'Demonstrate understanding of rational and irrational numbers', credits: 2, durationDays: 5 },
      { codes: ['9008'], title: 'Identify/describe/compare/classify shapes in 2D and 3D', credits: 3, durationDays: 6 },
      { codes: ['9007'], title: 'Work with patterns and functions', credits: 5, durationDays: 3 },
      { codes: ['7469'], title: 'Use mathematics to investigate financial aspects', credits: 3, durationDays: 3 },
      { codes: ['9009'], title: 'Apply basic knowledge of statistics and probability', credits: 3, durationDays: 3 },
    ]
  },
  {
    moduleNumber: 2,
    name: 'HIV/AIDS & Communications',
    credits: 24,
    unitStandards: [
      { codes: ['13915'], title: 'Demonstrate knowledge of HIV/AIDS in a workplace', credits: 4, durationDays: 5 },
      {
        codes: ['8963', '8964'],
        title: 'Access and use info from texts / Write for a defined context',
        credits: 10,
        creditsByCode: { '8963': 5, '8964': 5 },
        durationDays: 8
      },
      {
        codes: ['8962', '8967'],
        title: 'Maintain oral communication / Use language in occupational learning',
        credits: 10,
        creditsByCode: { '8962': 5, '8967': 5 },
        durationDays: 11
      },
    ]
  },
  {
    moduleNumber: 3,
    name: 'Market Requirements',
    credits: 22,
    unitStandards: [
      { codes: ['119673'], title: 'Identify and demonstrate entrepreneurial ideas and opportunities', credits: 7, durationDays: 9 },
      { codes: ['119669'], title: 'Match new venture opportunity to market needs', credits: 6, durationDays: 6 },
      { codes: ['119672'], title: 'Manage marketing and selling processes of a new venture', credits: 7, durationDays: 5 },
      { codes: ['114974'], title: 'Apply the basic skills of customer service', credits: 2, durationDays: 6 },
    ]
  },
  {
    moduleNumber: 4,
    name: 'Business Sector & Industry',
    credits: 26,
    unitStandards: [
      { codes: ['119667'], title: 'Identify the composition of a new venture\'s industry/sector', credits: 8, durationDays: 6 },
      { codes: ['119712'], title: 'Tender for business or work in a new venture', credits: 8, durationDays: 4 },
      { codes: ['119671'], title: 'Administer contracts for a new venture', credits: 10, durationDays: 9 },
    ]
  },
  {
    moduleNumber: 5,
    name: 'Financial Requirements',
    credits: 26,
    unitStandards: [
      { codes: ['119666'], title: 'Determine financial requirements of a new venture', credits: 8, durationDays: 8 },
      { codes: ['119670'], title: 'Produce a business plan for a new venture', credits: 8, durationDays: 8 },
      { codes: ['119674'], title: 'Manage finances for a new venture', credits: 10, durationDays: 11 },
    ]
  },
  {
    moduleNumber: 6,
    name: 'Business Operations',
    credits: 26,
    unitStandards: [
      { codes: ['119668'], title: 'Manage business operations', credits: 8, durationDays: 7 },
      { codes: ['13932'], title: 'Prepare and process documents for financial/banking processes', credits: 5, durationDays: 4 },
      { codes: ['13929'], title: 'Co-ordinate meetings, events and travel arrangements', credits: 3, durationDays: 3 },
      { codes: ['13930'], title: 'Monitor and control receiving of visitors', credits: 4, durationDays: 4 },
      { codes: ['114959'], title: 'Behave in a professional manner in a business environment', credits: 4, durationDays: 3 },
      { codes: ['113924'], title: 'Apply basic business ethics in a work environment', credits: 2, durationDays: 3 },
    ]
  },
];

function isHoliday(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();

  if (month === 11 && day >= 15) {
    return true;
  }

  if (month === 0 && day <= 2) {
    return true;
  }

  return false;
}

export function isWorkingDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

export function addWorkingDays(startDate: Date, days: number): Date {
  let result = startOfDay(startDate);
  let daysAdded = 0;

  if (days < 0) {
    while (daysAdded > days) {
      result = addDays(result, -1);
      if (isWorkingDay(result)) {
        daysAdded--;
      }
    }
    return result;
  }

  while (daysAdded < days) {
    result = addDays(result, 1);
    if (isWorkingDay(result)) {
      daysAdded++;
    }
  }

  return result;
}

function nextWorkingDay(date: Date): Date {
  let result = startOfDay(date);
  while (!isWorkingDay(result)) {
    result = addDays(result, 1);
  }
  return result;
}

function nextWorkingMondayOnOrAfter(date: Date): Date {
  let result = startOfDay(date);
  while (getDay(result) !== 1 || !isWorkingDay(result)) {
    result = addDays(result, 1);
  }
  return result;
}

export function calculateDetailedRolloutPlan(startDate: Date): DetailedRolloutPlan {
  let currentModuleStart = nextWorkingDay(startDate);
  const inductionDate = addWorkingDays(currentModuleStart, -3);
  const modules: DetailedModuleRollout[] = [];

  for (const module of NVC_L2_MODULES) {
    const unitStandards: UnitStandardRollout[] = [];
    let currentStart = nextWorkingDay(currentModuleStart);
    let lastAssessingDate: Date | null = null;

    for (const unitStandard of module.unitStandards) {
      const unitStart = nextWorkingDay(currentStart);
      const unitEnd = addWorkingDays(unitStart, Math.max(unitStandard.durationDays - 1, 0));
      const summativeDate = addWorkingDays(unitEnd, 1);
      const assessingDate = addWorkingDays(summativeDate, 1);

      unitStandards.push({
        codes: unitStandard.codes,
        title: unitStandard.title,
        credits: unitStandard.credits,
        creditsByCode: unitStandard.creditsByCode as any,
        durationDays: unitStandard.durationDays,
        startDate: unitStart,
        endDate: unitEnd,
        summativeDate,
        assessingDate,
      });

      lastAssessingDate = assessingDate;
      currentStart = addWorkingDays(assessingDate, 1);
    }

    const moduleStartDate = unitStandards[0]?.startDate || currentModuleStart;
    const moduleEndDate = unitStandards[unitStandards.length - 1]?.endDate || currentModuleStart;
    const lastAssessing = lastAssessingDate || addWorkingDays(moduleEndDate, 1);
    const workplaceBase = addWorkingDays(lastAssessing, 1);
    const workplaceStartDate = nextWorkingMondayOnOrAfter(workplaceBase);
    const workplaceEndDate = addWorkingDays(workplaceStartDate, 9);

    modules.push({
      moduleNumber: module.moduleNumber,
      name: module.name,
      credits: module.credits,
      startDate: moduleStartDate,
      endDate: moduleEndDate,
      unitStandards,
      workplaceActivityStartDate: workplaceStartDate,
      workplaceActivityEndDate: workplaceEndDate,
    });

    const nextModuleBase = addWorkingDays(workplaceEndDate, 1);
    currentModuleStart = nextWorkingMondayOnOrAfter(nextModuleBase);
  }

  return { inductionDate, modules };
}

export function calculateRolloutPlan(startDate: Date) {
  const detailedPlan = calculateDetailedRolloutPlan(startDate);
  return detailedPlan.modules.map((module) => ({
    moduleNumber: module.moduleNumber,
    name: module.name,
    credits: module.credits,
    startDate: module.startDate,
    endDate: module.endDate,
  }));
}
