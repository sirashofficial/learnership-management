/**
 * API Route: Generate Assessment Schedule
 * 
 * Endpoint: POST /api/reports/sseta/assessment-schedule
 * Access: ADMIN, COORDINATOR only
 * 
 * Generates SSETA-compliant assessment schedule reports showing:
 * - Upcoming summative assessments by group
 * - Assessment timelines from RolloutPlan
 * - All three required assessment types (FORMATIVE, SUMMATIVE, WORKPLACE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRateLimit, getAuthContext } from '@/middleware/apiAuth';
import { errorResponse, validationErrorResponse } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { Packer } from 'docx';
import { z } from 'zod';
import { addDays } from 'date-fns';
import {
  generateAssessmentSchedule,
  generateAssessmentSchedulePDF,
  AssessmentScheduleItem,
} from '@/lib/reports/ssetaTemplates';

const assessmentScheduleSchema = z.object({
  groupId: z.string(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val))),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val))),
  includeCompleted: z.boolean().default(false),
  format: z.enum(['docx', 'pdf']).default('docx'),
});

async function handlePost(request: NextRequest) {
  try {
    const authContext = getAuthContext(request);
    if (!authContext) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const validation = assessmentScheduleSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const data = validation.data;
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Fetch group with rollout plan
    const group = await prisma.group.findUnique({
      where: { id: data.groupId },
      include: {
        rolloutPlans: {
          include: {
            module: {
              include: {
                unitStandards: true,
              },
            },
          },
          where: {
            OR: [
              {
                projectedSummativeDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              {
                projectedAssessmentDate: {
                  gte: startDate,
                  lte: endDate,
                },
              },
            ],
          },
          orderBy: {
            projectedSummativeDate: 'asc',
          },
        },
        students: {
          where: { isDeleted: false },
          take: 1,
          include: {
            facilitator: true,
          },
        },
      },
    });

    if (!group) {
      return errorResponse('Group not found', 404);
    }

    // Get facilitator name
    const facilitatorName =
      group.students.length > 0 ? group.students[0].facilitator.name : 'N/A';

    // Build assessment schedule items from rollout plan
    const scheduleItems: AssessmentScheduleItem[] = [];

    for (const rolloutPlan of group.rolloutPlans) {
      const module = rolloutPlan.module;

      // For each unit standard in the module
      for (const unitStandard of module.unitStandards) {
        // Formative assessment (typically before summative)
        if (rolloutPlan.projectedSummativeDate) {
          const formativeDueDate = addDays(
            rolloutPlan.projectedSummativeDate,
            -14
          ); // 2 weeks before summative

          if (formativeDueDate >= startDate && formativeDueDate <= endDate) {
            // Check if already assessed
            const existingFormative = await prisma.assessment.findFirst({
              where: {
                unitStandardId: unitStandard.id,
                type: 'FORMATIVE',
                student: {
                  groupId: group.id,
                  isDeleted: false,
                },
                isDeleted: false,
              },
              orderBy: { assessedDate: 'desc' },
            });

            if (data.includeCompleted || !existingFormative?.assessedDate) {
              scheduleItems.push({
                unitStandardCode: unitStandard.code,
                unitStandardTitle: unitStandard.title,
                assessmentType: 'FORMATIVE',
                dueDate: formativeDueDate,
                assessedDate: existingFormative?.assessedDate || undefined,
                result: existingFormative?.result || undefined,
                moduleName: module.name,
              });
            }
          }
        }

        // Summative assessment
        if (rolloutPlan.projectedSummativeDate) {
          const summativeDueDate = rolloutPlan.projectedSummativeDate;

          if (summativeDueDate >= startDate && summativeDueDate <= endDate) {
            // Check if already assessed
            const existingSummative = await prisma.assessment.findFirst({
              where: {
                unitStandardId: unitStandard.id,
                type: 'SUMMATIVE',
                student: {
                  groupId: group.id,
                  isDeleted: false,
                },
                isDeleted: false,
              },
              orderBy: { assessedDate: 'desc' },
            });

            if (data.includeCompleted || !existingSummative?.assessedDate) {
              scheduleItems.push({
                unitStandardCode: unitStandard.code,
                unitStandardTitle: unitStandard.title,
                assessmentType: 'SUMMATIVE',
                dueDate: summativeDueDate,
                assessedDate: existingSummative?.assessedDate || undefined,
                result: existingSummative?.result || undefined,
                moduleName: module.name,
              });
            }
          }
        }

        // Workplace assessment (typically after summative)
        if (rolloutPlan.projectedAssessmentDate) {
          const workplaceDueDate = rolloutPlan.projectedAssessmentDate;

          if (workplaceDueDate >= startDate && workplaceDueDate <= endDate) {
            // Check if already assessed
            const existingWorkplace = await prisma.assessment.findFirst({
              where: {
                unitStandardId: unitStandard.id,
                type: 'WORKPLACE',
                student: {
                  groupId: group.id,
                  isDeleted: false,
                },
                isDeleted: false,
              },
              orderBy: { assessedDate: 'desc' },
            });

            if (data.includeCompleted || !existingWorkplace?.assessedDate) {
              scheduleItems.push({
                unitStandardCode: unitStandard.code,
                unitStandardTitle: unitStandard.title,
                assessmentType: 'WORKPLACE',
                dueDate: workplaceDueDate,
                assessedDate: existingWorkplace?.assessedDate || undefined,
                result: existingWorkplace?.result || undefined,
                moduleName: module.name,
              });
            }
          }
        }
      }
    }

    // Sort by due date
    scheduleItems.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    if (scheduleItems.length === 0) {
      return errorResponse(
        'No assessments scheduled in the specified date range',
        404
      );
    }

    // Generate document
    let buffer: Buffer;

    if (data.format === 'docx') {
      const doc = generateAssessmentSchedule(
        group.name,
        facilitatorName,
        scheduleItems,
        startDate,
        endDate
      );
      buffer = await Packer.toBuffer(doc);
    } else {
      const pdf = generateAssessmentSchedulePDF(
        group.name,
        facilitatorName,
        scheduleItems,
        startDate,
        endDate
      );
      buffer = Buffer.from(pdf.output('arraybuffer'));
    }

    // Log report generation for audit trail
    await logReportGeneration(
      authContext.user.userId,
      'ASSESSMENT_SCHEDULE',
      group.id,
      scheduleItems.length
    );

    // Return document
    const ext = data.format === 'docx' ? 'docx' : 'pdf';
    const contentType =
      data.format === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';

      return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="Assessment_Schedule_${group.name.replace(/\s+/g, '_')}_${startDate.toISOString().slice(0, 10)}_to_${endDate.toISOString().slice(0, 10)}.${ext}"`,
      },
    });
  } catch (error) {
    console.error('Error generating assessment schedule:', error);
    return errorResponse('Failed to generate assessment schedule', 500);
  }
}

/**
 * Log report generation for audit trail
 */
async function logReportGeneration(
  userId: string,
  reportType: string,
  groupId: string,
  assessmentCount: number
) {
  try {
    // @ts-ignore - AuditLog model exists in schema
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'GENERATE_REPORT',
        entityType: 'SSETA_REPORT',
        entityId: groupId,
        timestamp: new Date(),
        ipAddress: 'system',
        metadata: JSON.stringify({
          reportType,
          groupId,
          assessmentCount,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  } catch (error) {
    // Fail gracefully - audit logging is non-critical
    console.error('Failed to log report generation:', error);
  }
}

export const POST = withAuth(
  withRateLimit(handlePost, 'moderate'),
  ['ADMIN', 'COORDINATOR']
);
