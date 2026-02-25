/**
 * Cron Endpoint: /api/cron/monthly-model-improvement
 * 
 * Triggered monthly by Vercel Cron (1st of month at 3:00 AM)
 * Collects actual student outcomes and calculates model accuracy
 */

import { NextRequest, NextResponse } from 'next/server';
import { runMonthlyModelImprovement } from '@/lib/ai/jobScheduler';

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
    console.log('[CRON] Running monthly model improvement');
    const results = await runMonthlyModelImprovement();
    
    return NextResponse.json({
      success: true,
      message: 'Monthly model improvement completed',
      ...results,
    });
  } catch (error) {
    console.error('[CRON] Monthly model improvement failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
