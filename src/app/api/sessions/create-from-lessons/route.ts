import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { withAuth, withRateLimit, getAuthContext } from '@/middleware/apiAuth';

/**
 * POST /api/sessions/create-from-lessons
 * Converts LessonPlans to Sessions (for attendance tracking)
 * 
 * Body: {
 *   lessonPlanIds?: string[] (optional - if not provided, converts ALL lesson plans)
 *   dryRun?: boolean (default: false - just preview, don't create)
 * }
 */
async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonPlanIds, dryRun = false } = body;

    // Fetch lesson plans to convert
    const where = lessonPlanIds && lessonPlanIds.length > 0 
      ? { id: { in: lessonPlanIds } }
      : {};

    const lessonPlans = await prisma.lessonPlan.findMany({
      where,
      include: {
        module: true,
        facilitator: true,
        group: true,
      },
      orderBy: { date: 'asc' },
    });

    if (lessonPlans.length === 0) {
      return errorResponse('No lesson plans found to convert', 404);
    }

    const results = {
      total: lessonPlans.length,
      created: 0,
      skipped: 0,
      errors: 0,
      sessions: [] as any[],
      skippedIds: [] as string[],
      errorDetails: [] as any[],
    };

    for (const lessonPlan of lessonPlans) {
      try {
        // Check if Session already exists for this lesson plan
        // We identify duplicates by matching: groupId, date, startTime, endTime
        const existingSession = await prisma.session.findFirst({
          where: {
            groupId: lessonPlan.groupId || undefined,
            facilitatorId: lessonPlan.facilitatorId,
            date: lessonPlan.date,
            startTime: lessonPlan.startTime,
            endTime: lessonPlan.endTime,
          },
        });

        if (existingSession) {
          results.skipped++;
          results.skippedIds.push(lessonPlan.id);
          continue;
        }

        if (dryRun) {
          // Just preview, don't actually create
          results.sessions.push({
            lessonPlanId: lessonPlan.id,
            title: lessonPlan.title,
            module: lessonPlan.module.name,
            group: lessonPlan.group?.name || 'No group',
            date: lessonPlan.date,
            startTime: lessonPlan.startTime,
            endTime: lessonPlan.endTime,
          });
          results.created++;
        } else {
          // Create actual Session record
          const session = await prisma.session.create({
            data: {
              groupId: lessonPlan.groupId || '',
              facilitatorId: lessonPlan.facilitatorId,
              date: lessonPlan.date,
              startTime: lessonPlan.startTime,
              endTime: lessonPlan.endTime,
              title: lessonPlan.title,
              module: lessonPlan.module.name,
              notes: lessonPlan.notes || `Created from LessonPlan: ${lessonPlan.id}`,
            },
          });

          results.sessions.push({
            sessionId: session.id,
            lessonPlanId: lessonPlan.id,
            title: session.title,
            module: session.module,
            group: lessonPlan.group?.name || 'No group',
            date: session.date,
          });
          results.created++;
        }
      } catch (error: any) {
        results.errors++;
        results.errorDetails.push({
          lessonPlanId: lessonPlan.id,
          error: error.message,
        });
      }
    }

    const message = dryRun
      ? `Dry run complete: Would create ${results.created} sessions, skip ${results.skipped} duplicates`
      : `Created ${results.created} sessions, skipped ${results.skipped} duplicates, ${results.errors} errors`;

    return successResponse(results, message);
  } catch (error) {
    console.error('Error converting lesson plans to sessions:', error);
    return errorResponse('Failed to convert lesson plans to sessions', 500);
  }
}

/**
 * GET /api/sessions/create-from-lessons
 * Preview what would be converted (dry run)
 */
async function handleGet(request: NextRequest) {
  try {
    const lessonPlans = await prisma.lessonPlan.findMany({
      include: {
        module: true,
        group: true,
      },
      orderBy: { date: 'asc' },
    });

    const preview = [];
    let wouldCreate = 0;
    let wouldSkip = 0;

    for (const lessonPlan of lessonPlans) {
      const existingSession = await prisma.session.findFirst({
        where: {
          groupId: lessonPlan.groupId || undefined,
          facilitatorId: lessonPlan.facilitatorId,
          date: lessonPlan.date,
          startTime: lessonPlan.startTime,
          endTime: lessonPlan.endTime,
        },
      });

      if (existingSession) {
        wouldSkip++;
      } else {
        wouldCreate++;
        if (preview.length < 20) {
          // Only show first 20 for preview
          preview.push({
            id: lessonPlan.id,
            title: lessonPlan.title,
            module: lessonPlan.module.name,
            group: lessonPlan.group?.name || 'No group',
            date: lessonPlan.date,
            startTime: lessonPlan.startTime,
            endTime: lessonPlan.endTime,
          });
        }
      }
    }

    return successResponse({
      totalLessonPlans: lessonPlans.length,
      wouldCreate,
      wouldSkip,
      preview,
      message: preview.length < wouldCreate
        ? `Showing first ${preview.length} of ${wouldCreate} sessions to be created`
        : 'All sessions to be created are shown',
    });
  } catch (error) {
    console.error('Error previewing conversion:', error);
    return errorResponse('Failed to preview conversion', 500);
  }
}

export const POST = withAuth(withRateLimit(handlePost, 'strict'), ['ADMIN', 'FACILITATOR']);
export const GET = withAuth(withRateLimit(handleGet, 'moderate'), ['ADMIN', 'FACILITATOR']);
