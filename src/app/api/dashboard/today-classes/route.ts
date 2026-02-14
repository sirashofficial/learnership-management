import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';
import { format, startOfDay, endOfDay, isSameDay } from 'date-fns';

// Mark as dynamic since we check request headers for auth
export const dynamic = 'force-dynamic';

// GET /api/dashboard/today-classes
// Returns today's classes with module progress and rollout status
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // Get all sessions today
    const todaySessions = await prisma.session.findMany({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            students: {
              select: { id: true, firstName: true, lastName: true, progress: true },
            },
            rolloutPlan: true,
          },
        },
        facilitator: {
          select: { id: true, name: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    console.log(`[TodayClasses API] Start: ${todayStart.toISOString()}, End: ${todayEnd.toISOString()}`);
    console.log(`[TodayClasses API] Found ${todaySessions.length} sessions`);

    // Enrich sessions with module progress and on-track info
    const classesWithProgress = await Promise.all(
      todaySessions.map(async (session) => {
        const group = session.group;
        const rollout = group.rolloutPlan;

        if (!rollout) {
          return {
            id: session.id,
            groupName: group.name,
            time: `${session.startTime} - ${session.endTime}`,
            topic: session.title, // Use title instead of topic
            facilitator: session.facilitator?.name || 'TBD',
            studentsCount: group.students.length,
            currentModule: 'N/A - No rollout plan',
            averageProgress: 0,
            onTrack: false,
            warning: 'No rollout plan configured',
          };
        }

        // Determine current module based on today's date
        let currentModule = null;
        let moduleProgress = 0;

        const modules = [
          { num: 1, start: rollout.module1StartDate, end: rollout.module1EndDate },
          { num: 2, start: rollout.module2StartDate, end: rollout.module2EndDate },
          { num: 3, start: rollout.module3StartDate, end: rollout.module3EndDate },
          { num: 4, start: rollout.module4StartDate, end: rollout.module4EndDate },
          { num: 5, start: rollout.module5StartDate, end: rollout.module5EndDate },
          { num: 6, start: rollout.module6StartDate, end: rollout.module6EndDate },
        ];

        for (const module of modules) {
          if (module.start && module.end) {
            const startDate = new Date(module.start);
            const endDate = new Date(module.end);
            if (today >= startDate && today <= endDate) {
              currentModule = module.num;
              // Calculate progress in this module
              const daysInModule = Math.ceil(
                (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              const daysPassed = Math.ceil(
                (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              moduleProgress = Math.min(100, Math.round((daysPassed / daysInModule) * 100));
              break;
            }
          }
        }

        // Check if on track (avg student progress should be >= module progress)
        const avgStudentProgress =
          group.students.length > 0
            ? Math.round(
              group.students.reduce((sum, s) => sum + s.progress, 0) /
              group.students.length
            )
            : 0;

        const expectedProgress = currentModule ? (currentModule / 6) * 100 : 0;
        const onTrack = avgStudentProgress >= expectedProgress * 0.8; // 80% threshold

        return {
          id: session.id,
          groupName: group.name,
          time: `${session.startTime} - ${session.endTime}`,
          topic: session.title,
          facilitator: session.facilitator?.name || 'TBD',
          studentsCount: group.students.length,
          currentModule: currentModule ? `Module ${currentModule}` : 'N/A',
          moduleProgress: moduleProgress,
          averageProgress: avgStudentProgress,
          expectedProgress: Math.round(expectedProgress),
          onTrack: onTrack,
          status: onTrack ? 'ON TRACK' : 'AT RISK',
          warning: !onTrack
            ? `Students ${avgStudentProgress}% done vs ${Math.round(expectedProgress)}% expected`
            : null,
        };
      })
    );

    // Group by status
    const onTrackClasses = classesWithProgress.filter((c) => c.onTrack);
    const atRiskClasses = classesWithProgress.filter((c) => !c.onTrack);

    return successResponse(
      {
        date: format(today, 'yyyy-MM-dd'),
        summary: {
          total: classesWithProgress.length,
          onTrack: onTrackClasses.length,
          atRisk: atRiskClasses.length,
        },
        classes: classesWithProgress,
        onTrack: onTrackClasses,
        atRisk: atRiskClasses,
      },
      `${classesWithProgress.length} classes today`
    );
  } catch (error) {
    console.error("Error fetching today's classes:", error);
    return handleApiError(error);
  }
}
