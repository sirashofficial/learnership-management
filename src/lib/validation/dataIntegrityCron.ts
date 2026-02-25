import cron from 'node-cron';
import prisma from '../prisma';
import { runAllDataIntegrityChecks } from './dataIntegrityChecks';
import { sendDataIntegrityAlert } from '../email';

let cronInitialized = false;

async function logIssues(issues: Array<{ checkType: string; severity: string; description: string; entityId?: string }>) {
  if (issues.length === 0) return;

  await prisma.dataIntegrityLog.createMany({
    data: issues.map((issue) => ({
      checkType: issue.checkType,
      severity: issue.severity,
      description: issue.description,
      entityId: issue.entityId,
    })),
  });
}

async function runDataIntegrityJob() {
  const issues = await runAllDataIntegrityChecks();
  const criticalIssues = issues.filter((issue) => issue.severity === 'critical');
  const warningIssues = issues.filter((issue) => issue.severity === 'warning');

  await logIssues(issues);

  const criticalThreshold = Number(process.env.DATA_INTEGRITY_CRITICAL_THRESHOLD || 1);
  if (criticalIssues.length < criticalThreshold) {
    return;
  }

  const adminEmails = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { email: true },
  });

  const to = adminEmails.map((admin) => admin.email).filter(Boolean);
  if (to.length === 0) return;

  // Only send email alert if RESEND_API_KEY is configured
  if (process.env.RESEND_API_KEY) {
    try {
      await sendDataIntegrityAlert({
        to,
        criticalCount: criticalIssues.length,
        warningCount: warningIssues.length,
        issues: issues.map((issue) => ({
          description: issue.description,
          severity: issue.severity,
        })),
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/`,
      });
    } catch (error) {
      console.error('Failed to send data integrity alert:', error);
    }
  }
}

export async function initializeDataIntegrityCron() {
  if (cronInitialized) return;

  if (process.env.DATA_INTEGRITY_CRON_ENABLED === 'false') {
    return;
  }

  const schedule = process.env.DATA_INTEGRITY_CRON_SCHEDULE || '0 3 * * *';
  const timezone = process.env.DATA_INTEGRITY_CRON_TZ || 'UTC';

  cron.schedule(
    schedule,
    async () => {
      try {
        await runDataIntegrityJob();
      } catch (error) {
        console.error('Data integrity cron job failed:', error);
      }
    },
    { timezone }
  );

  cronInitialized = true;

  if (process.env.DATA_INTEGRITY_RUN_BASELINE === 'true') {
    try {
      await runDataIntegrityJob();
    } catch (error) {
      console.error('Baseline data integrity run failed:', error);
    }
  }
}
