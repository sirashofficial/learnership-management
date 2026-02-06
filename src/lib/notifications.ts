// Browser Notification Utility for Learnership Management

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

class NotificationManager {
  private static instance: NotificationManager;

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Request permission for browser notifications
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Check if notifications are supported and permission is granted
  isAvailable(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  // Show a notification
  show(options: NotificationOptions): Notification | null {
    if (!this.isAvailable()) {
      console.warn('Notifications are not available');
      return null;
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icon.png',
      tag: options.tag,
      requireInteraction: options.requireInteraction ?? false,
    });

    return notification;
  }

  // Schedule a notification
  scheduleNotification(
    options: NotificationOptions,
    delayMs: number
  ): number {
    const timeoutId = window.setTimeout(() => {
      this.show(options);
    }, delayMs);

    return timeoutId;
  }

  // Cancel a scheduled notification
  cancelScheduled(timeoutId: number): void {
    window.clearTimeout(timeoutId);
  }
}

export const notificationManager = NotificationManager.getInstance();

// Helper function to schedule session notifications
export function scheduleSessionNotification(
  groupName: string,
  sessionDate: Date,
  sessionTime: string,
  notifyBeforeMinutes: number,
  venue: string
): number | null {
  const notificationManager = NotificationManager.getInstance();

  if (!notificationManager.isAvailable()) {
    return null;
  }

  // Parse session time (e.g., "09:00")
  const [hours, minutes] = sessionTime.split(':').map(Number);
  const sessionDateTime = new Date(sessionDate);
  sessionDateTime.setHours(hours, minutes, 0, 0);

  // Calculate notification time
  const notificationTime = new Date(sessionDateTime.getTime() - notifyBeforeMinutes * 60 * 1000);
  const now = new Date();
  const delay = notificationTime.getTime() - now.getTime();

  // Only schedule if notification time is in the future
  if (delay <= 0) {
    return null;
  }

  const timeoutId = notificationManager.scheduleNotification(
    {
      title: `Upcoming Session: ${groupName}`,
      body: `Your session starts in ${notifyBeforeMinutes} minutes at ${venue}`,
      tag: `session-${groupName}-${sessionDate.toISOString()}-${venue}`,
      requireInteraction: true,
    },
    delay
  );

  return timeoutId;
}

// Helper function to check and schedule notifications for upcoming sessions
export async function checkAndScheduleUpcomingNotifications(
  sessions: Array<{
    date: Date;
    groupName: string;
    startTime: string;
    venue: string;
    notificationEnabled: boolean;
    notificationTime: number;
  }>
): Promise<void> {
  const notificationManager = NotificationManager.getInstance();

  // Request permission if not already granted
  const hasPermission = await notificationManager.requestPermission();

  if (!hasPermission) {
    console.warn('Notification permission not granted');
    return;
  }

  // Schedule notifications for each enabled session
  sessions.forEach((session) => {
    if (session.notificationEnabled) {
      scheduleSessionNotification(
        session.groupName,
        session.date,
        session.startTime,
        session.notificationTime,
        session.venue
      );
    }
  });
}

export default notificationManager;
