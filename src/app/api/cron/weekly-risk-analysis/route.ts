/**
 * Cron Endpoint: /api/cron/weekly-risk-analysis
 * 
 * Triggered weekly by Vercel Cron (Sundays at 2:00 AM)
 * Runs risk analysis for all active students
 */

import { NextRequest, NextResponse } from 'next/server';
import { runWeeklyRiskAnalysis } from '@/lib/ai/jobScheduler';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('[CRON] Running weekly risk analysis');
    const results = await runWeeklyRiskAnalysis();
    
    return NextResponse.json({
      success: true,
      message: 'Weekly risk analysis completed',
      ...results,
    });
  } catch (error) {
    console.error('[CRON] Weekly risk analysis failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
