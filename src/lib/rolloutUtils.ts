// TypeScript types for rollout plan data
export type UnitStandardStatus = "not-started" | "in-progress" | "summative-done" | "complete";

export interface UnitStandard {
  id: string;
  code: string;
  title: string;
  credits: number;
  startDate: string;
  endDate: string;
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
