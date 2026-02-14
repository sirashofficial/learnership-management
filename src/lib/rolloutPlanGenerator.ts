type UnitStandardPlan = {
  id: string;
  title: string;
  credits: number;
  startDate: string;
  endDate: string;
  summativeDate: string;
  assessingDate: string;
};

type ModulePlan = {
  moduleNumber: number;
  moduleName: string;
  unitStandards: UnitStandardPlan[];
  workplaceActivity: {
    startDate: string;
    endDate: string;
    label: string;
  };
  totalCredits: number;
};

type RolloutPlan = {
  groupName: string;
  numLearners: number;
  startDate: string;
  endDate: string;
  inductionDate: string;
  modules: ModulePlan[];
  totalCredits: number;
  requiredCredits: number;
};

type UnitStandardSeed = {
  id: string;
  title: string;
  credits: number;
  durationDays: number;
  groupKey?: string;
};

type ModuleSeed = {
  moduleNumber: number;
  moduleName: string;
  unitStandards: UnitStandardSeed[];
};

const MODULES: ModuleSeed[] = [
  {
    moduleNumber: 1,
    moduleName: "Numeracy",
    unitStandards: [
      {
        id: "7480",
        title: "Demonstrate understanding of rational and irrational numbers and number systems.",
        credits: 2,
        durationDays: 5,
      },
      {
        id: "9008",
        title: "Identify/describe/compare/classify shapes in 2D and 3D.",
        credits: 3,
        durationDays: 6,
      },
      {
        id: "9007",
        title: "Work with patterns and functions.",
        credits: 5,
        durationDays: 3,
      },
      {
        id: "7469",
        title: "Use mathematics to investigate financial aspects.",
        credits: 3,
        durationDays: 3,
      },
      {
        id: "9009",
        title: "Apply basic knowledge of statistics and probability.",
        credits: 3,
        durationDays: 3,
      },
    ],
  },
  {
    moduleNumber: 2,
    moduleName: "HIV/AIDS & Communications",
    unitStandards: [
      {
        id: "13915",
        title: "Demonstrate knowledge of HIV/AIDS in a workplace.",
        credits: 4,
        durationDays: 5,
      },
      {
        id: "8963",
        title: "Access and use info from texts.",
        credits: 5,
        durationDays: 8,
        groupKey: "module2-8963-8964",
      },
      {
        id: "8964",
        title: "Write for a defined context.",
        credits: 5,
        durationDays: 8,
        groupKey: "module2-8963-8964",
      },
      {
        id: "8962",
        title: "Maintain oral communication.",
        credits: 5,
        durationDays: 11,
        groupKey: "module2-8962-8967",
      },
      {
        id: "8967",
        title: "Use language in occupational learning.",
        credits: 5,
        durationDays: 11,
        groupKey: "module2-8962-8967",
      },
    ],
  },
  {
    moduleNumber: 3,
    moduleName: "Market Requirements",
    unitStandards: [
      {
        id: "119673",
        title: "Identify and demonstrate entrepreneurial ideas and opportunities.",
        credits: 7,
        durationDays: 9,
      },
      {
        id: "119669",
        title: "Match new venture opportunity to market needs.",
        credits: 6,
        durationDays: 6,
      },
      {
        id: "119672",
        title: "Manage marketing and selling processes of a new venture.",
        credits: 7,
        durationDays: 5,
      },
      {
        id: "114974",
        title: "Apply the basic skills of customer service.",
        credits: 2,
        durationDays: 6,
      },
    ],
  },
  {
    moduleNumber: 4,
    moduleName: "Business Sector & Industry",
    unitStandards: [
      {
        id: "119667",
        title: "Identify the composition of a new venture's industry/sector.",
        credits: 8,
        durationDays: 6,
      },
      {
        id: "119712",
        title: "Tender for business or work in a new venture.",
        credits: 8,
        durationDays: 4,
      },
      {
        id: "119671",
        title: "Administer contracts for a new venture.",
        credits: 10,
        durationDays: 9,
      },
    ],
  },
  {
    moduleNumber: 5,
    moduleName: "Financial Requirements",
    unitStandards: [
      {
        id: "119666",
        title: "Determine financial requirements of a new venture.",
        credits: 8,
        durationDays: 8,
      },
      {
        id: "119670",
        title: "Produce a business plan for a new venture.",
        credits: 8,
        durationDays: 8,
      },
      {
        id: "119674",
        title: "Manage finances for a new venture.",
        credits: 10,
        durationDays: 11,
      },
    ],
  },
  {
    moduleNumber: 6,
    moduleName: "Business Operations",
    unitStandards: [
      {
        id: "119668",
        title: "Manage business operations.",
        credits: 8,
        durationDays: 7,
      },
      {
        id: "13932",
        title: "Prepare and process documents for financial/banking processes.",
        credits: 5,
        durationDays: 4,
      },
      {
        id: "13929",
        title: "Co-ordinate meetings, events and travel arrangements.",
        credits: 3,
        durationDays: 3,
      },
      {
        id: "13930",
        title: "Monitor and control receiving of visitors.",
        credits: 4,
        durationDays: 4,
      },
      {
        id: "114959",
        title: "Behave in a professional manner in a business environment.",
        credits: 4,
        durationDays: 3,
      },
      {
        id: "113924",
        title: "Apply basic business ethics in a work environment.",
        credits: 2,
        durationDays: 3,
      },
    ],
  },
];

