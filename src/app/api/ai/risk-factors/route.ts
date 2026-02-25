/**
 * API Endpoint: /api/ai/risk-factors
 * 
 * Explains which specific behaviors triggered the risk flag for a student.
 * Provides explainable AI with detailed breakdowns.
 * 
 * Privacy: Only accessible to facilitators and coordinators
 * Compliance: All accesses are audit logged
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { enforceGroupAccess, getAuthContext, withAuth, withRateLimit } from '@/middleware/apiAuth';
import {
  collectStudentRiskData,
  calculateRiskScores,
  logRiskProfileAccess,
} from '@/lib/ai/riskAnalysis';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/risk-factors?studentId={studentId}
 * 
 * Query Parameters:
 * - studentId (required): The student to get detailed risk factors for
 */
async function getRiskFactorsHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const authContext = getAuthContext(request);
    if (!authContext) {
      return errorResponse('Unauthorized', 401);
    }

    // Enforce role-based access
    if (!['FACILITATOR', 'ADMIN'].includes(authContext.user.role)) {
      return errorResponse('Access denied. Risk factors are only available to facilitators and coordinators.', 403);
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return errorResponse('studentId is required', 400);
    }

    // Get student and verify access
    const student = await prisma.student.findUnique({
      where: { id: studentId, isDeleted: false },
      include: { group: true },
    });

    if (!student) {
      return errorResponse('Student not found', 404);
    }

    // Enforce group access for facilitators
    if (authContext.user.role === 'FACILITATOR') {
      const accessError = enforceGroupAccess(student.groupId, authContext);
      if (accessError) return accessError;
    }

    // Collect comprehensive risk data
    const riskData = await collectStudentRiskData(studentId);

    // Calculate risk scores and get detailed factors
    const { attendanceScore, assessmentScore, engagementScore, factors } = 
      calculateRiskScores(riskData);

    // Get latest risk profile for context
    const latestProfile = await prisma.studentRiskProfile.findFirst({
      where: { studentId },
      orderBy: { calculatedAt: 'desc' },
    });

    if (latestProfile) {
      // Log access for audit compliance
      await logRiskProfileAccess(
        latestProfile.id,
        authContext.user.userId,
        'VIEWED',
        {
          action: 'viewed_risk_factors',
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        }
      );
    }

    // Build detailed breakdown
    const breakdown = {
      student: {
        id: student.id,
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
        currentModule: riskData.currentModule,
        overallProgress: riskData.overallProgress,
      },
      riskScores: {
        attendance: {
          score: attendanceScore,
          severity: attendanceScore >= 70 ? 'HIGH' : attendanceScore >= 40 ? 'MEDIUM' : 'LOW',
          weight: 0.4,
        },
        assessment: {
          score: assessmentScore,
          severity: assessmentScore >= 70 ? 'HIGH' : assessmentScore >= 40 ? 'MEDIUM' : 'LOW',
          weight: 0.35,
        },
        engagement: {
          score: engagementScore,
          severity: engagementScore >= 70 ? 'HIGH' : engagementScore >= 40 ? 'MEDIUM' : 'LOW',
          weight: 0.25,
        },
        overall: attendanceScore * 0.4 + assessmentScore * 0.35 + engagementScore * 0.25,
      },
      detailedMetrics: {
        attendance: {
          rate: riskData.attendanceRate,
          consecutiveAbsences: riskData.consecutiveAbsences,
          totalAbsences: riskData.totalAbsences,
          totalSessions: riskData.totalSessions,
          presentSessions: riskData.totalSessions - riskData.totalAbsences,
        },
        assessments: {
          formativesPassed: riskData.formativesPassed,
          formativeFailures: riskData.formativeFailures,
          totalFormatives: riskData.totalFormatives,
          passRate: riskData.totalFormatives > 0 
            ? ((riskData.formativesPassed / riskData.totalFormatives) * 100).toFixed(1)
            : 'N/A',
          summativeFailures: riskData.summativeFailures,
          lateSubmissions: riskData.lateSubmissions,
        },
        engagement: {
          portalActivityCount: riskData.portalActivityCount,
          lastLoginDate: riskData.lastLoginDate,
          daysSinceLastLogin: riskData.daysSinceLastLogin > 900 ? 'Not tracked' : riskData.daysSinceLastLogin,
          totalLogins: riskData.totalLogins || 'Not tracked',
        },
        progress: {
          overallProgress: riskData.overallProgress,
          creditsEarned: riskData.creditsEarned,
        },
      },
      riskFactors: factors.map(factor => ({
        category: factor.category,
        severity: factor.severity,
        description: factor.description,
        value: factor.value,
        threshold: factor.threshold,
        recommendation: factor.recommendation,
        impact: factor.severity === 'HIGH' ? 'Significant' : factor.severity === 'MEDIUM' ? 'Moderate' : 'Minor',
      })),
      interventions: factors
        .filter(f => f.recommendation)
        .map(f => ({
          priority: f.severity,
          action: f.recommendation,
          category: f.category,
        })),
      historicalContext: latestProfile ? {
        previousRiskLevel: latestProfile.previousRiskLevel,
        currentRiskLevel: latestProfile.riskLevel,
        riskLevelChangedAt: latestProfile.riskLevelChangedAt,
        lastCalculated: latestProfile.calculatedAt,
        trend: latestProfile.previousRiskLevel && latestProfile.previousRiskLevel !== latestProfile.riskLevel
          ? (latestProfile.riskLevel === 'HIGH' ? 'Worsening' : 
             latestProfile.riskLevel === 'LOW' ? 'Improving' : 'Stable')
          : 'Stable',
      } : null,
      aiInsights: latestProfile?.metadata ? JSON.parse(latestProfile.metadata) : null,
    };

    return successResponse(breakdown);
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(
  withRateLimit(getRiskFactorsHandler, 'moderate'),
  ['ADMIN', 'FACILITATOR']
);
