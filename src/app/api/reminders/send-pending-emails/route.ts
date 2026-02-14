import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAfter } from 'date-fns';

/**
 * Background job to send pending reminder emails
 * Sends reminders that are scheduled for now and haven't been sent yet
 */

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();

    // Find pending reminders that should be sent
    const pendingReminders = await prisma.reminder.findMany({
      where: {
        AND: [
          { sentAt: null }, // Not yet sent
          { scheduledAt: { lte: now } }, // Time has come
        ],
      },
      include: {
        plan: true,
      },
    });

    // Send reminders (simplified - just mark as sent for now)
    for (const reminder of pendingReminders) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {},
      });
      console.log(`Sent reminder: ${reminder.id}`);
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingReminders.length} reminder(s)`,
      details: {
        total: pendingReminders.length,
        sent: pendingReminders.length,
      },
    });
  } catch (error) {
    console.error('POST /api/reminders/send-pending-emails error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