function parseDate(input: string): Date {
  const [day, month, year] = input.split("/").map((part) => Number(part));
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const targetMonth = result.getMonth() + months;
  const targetYear = result.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const day = result.getDate();
  const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  result.setFullYear(targetYear, normalizedMonth, Math.min(day, lastDay));
  return result;
}

function isHoliday(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  if (month === 11 && day >= 15) return true;
  if (month === 0 && day <= 2) return true;
  return false;
}

function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6 && !isHoliday(date);
}

function addWorkingDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  let remaining = days;
  const step = days >= 0 ? 1 : -1;

  while (remaining !== 0) {
    result.setDate(result.getDate() + step);
    if (isWorkingDay(result)) {
      remaining -= step;
    }
  }

  return result;
}

function nextWorkingDay(date: Date): Date {
  let result = new Date(date.getTime());
  while (!isWorkingDay(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

function nextMonday(date: Date): Date {
  let result = new Date(date.getTime());
  result.setDate(result.getDate() + 1);
  while (result.getDay() !== 1 || !isWorkingDay(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

export function generateRolloutPlan(
  groupName: string,
  numLearners: number,
  startDate: string
): RolloutPlan {
  const start = parseDate(startDate);
  const startWorking = nextWorkingDay(start);
  const inductionDate = addWorkingDays(startWorking, -3);
  const endDate = nextWorkingDay(addMonths(startWorking, 12));

  const modules: ModulePlan[] = [];
  let moduleStart = startWorking;

  for (const module of MODULES) {
    const unitStandards: UnitStandardPlan[] = [];
    let currentStart = moduleStart;
    const scheduledGroups = new Set<string>();

    for (const standard of module.unitStandards) {
      if (standard.groupKey && scheduledGroups.has(standard.groupKey)) {
        continue;
      }

      const groupItems = standard.groupKey
        ? module.unitStandards.filter((item) => item.groupKey === standard.groupKey)
        : [standard];

      const usStart = nextWorkingDay(currentStart);
      const usEnd = addWorkingDays(usStart, standard.durationDays - 1);
      const summativeDate = addWorkingDays(usEnd, 1);
      const assessingDate = addWorkingDays(summativeDate, 1);

      for (const item of groupItems) {
        unitStandards.push({
          id: item.id,
          title: item.title,
          credits: item.credits,
          startDate: formatDate(usStart),
          endDate: formatDate(usEnd),
          summativeDate: formatDate(summativeDate),
          assessingDate: formatDate(assessingDate),
        });
      }

      if (standard.groupKey) {
        scheduledGroups.add(standard.groupKey);
      }

      currentStart = addWorkingDays(assessingDate, 1);
    }

    const lastAssessing = parseDate(unitStandards[unitStandards.length - 1].assessingDate);
    const workplaceStart = nextMonday(lastAssessing);
    const workplaceEnd = addWorkingDays(workplaceStart, 9);

    modules.push({
      moduleNumber: module.moduleNumber,
      moduleName: module.moduleName,
      unitStandards,
      workplaceActivity: {
        startDate: formatDate(workplaceStart),
        endDate: formatDate(workplaceEnd),
        label: `Workplace Activity - (${formatDate(workplaceStart)} - ${formatDate(workplaceEnd)})`,
      },
      totalCredits: unitStandards.reduce((sum, us) => sum + us.credits, 0),
    });

    moduleStart = nextMonday(workplaceEnd);
  }

  return {
    groupName,
    numLearners,
    startDate: formatDate(startWorking),
    endDate: formatDate(endDate),
    inductionDate: formatDate(inductionDate),
    modules,
    totalCredits: 140,
    requiredCredits: 138,
  };
}

// Test
// const plan = generateRolloutPlan("Test Group", 4, "28/11/2025");
// console.log(plan);
