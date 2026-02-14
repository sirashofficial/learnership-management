import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) {
      return error;
    }

    const body = await request.json();
    const {
      emailRemindersEnabled,
      browserNotificationsEnabled,
      quietHoursStart,
      quietHoursEnd,
      timeZone,
    } = body;

    // Find or create reminder preference for user
    const existingPreference = await prisma.reminderPreference.findUnique({
      where: { userId: user!.userId },
    });

    let preference;

    if (existingPreference) {
      // Update existing preference
      preference = await prisma.reminderPreference.update({
        where: { userId: user!.userId },
        data: {
          emailRemindersEnabled,
          browserNotificationsEnabled,
          quietHoursStart,
          quietHoursEnd,
          timeZone,
        },
      });
    } else {
      // Create new preference
      preference = await prisma.reminderPreference.create({
        data: {
          userId: user!.userId,
          emailRemindersEnabled,
          browserNotificationsEnabled,
          quietHoursStart,
          quietHoursEnd,
          timeZone,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        emailRemindersEnabled: preference.emailRemindersEnabled,
        browserNotificationsEnabled: preference.browserNotificationsEnabled,
        quietHoursStart: preference.quietHoursStart,
        quietHoursEnd: preference.quietHoursEnd,
        timeZone: preference.timeZone,
      },
    });
  } catch (error) {
    console.error('POST /api/settings/reminders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) {
      return error;
    }

    const preference = await prisma.reminderPreference.findUnique({
      where: { userId: user!.userId },
    });

    if (!preference) {
      // Return defaults if not found
      return NextResponse.json({
        emailRemindersEnabled: false,
        browserNotificationsEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timeZone: 'Africa/Johannesburg',
      });
    }

    return NextResponse.json({
      emailRemindersEnabled: preference.emailRemindersEnabled,
      browserNotificationsEnabled: preference.browserNotificationsEnabled,
      quietHoursStart: preference.quietHoursStart,
      quietHoursEnd: preference.quietHoursEnd,
      timeZone: preference.timeZone,
    });
  } catch (error) {
    console.error('GET /api/settings/reminders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
