import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ReminderEmailParams {
  to: string;
  reminderTitle: string;
  lessonTitle?: string;
  scheduledTime: string;
  venue?: string;
  dashboardUrl: string;
}

export async function sendReminderEmail(params: ReminderEmailParams) {
  const {
    to,
    reminderTitle,
    lessonTitle,
    scheduledTime,
    venue,
    dashboardUrl,
  } = params;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">📍 Reminder: ${reminderTitle}</h2>
      </div>
      
      <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
        ${
          lessonTitle
            ? `<p style="margin: 10px 0;"><strong>Lesson:</strong> ${lessonTitle}</p>`
            : ''
        }
        <p style="margin: 10px 0;"><strong>Scheduled Time:</strong> ${scheduledTime}</p>
        ${
          venue
            ? `<p style="margin: 10px 0;"><strong>Venue:</strong> ${venue}</p>`
            : ''
        }
        
        <div style="margin-top: 20px;">
          <a href="${dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
            View on Dashboard
          </a>
        </div>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
        
        <p style="font-size: 12px; color: #6b7280;">
          This is an automated reminder from the Learnership Management System. You can disable reminders in your settings.
        </p>
      </div>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@learnership.com',
      to,
      subject: `Reminder: ${reminderTitle}`,
      html: htmlContent,
    });

    return { success: true, messageId: result.data?.id || 'sent' };
  } catch (error) {
    console.error('Error sending reminder email:', error);
    throw error;
  }
}

interface PendingReminderEmail {
  id: string;
  userEmail: string;
  reminderTitle: string;
  lessonTitle?: string;
  scheduledTime: string;
  venue?: string | null;
}

export async function sendPendingReminderEmails(
  reminders: PendingReminderEmail[]
) {
  const results = [];

  for (const reminder of reminders) {
    try {
      const result = await sendReminderEmail({
        to: reminder.userEmail,
        reminderTitle: reminder.reminderTitle,
        lessonTitle: reminder.lessonTitle,
        scheduledTime: reminder.scheduledTime,
        venue: reminder.venue || '',
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/timetable`,
      });

      results.push({ reminderId: reminder.id, ...result });
    } catch (error) {
      results.push({
        reminderId: reminder.id,
        success: false,
        error: String(error),
      });
    }
  }

  return results;
}
