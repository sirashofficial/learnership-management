import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addDays, format, isWeekend, parseISO } from 'date-fns';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

/** Advance date by `daysNeeded` working days (Mon-Fri), starting from `from`. */
function addWorkingDays(from: Date, daysNeeded: number): Date {
  let current = new Date(from);
  let added = 0;
  while (added < daysNeeded) {
    current = addDays(current, 1);
    if (!isWeekend(current)) added++;
  }
  return current;
}

/**
 * POST /api/ai/generate-schedule
 * Body: { groupId, startDate?, weeksToSchedule?, hoursPerDay? }
 * Returns a structured weekly lesson schedule for a group.
 */
async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      groupId,
      startDate,
      weeksToSchedule = 4,
      hoursPerDay = 8,
    } = body;

    if (!groupId) {
      return errorResponse('groupId is required', 400);
    }

    // Load group with unit standard rollouts
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        unitStandardRollouts: {
          include: {
            unitStandard: { include: { module: true } },
          },
          orderBy: [
            { unitStandard: { module: { moduleNumber: 'asc' } } },
            { startDate: 'asc' },
          ],
        },
      },
    });

    if (!group) {
      return errorResponse('Group not found', 404);
    }

    const rollouts = group.unitStandardRollouts ?? [];

    // Build schedule start date
    const scheduleStart = startDate
      ? parseISO(startDate)
      : group.startDate
      ? new Date(group.startDate)
      : new Date();

    // Estimate classroom hours for each rollout (credits × ~3 hrs typical for NQF L2)
    const totalDays = weeksToSchedule * 5; // working days
    let currentDay = 0;
    const scheduledItems: any[] = [];

    for (const rollout of rollouts) {
      if (currentDay >= totalDays) break;
      const us = rollout.unitStandard;
      if (!us) continue;

      // Estimate hours: use classroomHours if set, otherwise credits × 3
      const classroomHours = (rollout as any).classroomHours ?? (us.credits ?? 0) * 3;
      const daysNeeded = Math.max(1, Math.ceil(classroomHours / hoursPerDay));

      for (let d = 0; d < daysNeeded && currentDay < totalDays; d++, currentDay++) {
        const itemDate = addWorkingDays(scheduleStart, currentDay);
        if (isWeekend(itemDate)) currentDay++; // skip weekends

        scheduledItems.push({
          dayIndex: currentDay + 1,
          day: format(itemDate, 'EEEE'),
          date: format(itemDate, 'dd MMM yyyy'),
          dateIso: format(itemDate, 'yyyy-MM-dd'),
          week: `Week ${Math.ceil((currentDay + 1) / 5)}`,
          module: us.module?.name ?? 'General',
          moduleNumber: us.module?.moduleNumber ?? 0,
          unitStandardId: us.id,
          unitStandardCode: String(us.code),
          unitStandardTitle: us.title,
          duration: hoursPerDay * 60,
          creditsValue: us.credits ?? 0,
          sessionType: 'CLASSROOM',
          objectives: [],
        });
      }
    }

    if (scheduledItems.length === 0) {
      return errorResponse('No unit standard rollouts found for this group', 404);
    }

    // Use AI to enrich the schedule with objectives for each day
    const scheduleContext = scheduledItems
      .slice(0, 20) // limit AI call size
      .map(
        (item) =>
          `Day ${item.dayIndex} (${item.day} ${item.date}): ${item.unitStandardCode} - ${item.unitStandardTitle}`
      )
      .join('\n');

    const prompt = `
You are a South African learnership programme facilitator creating a detailed lesson schedule.

GROUP: ${group.name}
SCHEDULE (first ${Math.min(scheduledItems.length, 20)} days):
${scheduleContext}

For each day listed above, provide 2-3 specific learning objectives that align with the unit standard focus for that day. Consider that:
- Earlier days focus on introducing concepts
- Middle days focus on practical application  
- Later days on a unit standard focus on consolidation and assessment preparation
- Each session is ${hoursPerDay} hours

Return a JSON array with exactly ${Math.min(scheduledItems.length, 20)} objects:
[
  {
    "dayIndex": 1,
    "objectives": ["By end of session, learners will be able to...", "..."]
  }
]

Return ONLY the JSON array.
`;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const jsonText = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const enriched: { dayIndex: number; objectives: string[] }[] = JSON.parse(jsonText);

      const objectiveMap = new Map(enriched.map((e) => [e.dayIndex, e.objectives]));
      scheduledItems.forEach((item) => {
        item.objectives = objectiveMap.get(item.dayIndex) ?? [];
      });
    } catch (enrichError) {
      console.warn('AI enrichment of schedule failed:', enrichError);
      // Fallback: generic objectives
      scheduledItems.forEach((item) => {
        item.objectives = [`Understand and apply ${item.unitStandardTitle} principles`];
      });
    }

    // Group by week for the response
    const byWeek: Record<string, any[]> = {};
    scheduledItems.forEach((item) => {
      if (!byWeek[item.week]) byWeek[item.week] = [];
      byWeek[item.week].push(item);
    });

    return successResponse({
      groupName: group.name,
      scheduleStart: format(scheduleStart, 'dd MMM yyyy'),
      totalDays: scheduledItems.length,
      totalWeeks: Object.keys(byWeek).length,
      schedule: scheduledItems,
      byWeek,
    });
  } catch (error) {
    console.error('Generate schedule error:', error);
    return handleApiError(error);
  }
}

export const POST = withAuth(withRateLimit(handlePost, 'strict'), ['ADMIN', 'FACILITATOR']);
