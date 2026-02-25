import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

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
    const client = getResend();
    if (!client) {
      console.warn('Resend API not configured. Email not sent.');
      return { success: false, error: 'Email service not configured' };
    }

    const result = await client.emails.send({
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

interface DataIntegrityAlertParams {
  to: string[];
  criticalCount: number;
  warningCount: number;
  issues: Array<{ description: string; severity: string }>;
  dashboardUrl: string;
}

export async function sendDataIntegrityAlert(params: DataIntegrityAlertParams) {
  const { to, criticalCount, warningCount, issues, dashboardUrl } = params;

  const issueList = issues
    .slice(0, 10)
    .map((issue) => `<li><strong>${issue.severity.toUpperCase()}:</strong> ${issue.description}</li>`)
    .join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0f172a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Data Integrity Alert</h2>
      </div>
      <div style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 12px 0;">
          Critical issues: <strong>${criticalCount}</strong><br />
          Warnings: <strong>${warningCount}</strong>
        </p>
        <ul style="padding-left: 18px; margin: 0 0 16px 0;">
          ${issueList || '<li>No detailed issues available.</li>'}
        </ul>
        <a href="${dashboardUrl}" style="display: inline-block; background: #0f766e; color: white; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Review Data Health
        </a>
      </div>
    </div>
  `;

  try {
    const client = getResend();
    if (!client) {
      console.warn('Resend API not configured. Email not sent.');
      return { success: false, error: 'Email service not configured' };
    }

    const result = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@learnership.com',
      to,
      subject: 'Data Integrity Alert',
      html: htmlContent,
    });

    return { success: true, messageId: result.data?.id || 'sent' };
  } catch (error) {
    console.error('Error sending data integrity alert:', error);
    throw error;
  }
}
