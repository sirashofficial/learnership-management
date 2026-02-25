/**
 * API Endpoint: /api/ai/risk-assessment
 * 
 * Returns current risk profiles for students in a group.
 * Only accessible to facilitators and coordinators (ADMIN role).
 * 
 * Privacy: Risk data never shown to students or guardians
 * Compliance: All accesses are audit logged
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { enforceGroupAccess, getAuthContext, withAuth, withRateLimit } from '@/middleware/apiAuth';
import {
  generateRiskAssessment,
  saveRiskProfile,
  logRiskProfileAccess,
} from '@/lib/ai/riskAnalysis';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/risk-assessment?groupId={groupId}&refresh={boolean}
 * 
 * Query Parameters:
 * - groupId (required): The group to get risk assessments for
 * - refresh (optional): If true, regenerate all assessments instead of using cached
 */
async function getRiskAssessmentHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const authContext = getAuthContext(request);
    if (!authContext) {
      return errorResponse('Unauthorized', 401);
    }

    // Enforce role-based access: Only facilitators and admins
    if (!['FACILITATOR', 'ADMIN'].includes(authContext.user.role)) {
      return errorResponse('Access denied. Risk assessments are only available to facilitators and coordinators.', 403);
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const refresh = searchParams.get('refresh') === 'true';

    if (!groupId) {
      return errorResponse('groupId is required', 400);
    }

    // Enforce group access for facilitators
    if (authContext.user.role === 'FACILITATOR') {
      const accessError = enforceGroupAccess(groupId, authContext);
      if (accessError) return accessError;
    }

    // Verify group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId, isDeleted: false },
    });

    if (!group) {
      return errorResponse('Group not found', 404);
    }

    // Get all active students in group
    const students = await prisma.student.findMany({
      where: {
        groupId,
        isDeleted: false,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
      },
    });

    // Get or generate risk profiles
    const riskProfiles = [];

    for (const student of students) {
      let profile;

      if (refresh) {
        // Regenerate assessment
        const assessment = await generateRiskAssessment(student.id);
        const profileId = await saveRiskProfile(student.id, assessment);
        profile = await prisma.studentRiskProfile.findUnique({
          where: { id: profileId },
        });
      } else {
        // Get most recent cached profile
        profile = await prisma.studentRiskProfile.findFirst({
          where: { studentId: student.id },
          orderBy: { calculatedAt: 'desc' },
        });

        // If no profile exists or it's older than 7 days, generate new one
        if (!profile || 
            (new Date().getTime() - new Date(profile.calculatedAt).getTime()) > 7 * 24 * 60 * 60 * 1000) {
          const assessment = await generateRiskAssessment(student.id);
          const profileId = await saveRiskProfile(student.id, assessment);
          profile = await prisma.studentRiskProfile.findUnique({
            where: { id: profileId },
          });
        }
      }

      if (profile) {
        // Log access for audit compliance
        await logRiskProfileAccess(
          profile.id,
          authContext.user.userId,
          'VIEWED',
          {
            groupId,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          }
        );

        // Parse JSON fields
        const riskFactors = JSON.parse(profile.riskFactors);
        const recommendedInterventions = JSON.parse(profile.recommendedInterventions);
        const metadata = profile.metadata ? JSON.parse(profile.metadata) : {};

        riskProfiles.push({
          studentId: student.id,
          studentCode: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          riskLevel: profile.riskLevel,
          riskFactors: riskFactors,
          confidenceScore: profile.confidenceScore,
          scores: {
            attendance: profile.attendanceRiskScore,
            assessment: profile.assessmentRiskScore,
            engagement: profile.engagementRiskScore,
            overall: profile.overallRiskScore,
          },
          recommendedInterventions: recommendedInterventions,
          calculatedAt: profile.calculatedAt,
          previousRiskLevel: profile.previousRiskLevel,
          riskLevelChangedAt: profile.riskLevelChangedAt,
          aiAnalysis: metadata.aiAnalysis,
        });
      }
    }

    // Sort by risk level (HIGH first, then MEDIUM, then LOW)
    const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    riskProfiles.sort((a, b) => 
      riskOrder[a.riskLevel as keyof typeof riskOrder] - riskOrder[b.riskLevel as keyof typeof riskOrder]
    );

    // Calculate summary statistics
    const summary = {
      totalStudents: students.length,
      highRisk: riskProfiles.filter(p => p.riskLevel === 'HIGH').length,
      mediumRisk: riskProfiles.filter(p => p.riskLevel === 'MEDIUM').length,
      lowRisk: riskProfiles.filter(p => p.riskLevel === 'LOW').length,
      lastUpdated: riskProfiles[0]?.calculatedAt || new Date(),
    };

    return successResponse({
      summary,
      students: riskProfiles,
      groupId,
      groupName: group.name,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/ai/risk-assessment
 * 
 * Manually trigger risk assessment generation for specific students
 * 
 * Body:
 * {
 *   "studentIds": ["uuid1", "uuid2"],
 *   "groupId": "group-uuid"  // Optional, for batch processing entire group
 * }
 */
async function generateRiskAssessmentHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const authContext = getAuthContext(request);
    if (!authContext) {
      return errorResponse('Unauthorized', 401);
    }

    // Enforce role-based access
    if (!['FACILITATOR', 'ADMIN'].includes(authContext.user.role)) {
      return errorResponse('Access denied', 403);
    }

    const body = await request.json();
    const { studentIds, groupId } = body;

    if (!studentIds && !groupId) {
      return errorResponse('Either studentIds or groupId is required', 400);
    }

    const results = [];
    let studentsToProcess = [];

    if (groupId) {
      // Enforce group access
      if (authContext.user.role === 'FACILITATOR') {
        const accessError = enforceGroupAccess(groupId, authContext);
        if (accessError) return accessError;
      }

      // Get all students in group
      studentsToProcess = await prisma.student.findMany({
        where: {
          groupId,
          isDeleted: false,
          status: 'ACTIVE',
        },
        select: { id: true, firstName: true, lastName: true },
      });
    } else {
      // Process specific students
      studentsToProcess = await prisma.student.findMany({
        where: {
          id: { in: studentIds },
          isDeleted: false,
        },
        include: { group: true },
      });

      // Verify access for facilitators
      if (authContext.user.role === 'FACILITATOR') {
        for (const student of studentsToProcess) {
          const accessError = enforceGroupAccess(student.groupId, authContext);
          if (accessError) return accessError;
        }
      }
    }

    // Generate assessments
    for (const student of studentsToProcess) {
      try {
        const assessment = await generateRiskAssessment(student.id);
        const profileId = await saveRiskProfile(student.id, assessment);

        // Log generation
        await logRiskProfileAccess(
          profileId,
          authContext.user.userId,
          'GENERATED'
        );

        results.push({
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          riskLevel: assessment.riskLevel,
          success: true,
        });
      } catch (error) {
        console.error(`Failed to generate assessment for student ${student.id}:`, error);
        results.push({
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return successResponse({
      processed: studentsToProcess.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(
  withRateLimit(getRiskAssessmentHandler, 'moderate'),
  ['ADMIN', 'FACILITATOR']
);

export const POST = withAuth(
  withRateLimit(generateRiskAssessmentHandler, 'strict'),
  ['ADMIN', 'FACILITATOR']
);
