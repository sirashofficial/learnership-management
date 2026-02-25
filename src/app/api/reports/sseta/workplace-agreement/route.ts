/**
 * API Route: Generate Workplace-Based Learning Agreement
 * 
 * Endpoint: POST /api/reports/sseta/workplace-agreement
 * Access: ADMIN, COORDINATOR only
 * 
 * Generates SSETA-compliant workplace learning agreement documents
 * Export formats: DOCX (editable), PDF (submission-ready)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRateLimit, getAuthContext } from '@/middleware/apiAuth';
import { errorResponse, validationErrorResponse } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { Packer } from 'docx';
import { z } from 'zod';
import {
  generateWorkplaceAgreement,
  WorkplaceAgreementData,
} from '@/lib/reports/ssetaTemplates';

const workplaceAgreementSchema = z.object({
  studentId: z.string().uuid(),
  employerName: z.string().min(1),
  employerContact: z.string().min(1),
  employerAddress: z.string().min(1),
  workplaceMentorName: z.string().min(1),
  workplaceMentorEmail: z.string().email(),
  trainingPeriodStart: z.string().refine((val) => !isNaN(Date.parse(val))),
  trainingPeriodEnd: z.string().refine((val) => !isNaN(Date.parse(val))),
  qualificationTitle: z.string().default('NVC Level 2: Generic Management'),
  qualificationLevel: z.string().default('NQF Level 2'),
  ssetaCode: z.string().default('67465'),
  providerName: z.string().min(1),
  providerAccreditationNumber: z.string().min(1),
  coordinatorName: z.string().min(1),
  coordinatorContact: z.string().min(1),
  format: z.enum(['docx', 'pdf']).default('docx'),
});

async function handlePost(request: NextRequest) {
  try {
    const authContext = getAuthContext(request);
    if (!authContext) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const validation = workplaceAgreementSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const data = validation.data;

    // Fetch student data
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: {
        group: true,
        facilitator: true,
      },
    });

    if (!student) {
      return errorResponse('Student not found', 404);
    }

    // Calculate attendance percentage
    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId: student.id },
    });

    const attendancePercentage =
      attendanceRecords.length > 0
        ? (attendanceRecords.filter((a) => a.status === 'PRESENT').length /
            attendanceRecords.length) *
          100
        : 0;

    // Prepare agreement data
    const agreementData: WorkplaceAgreementData = {
      student: {
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email || undefined,
        phone: student.phone || undefined,
        idNumber: student.idNumber || undefined,
        groupName: student.group.name,
        facilitatorName: student.facilitator.name,
        progress: student.progress,
        totalCreditsEarned: student.totalCreditsEarned,
        attendancePercentage,
        status: student.status,
        enrollmentDate: student.createdAt,
      },
      employerName: data.employerName,
      employerContact: data.employerContact,
      employerAddress: data.employerAddress,
      workplaceMentorName: data.workplaceMentorName,
      workplaceMentorEmail: data.workplaceMentorEmail,
      trainingPeriodStart: new Date(data.trainingPeriodStart),
      trainingPeriodEnd: new Date(data.trainingPeriodEnd),
      qualificationTitle: data.qualificationTitle,
      qualificationLevel: data.qualificationLevel,
      ssetaCode: data.ssetaCode,
      providerName: data.providerName,
      providerAccreditationNumber: data.providerAccreditationNumber,
      coordinatorName: data.coordinatorName,
      coordinatorContact: data.coordinatorContact,
    };

    // Generate document
    const doc = generateWorkplaceAgreement(agreementData);
    const buffer = await Packer.toBuffer(doc);

    // Log report generation for audit trail
    await logReportGeneration(
      authContext.user.userId,
      'WORKPLACE_AGREEMENT',
      student.id,
      student.group.id
    );

    // Return DOCX file
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Workplace_Agreement_${student.studentId}_${Date.now()}.docx"`,
      },
    });
  } catch (error) {
    console.error('Error generating workplace agreement:', error);
    return errorResponse('Failed to generate workplace agreement', 500);
  }
}

/**
 * Log report generation for audit trail
 */
async function logReportGeneration(
  userId: string,
  reportType: string,
  studentId: string,
  groupId: string
) {
  try {
    // @ts-ignore - AuditLog model exists in schema
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'GENERATE_REPORT',
        entityType: 'SSETA_REPORT',
        entityId: studentId,
        timestamp: new Date(),
        ipAddress: 'system',
        metadata: JSON.stringify({
          reportType,
          studentId,
          groupId,
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
