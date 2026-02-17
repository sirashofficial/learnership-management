/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { successResponse, handleApiError, errorResponse } from '@/lib/api-utils';
import { format } from 'date-fns';
import { calculateDetailedRolloutPlan } from '@/lib/rolloutUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupName, numberOfLearners, startDate, inductionDate } = body;

    if (!groupName || !numberOfLearners || !startDate) {
      return errorResponse('Missing required fields: groupName, numberOfLearners, startDate', 400);
    }

    const groupStartDate = new Date(startDate);
    const rolloutPlan = calculateDetailedRolloutPlan(groupStartDate);
    const groupEndDate = rolloutPlan.modules[rolloutPlan.modules.length - 1]?.workplaceActivityEndDate || groupStartDate;
    const computedInductionDate = inductionDate ? new Date(inductionDate) : rolloutPlan.inductionDate;

    // Calculate implementation plan with all dates
    const implementationPlan: any = {
      groupName,
      numberOfLearners,
      qualification: 'National Certificate: New Venture Creation (SMME)',
      id: 49648,
      nqfLevel: 2,
      totalCredits: 140,
      requiredCredits: 138,
      startDate: format(groupStartDate, 'dd/MM/yyyy'),
      endDate: format(groupEndDate, 'dd/MM/yyyy'),
      inductionDate: format(computedInductionDate, 'dd/MM/yyyy'),
      modules: [],
      totalNotionalHours: 0,
    };

    rolloutPlan.modules.forEach((module) => {
      const notionalHours = module.credits * 10;
      const contactHours = Math.round(notionalHours * 0.3);
      const experientialHours = Math.round(notionalHours * 0.7);
      const daysRequired = Math.ceil(notionalHours / 8);

      const unitStandards = module.unitStandards.flatMap((us) =>
        us.codes.map((code) => ({
          code,
          title: us.title,
          credits: us.creditsByCode?.[code] ?? us.credits,
          startDate: format(us.startDate, 'dd/MM/yyyy'),
          endDate: format(us.endDate, 'dd/MM/yyyy'),
          summativeDate: format(us.summativeDate, 'dd/MM/yyyy'),
          assessingDate: format(us.assessingDate, 'dd/MM/yyyy'),
          durationDays: us.durationDays,
        }))
      );

      implementationPlan.modules.push({
        moduleNumber: module.moduleNumber,
        code: `MOD_${module.moduleNumber}`,
        name: module.name,
        credits: module.credits,
        startDate: format(module.startDate, 'dd/MM/yyyy'),
        endDate: format(module.endDate, 'dd/MM/yyyy'),
        summativeDate: format(module.unitStandards[module.unitStandards.length - 1].summativeDate, 'dd/MM/yyyy'),
        assessingDate: format(module.unitStandards[module.unitStandards.length - 1].assessingDate, 'dd/MM/yyyy'),
        workplaceActivityStart: format(module.workplaceActivityStartDate, 'dd/MM/yyyy'),
        workplaceActivityEnd: format(module.workplaceActivityEndDate, 'dd/MM/yyyy'),
        notionalHours,
        contactHours,
        experientialHours,
        daysRequired,
        unitStandards,
      });
    });

    implementationPlan.totalNotionalHours = implementationPlan.modules.reduce(
      (sum: number, m: any) => sum + m.notionalHours,
      0
    );

    // FISA scheduling
    const fisaDate = new Date(groupEndDate);
    implementationPlan.fisaDate = format(fisaDate, 'dd/MM/yyyy');
    implementationPlan.fisaDescription = 'Final Summative Assessment - To be conducted after completion of all assessments';

    return successResponse({
      success: true,
      implementationPlan,
      message: 'Implementation plan generated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
