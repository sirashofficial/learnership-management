import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRateLimit, getAuthContext } from '@/middleware/apiAuth';
import { prisma } from '@/lib/prisma';

async function handlePost(request: NextRequest) {
  try {
    const authContext = getAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authContext.user;
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
      where: { userId: user.userId },
    });

    let preference;

    if (existingPreference) {
      // Update existing preference
      preference = await prisma.reminderPreference.update({
        where: { userId: user.userId },
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
          userId: user.userId,
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

async function handleGet(request: NextRequest) {
  try {
    const authContext = getAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authContext.user;
    const preference = await prisma.reminderPreference.findUnique({
      where: { userId: user.userId },
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

export const POST = withAuth(withRateLimit(handlePost, 'moderate'), ['ADMIN', 'FACILITATOR', 'STUDENT']);
export const GET = withAuth(withRateLimit(handleGet, 'generous'), ['ADMIN', 'FACILITATOR', 'STUDENT']);
