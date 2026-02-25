/**
 * API Endpoint: /api/admin/run-risk-analysis
 * 
 * Manually trigger the weekly risk analysis job.
 * Admin-only endpoint for testing or manual execution.
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { getAuthContext, withAuth, withRateLimit } from '@/middleware/apiAuth';
import { runWeeklyRiskAnalysis } from '@/lib/ai/jobScheduler';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

/**
 * POST /api/admin/run-risk-analysis
 * 
 * Manually trigger the weekly risk analysis job
 */
async function runRiskAnalysisHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const authContext = getAuthContext(request);
    if (!authContext) {
      return errorResponse('Unauthorized', 401);
    }

    // Only admins can trigger manual analysis
    if (authContext.user.role !== 'ADMIN') {
      return errorResponse('Admin access required', 403);
    }

    console.log(`[API] Manual risk analysis triggered by ${authContext.user.name}`);

    // Run the analysis job
    const results = await runWeeklyRiskAnalysis();

    return successResponse({
      message: 'Risk analysis completed successfully',
      ...results,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to run risk analysis');
  }
}

export const POST = withAuth(
  withRateLimit(runRiskAnalysisHandler, 'strict'),
  ['ADMIN']
);
