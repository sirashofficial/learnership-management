import { addDays, getDay, isWeekend, startOfDay } from 'date-fns';

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
