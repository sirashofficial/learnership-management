/**
 * Weekly Risk Analysis Background Job
 * 
 * Automatically runs risk assessments for all active students
 * and triggers interventions for high-risk cases.
 * 
 * Schedule: Every Sunday at 2:00 AM
 * 
 * Usage in production:
 * - Vercel Cron: Add to vercel.json
 * - Node-cron: Run as separate process
 * - Manual trigger: POST /api/admin/run-risk-analysis
 */

import { PrismaClient } from '@prisma/client';
import {
  generateRiskAssessment,
  saveRiskProfile,
  processGroupRiskAssessments,
} from './riskAnalysis';
import { triggerInterventions } from './interventions';

const prisma = new PrismaClient();

/**
 * Process a single student's risk assessment
 */
async function processStudent(studentId: string): Promise<{
  studentId: string;
  studentName: string;
  riskLevel: string;
  interventionTriggered: boolean;
  error?: string;
}> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Generate risk assessment
    const assessment = await generateRiskAssessment(studentId);

    // Save to database
    const profileId = await saveRiskProfile(studentId, assessment);

    // Trigger interventions if high or medium risk
    let interventionTriggered = false;
    if (assessment.riskLevel === 'HIGH' || assessment.riskLevel === 'MEDIUM') {
      await triggerInterventions(studentId, profileId, assessment);
      interventionTriggered = true;
    }

    return {
      studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      riskLevel: assessment.riskLevel,
      interventionTriggered,
    };
  } catch (error) {
    console.error(`Error processing student ${studentId}:`, error);
    
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true },
    });

    return {
      studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
      riskLevel: 'ERROR',
      interventionTriggered: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process all students in batches
 */
export async function runWeeklyRiskAnalysis(): Promise<{
  startTime: Date;
  endTime: Date;
  totalStudents: number;
  successful: number;
  failed: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  interventionsTriggered: number;
  results: Array<{
    studentId: string;
    studentName: string;
    riskLevel: string;
    interventionTriggered: boolean;
    error?: string;
  }>;
}> {
  const startTime = new Date();
  console.log(`[RISK ANALYSIS JOB] Starting at ${startTime.toISOString()}`);

  // Get all active students
  const students = await prisma.student.findMany({
    where: {
      isDeleted: false,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      groupId: true,
    },
  });

  console.log(`[RISK ANALYSIS JOB] Processing ${students.length} students`);

  const results = [];
  let successful = 0;
  let failed = 0;
  let highRisk = 0;
  let mediumRisk = 0;
  let lowRisk = 0;
  let interventionsTriggered = 0;

  // Process in batches of 10 to avoid overwhelming the system
  const BATCH_SIZE = 10;
  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE);
    
    console.log(
      `[RISK ANALYSIS JOB] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(students.length / BATCH_SIZE)}`
    );

    const batchResults = await Promise.all(
      batch.map((student) => processStudent(student.id))
    );

    for (const result of batchResults) {
      results.push(result);

      if (result.error) {
        failed++;
      } else {
        successful++;

        if (result.riskLevel === 'HIGH') {
          highRisk++;
        } else if (result.riskLevel === 'MEDIUM') {
          mediumRisk++;
        } else if (result.riskLevel === 'LOW') {
          lowRisk++;
        }

        if (result.interventionTriggered) {
          interventionsTriggered++;
        }
      }
    }

    // Small delay between batches to prevent rate limiting
    if (i + BATCH_SIZE < students.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const endTime = new Date();
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;

  console.log(`[RISK ANALYSIS JOB] Completed in ${durationMinutes.toFixed(1)} minutes`);
  console.log(`[RISK ANALYSIS JOB] Results:`, {
    total: students.length,
    successful,
    failed,
    highRisk,
    mediumRisk,
    lowRisk,
    interventionsTriggered,
  });

  // Log job completion to audit log
  await prisma.auditLog.create({
    data: {
      userId: 'SYSTEM',
      action: 'WEEKLY_RISK_ANALYSIS_COMPLETED',
      entityType: 'BackgroundJob',
      entityId: `job-${startTime.getTime()}`,
      timestamp: endTime,
      ipAddress: '127.0.0.1',
      metadata: JSON.stringify({
        startTime,
        endTime,
        durationMinutes: durationMinutes.toFixed(1),
        totalStudents: students.length,
        successful,
        failed,
        highRisk,
        mediumRisk,
        lowRisk,
        interventionsTriggered,
      }),
    },
  });

  return {
    startTime,
    endTime,
    totalStudents: students.length,
    successful,
    failed,
    highRisk,
    mediumRisk,
    lowRisk,
    interventionsTriggered,
    results,
  };
}

/**
 * Monthly model improvement job
 * Collects actual outcomes and prepares training data
 */
export async function runMonthlyModelImprovement(): Promise<{
  outcomesCollected: number;
  accuracyRate: number;
}> {
  console.log('[MODEL IMPROVEMENT JOB] Starting monthly model improvement');

  // Find students who have outcomes recorded in the last month
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const outcomes = await prisma.studentOutcome.findMany({
    where: {
      outcomeDate: {
        gte: oneMonthAgo,
      },
      feedbackProvided: false,
    },
    include: {
      student: {
        include: {
          riskProfiles: {
            where: {
              calculatedAt: {
                lte: oneMonthAgo,
              },
            },
            orderBy: {
              calculatedAt: 'desc',
            },
            take: 1,
          },
        },
      },
    },
  });

  let correct = 0;
  const updates = [];

  for (const outcome of outcomes) {
    const lastProfile = outcome.student.riskProfiles[0];
    
    if (!lastProfile) continue;

    // Determine if prediction was correct
    // HIGH risk should predict DROP_OUT or ON_HOLD
    // LOW risk should predict COMPLETED
    const predictedCorrectly =
      (lastProfile.riskLevel === 'HIGH' &&
        (outcome.outcomeType === 'DROPPED_OUT' || outcome.outcomeType === 'ON_HOLD')) ||
      (lastProfile.riskLevel === 'LOW' && outcome.outcomeType === 'COMPLETED');

    if (predictedCorrectly) {
      correct++;
    }

    // Update outcome with prediction accuracy
    updates.push(
      prisma.studentOutcome.update({
        where: { id: outcome.id },
        data: {
          riskLevelAtOutcome: lastProfile.riskLevel,
          riskScoreAtOutcome: lastProfile.overallRiskScore,
          predictedCorrectly,
          feedbackProvided: true,
        },
      })
    );
  }

  // Execute updates
  await Promise.all(updates);

  const accuracyRate = outcomes.length > 0 ? (correct / outcomes.length) * 100 : 0;

  console.log(`[MODEL IMPROVEMENT JOB] Completed:`, {
    outcomesCollected: outcomes.length,
    correctPredictions: correct,
    accuracyRate: accuracyRate.toFixed(1) + '%',
  });

  // Log to audit
  await prisma.auditLog.create({
    data: {
      userId: 'SYSTEM',
      action: 'MONTHLY_MODEL_IMPROVEMENT_COMPLETED',
      entityType: 'BackgroundJob',
      entityId: `improvement-${Date.now()}`,
      timestamp: new Date(),
      ipAddress: '127.0.0.1',
      metadata: JSON.stringify({
        outcomesCollected: outcomes.length,
        correctPredictions: correct,
        accuracyRate,
      }),
    },
  });

  return {
    outcomesCollected: outcomes.length,
    accuracyRate,
  };
}

/**
 * Simple cron scheduler (for development)
 * In production, use Vercel Cron or dedicated job scheduler
 */
export function startScheduler() {
  console.log('[SCHEDULER] Starting risk analysis scheduler');

  // Run weekly on Sundays at 2:00 AM
  const runWeekly = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    if (day === 0 && hour === 2) {
      // Sunday at 2 AM
      runWeeklyRiskAnalysis().catch((error) => {
        console.error('[SCHEDULER] Weekly job failed:', error);
      });
    }
  };

  // Run monthly on the 1st at 3:00 AM
  const runMonthly = () => {
    const now = new Date();
    const date = now.getDate();
    const hour = now.getHours();

    if (date === 1 && hour === 3) {
      // 1st of month at 3 AM
      runMonthlyModelImprovement().catch((error) => {
        console.error('[SCHEDULER] Monthly job failed:', error);
      });
    }
  };

  // Check every hour
  setInterval(() => {
    runWeekly();
    runMonthly();
  }, 60 * 60 * 1000); // 1 hour

  console.log('[SCHEDULER] Scheduler started');
}

export default {
  runWeeklyRiskAnalysis,
  runMonthlyModelImprovement,
  startScheduler,
};
