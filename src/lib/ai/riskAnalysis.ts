/**
 * AI-Powered At-Risk Student Prediction System
 * 
 * This module provides machine learning-based risk assessment for students
 * by analyzing behavioral patterns including attendance, assessments, and engagement.
 * 
 * Privacy: Risk data only accessible to facilitators and coordinators
 * Compliance: All accesses are audit logged for ethical AI compliance
 */

import { PrismaClient } from '@prisma/client';
import { cohere } from './cohere';

const prisma = new PrismaClient();

// Risk thresholds configuration
export const RISK_THRESHOLDS = {
  attendance: {
    critical: 60,  // < 60% attendance = high risk
    warning: 80,   // < 80% attendance = medium risk
  },
  consecutiveAbsences: {
    critical: 5,   // >= 5 days = high risk
    warning: 3,    // >= 3 days = medium risk
  },
  formativeFailures: {
    critical: 3,   // >= 3 failures per module = high risk
    warning: 2,    // >= 2 failures per module = medium risk
  },
  engagement: {
    critical: 20,  // < 20% activity = high risk
    warning: 50,   // < 50% activity = medium risk
  },
} as const;

// Risk factor interfaces
export interface RiskFactor {
  category: 'ATTENDANCE' | 'ASSESSMENT' | 'ENGAGEMENT' | 'PROGRESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  value: number;
  threshold: number;
  recommendation?: string;
}

export interface StudentRiskData {
  studentId: string;
  studentName: string;
  groupId: string;
  // Attendance metrics
  attendanceRate: number;
  consecutiveAbsences: number;
  totalAbsences: number;
  totalSessions: number;
  // Assessment metrics
  formativeFailures: number;
  formativesPassed: number;
  totalFormatives: number;
  summativeFailures: number;
  lateSubmissions: number;
  // Engagement metrics
  lastLoginDate: Date | null;
  daysSinceLastLogin: number;
  totalLogins: number;
  portalActivityCount: number;
  // Progress metrics
  overallProgress: number;
  creditsEarned: number;
  currentModule: string | null;
}

export interface RiskAssessment {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFactors: RiskFactor[];
  confidenceScore: number;
  attendanceRiskScore: number;
  assessmentRiskScore: number;
  engagementRiskScore: number;
  overallRiskScore: number;
  recommendedInterventions: string[];
  aiAnalysis?: string;
}

/**
 * Collect comprehensive risk data for a student
 */
export async function collectStudentRiskData(studentId: string): Promise<StudentRiskData> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      group: true,
      currentModule: true,
      attendance: {
        where: {
          isDeleted: false,
        },
        orderBy: { date: 'desc' },
      },
      formativeCompletions: {
        include: {
          formative: true,
        },
      },
      assessments: {
        where: {
          isDeleted: false,
        },
      },
    },
  });

  if (!student) {
    throw new Error(`Student not found: ${studentId}`);
  }

  // Calculate attendance metrics
  const totalSessions = student.attendance.length;
  const presentSessions = student.attendance.filter(
    (a) => a.status === 'PRESENT'
  ).length;
  const attendanceRate = totalSessions > 0 
    ? (presentSessions / totalSessions) * 100 
    : 100;
  const totalAbsences = student.attendance.filter(
    (a) => a.status === 'ABSENT'
  ).length;

  // Calculate consecutive absences
  let consecutiveAbsences = 0;
  let currentStreak = 0;
  
  for (const record of student.attendance) {
    if (record.status === 'ABSENT') {
      currentStreak++;
      consecutiveAbsences = Math.max(consecutiveAbsences, currentStreak);
    } else if (record.status === 'PRESENT') {
      currentStreak = 0;
    }
  }

  // Calculate formative assessment metrics
  const formativeFailures = student.formativeCompletions.filter(
    (fc) => !fc.passed
  ).length;
  const formativesPassed = student.formativeCompletions.filter(
    (fc) => fc.passed
  ).length;
  const totalFormatives = student.formativeCompletions.length;

  // Calculate summative failures
  const summativeFailures = student.assessments.filter(
    (a) => a.type === 'SUMMATIVE' && (a.result === 'NYC' || a.result === 'FAIL')
  ).length;

  // Calculate late submissions (formatives with > 1 attempt)
  const lateSubmissions = student.formativeCompletions.filter(
    (fc) => fc.attempts > 1
  ).length;

  // Engagement metrics (placeholder - would need session tracking)
  const lastLoginDate = null; // TODO: Add login tracking
  const daysSinceLastLogin = 999; // High value indicates no tracking yet
  const totalLogins = 0;
  const portalActivityCount = student.assessments.length + student.formativeCompletions.length;

  return {
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    groupId: student.groupId,
    attendanceRate,
    consecutiveAbsences,
    totalAbsences,
    totalSessions,
    formativeFailures,
    formativesPassed,
    totalFormatives,
    summativeFailures,
    lateSubmissions,
    lastLoginDate,
    daysSinceLastLogin,
    totalLogins,
    portalActivityCount,
    overallProgress: student.progress,
    creditsEarned: student.totalCreditsEarned,
    currentModule: student.currentModule?.name || null,
  };
}

/**
 * Calculate risk scores based on collected data
 */
export function calculateRiskScores(data: StudentRiskData): {
  attendanceScore: number;
  assessmentScore: number;
  engagementScore: number;
  factors: RiskFactor[];
} {
  const factors: RiskFactor[] = [];

  // Attendance Risk Score (0-100, higher is more risk)
  let attendanceScore = 0;
  
  if (data.attendanceRate < RISK_THRESHOLDS.attendance.critical) {
    attendanceScore = 100;
    factors.push({
      category: 'ATTENDANCE',
      severity: 'HIGH',
      description: `Attendance rate is ${data.attendanceRate.toFixed(1)}% (critical threshold: ${RISK_THRESHOLDS.attendance.critical}%)`,
      value: data.attendanceRate,
      threshold: RISK_THRESHOLDS.attendance.critical,
      recommendation: 'Immediate intervention required - schedule parent meeting and check for barriers to attendance',
    });
  } else if (data.attendanceRate < RISK_THRESHOLDS.attendance.warning) {
    attendanceScore = 60;
    factors.push({
      category: 'ATTENDANCE',
      severity: 'MEDIUM',
      description: `Attendance rate is ${data.attendanceRate.toFixed(1)}% (warning threshold: ${RISK_THRESHOLDS.attendance.warning}%)`,
      value: data.attendanceRate,
      threshold: RISK_THRESHOLDS.attendance.warning,
      recommendation: 'Monitor closely and reach out to discuss attendance concerns',
    });
  }

  if (data.consecutiveAbsences >= RISK_THRESHOLDS.consecutiveAbsences.critical) {
    attendanceScore = Math.max(attendanceScore, 90);
    factors.push({
      category: 'ATTENDANCE',
      severity: 'HIGH',
      description: `${data.consecutiveAbsences} consecutive absences detected`,
      value: data.consecutiveAbsences,
      threshold: RISK_THRESHOLDS.consecutiveAbsences.critical,
      recommendation: 'Immediate contact required - student may have dropped out or facing serious issues',
    });
  } else if (data.consecutiveAbsences >= RISK_THRESHOLDS.consecutiveAbsences.warning) {
    attendanceScore = Math.max(attendanceScore, 50);
    factors.push({
      category: 'ATTENDANCE',
      severity: 'MEDIUM',
      description: `${data.consecutiveAbsences} consecutive absences detected`,
      value: data.consecutiveAbsences,
      threshold: RISK_THRESHOLDS.consecutiveAbsences.warning,
      recommendation: 'Contact student to check on wellbeing and identify any issues',
    });
  }

  // Assessment Risk Score (0-100)
  let assessmentScore = 0;
  
  if (data.formativeFailures >= RISK_THRESHOLDS.formativeFailures.critical) {
    assessmentScore = 100;
    factors.push({
      category: 'ASSESSMENT',
      severity: 'HIGH',
      description: `Failed ${data.formativeFailures} formative assessments`,
      value: data.formativeFailures,
      threshold: RISK_THRESHOLDS.formativeFailures.critical,
      recommendation: 'Urgent academic support needed - consider one-on-one tutoring or remedial sessions',
    });
  } else if (data.formativeFailures >= RISK_THRESHOLDS.formativeFailures.warning) {
    assessmentScore = 60;
    factors.push({
      category: 'ASSESSMENT',
      severity: 'MEDIUM',
      description: `Failed ${data.formativeFailures} formative assessments`,
      value: data.formativeFailures,
      threshold: RISK_THRESHOLDS.formativeFailures.warning,
      recommendation: 'Provide additional study materials and schedule extra practice sessions',
    });
  }

  if (data.summativeFailures > 0) {
    assessmentScore = Math.max(assessmentScore, 80);
    factors.push({
      category: 'ASSESSMENT',
      severity: 'HIGH',
      description: `Failed ${data.summativeFailures} summative assessments`,
      value: data.summativeFailures,
      threshold: 1,
      recommendation: 'Critical - arrange reassessment plan and intensive coaching',
    });
  }

  if (data.lateSubmissions > 3) {
    assessmentScore = Math.max(assessmentScore, 40);
    factors.push({
      category: 'ASSESSMENT',
      severity: 'MEDIUM',
      description: `${data.lateSubmissions} late or resubmitted assessments`,
      value: data.lateSubmissions,
      threshold: 3,
      recommendation: 'Help student with time management and assignment planning',
    });
  }

  // Engagement Risk Score (0-100)
  let engagementScore = 0;
  
  if (data.portalActivityCount < 5 && data.totalSessions > 10) {
    engagementScore = 70;
    factors.push({
      category: 'ENGAGEMENT',
      severity: 'HIGH',
      description: `Very low portal activity (${data.portalActivityCount} activities)`,
      value: data.portalActivityCount,
      threshold: 5,
      recommendation: 'Student may be disengaged - check motivation and provide encouragement',
    });
  } else if (data.portalActivityCount < 10 && data.totalSessions > 20) {
    engagementScore = 40;
    factors.push({
      category: 'ENGAGEMENT',
      severity: 'MEDIUM',
      description: `Low portal activity (${data.portalActivityCount} activities)`,
      value: data.portalActivityCount,
      threshold: 10,
      recommendation: 'Encourage more active participation in learning activities',
    });
  }

  // Progress risk
  if (data.overallProgress < 30 && data.totalSessions > 20) {
    const severity = data.overallProgress < 15 ? 'HIGH' : 'MEDIUM';
    factors.push({
      category: 'PROGRESS',
      severity,
      description: `Overall progress is ${data.overallProgress}% despite ${data.totalSessions} sessions`,
      value: data.overallProgress,
      threshold: 30,
      recommendation: severity === 'HIGH' 
        ? 'Critical intervention - student is significantly behind schedule'
        : 'Monitor progress closely and provide catch-up support',
    });
    
    if (severity === 'HIGH') {
      assessmentScore = Math.max(assessmentScore, 70);
    }
  }

  return {
    attendanceScore,
    assessmentScore,
    engagementScore,
    factors,
  };
}

/**
 * Use AI to enhance risk assessment with pattern recognition
 */
export async function enhanceRiskAssessmentWithAI(
  data: StudentRiskData,
  factors: RiskFactor[]
): Promise<{ analysis: string; confidence: number; interventions: string[] }> {
  const prompt = `You are an educational AI assistant analyzing student risk factors to predict dropout likelihood.

Student Profile:
- Name: ${data.studentName}
- Current Module: ${data.currentModule || 'Not assigned'}
- Overall Progress: ${data.overallProgress}%
- Credits Earned: ${data.creditsEarned}

Behavioral Metrics:
- Attendance Rate: ${data.attendanceRate.toFixed(1)}% (${data.totalAbsences} absences in ${data.totalSessions} sessions)
- Consecutive Absences: ${data.consecutiveAbsences} days
- Formative Assessments: ${data.formativesPassed} passed, ${data.formativeFailures} failed
- Summative Failures: ${data.summativeFailures}
- Late Submissions: ${data.lateSubmissions}
- Portal Activity: ${data.portalActivityCount} activities

Risk Factors Detected:
${factors.map((f, i) => `${i + 1}. [${f.severity}] ${f.category}: ${f.description}`).join('\n')}

Based on these patterns:
1. Provide a brief analysis of the student's risk level (2-3 sentences)
2. Estimate confidence in this assessment (0-100%)
3. Suggest 3-5 specific, actionable interventions

Return your response as JSON:
{
  "analysis": "brief analysis here",
  "confidence": 85,
  "interventions": ["intervention 1", "intervention 2", ...]
}`;

  try {
    const response = await cohere.chat({
      model: 'command-r-plus',
      message: prompt,
      temperature: 0.3,
      preamble: 'You are an expert in educational data analysis and student success prediction. Provide accurate, evidence-based assessments.',
    });

    // Extract JSON from response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        analysis: result.analysis,
        confidence: result.confidence / 100, // Convert to 0-1
        interventions: result.interventions,
      };
    }
  } catch (error) {
    console.error('AI enhancement failed:', error);
  }

  // Fallback to rule-based analysis
  return {
    analysis: factors.length > 0
      ? `Student shows ${factors.length} concerning pattern(s). Highest severity: ${factors[0]?.severity || 'LOW'}.`
      : 'No significant risk factors detected at this time.',
    confidence: factors.length > 0 ? 0.75 : 0.9,
    interventions: factors
      .filter((f) => f.recommendation)
      .map((f) => f.recommendation!)
      .slice(0, 3),
  };
}

/**
 * Generate complete risk assessment for a student
 */
export async function generateRiskAssessment(studentId: string): Promise<RiskAssessment> {
  // Collect data
  const data = await collectStudentRiskData(studentId);

  // Calculate risk scores
  const { attendanceScore, assessmentScore, engagementScore, factors } = 
    calculateRiskScores(data);

  // Calculate overall risk score (weighted average)
  const overallScore = (
    attendanceScore * 0.4 +  // Attendance is most predictive
    assessmentScore * 0.35 + // Assessment performance is critical
    engagementScore * 0.25   // Engagement is supporting indicator
  );

  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  if (overallScore >= 70) {
    riskLevel = 'HIGH';
  } else if (overallScore >= 40) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  // Enhance with AI
  const aiEnhancement = await enhanceRiskAssessmentWithAI(data, factors);

  return {
    riskLevel,
    riskFactors: factors,
    confidenceScore: aiEnhancement.confidence,
    attendanceRiskScore: attendanceScore,
    assessmentRiskScore: assessmentScore,
    engagementRiskScore: engagementScore,
    overallRiskScore: overallScore,
    recommendedInterventions: aiEnhancement.interventions,
    aiAnalysis: aiEnhancement.analysis,
  };
}

/**
 * Save risk assessment to database
 */
export async function saveRiskProfile(
  studentId: string,
  assessment: RiskAssessment
): Promise<string> {
  // Get previous risk profile if exists
  const previousProfile = await prisma.studentRiskProfile.findFirst({
    where: { studentId },
    orderBy: { calculatedAt: 'desc' },
  });

  const profile = await prisma.studentRiskProfile.create({
    data: {
      studentId,
      riskLevel: assessment.riskLevel,
      riskFactors: JSON.stringify(assessment.riskFactors),
      confidenceScore: assessment.confidenceScore,
      attendanceRiskScore: assessment.attendanceRiskScore,
      assessmentRiskScore: assessment.assessmentRiskScore,
      engagementRiskScore: assessment.engagementRiskScore,
      overallRiskScore: assessment.overallRiskScore,
      recommendedInterventions: JSON.stringify(assessment.recommendedInterventions),
      previousRiskLevel: previousProfile?.riskLevel || null,
      riskLevelChangedAt: 
        previousProfile && previousProfile.riskLevel !== assessment.riskLevel
          ? new Date()
          : previousProfile?.riskLevelChangedAt || null,
      metadata: JSON.stringify({
        aiAnalysis: assessment.aiAnalysis,
        factorCount: assessment.riskFactors.length,
      }),
    },
  });

  return profile.id;
}

/**
 * Batch process risk assessments for all students in a group
 */
export async function processGroupRiskAssessments(groupId: string): Promise<{
  processed: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}> {
  const students = await prisma.student.findMany({
    where: {
      groupId,
      isDeleted: false,
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  let highRisk = 0;
  let mediumRisk = 0;
  let lowRisk = 0;

  for (const student of students) {
    try {
      const assessment = await generateRiskAssessment(student.id);
      await saveRiskProfile(student.id, assessment);

      if (assessment.riskLevel === 'HIGH') highRisk++;
      else if (assessment.riskLevel === 'MEDIUM') mediumRisk++;
      else lowRisk++;
    } catch (error) {
      console.error(`Failed to process risk assessment for student ${student.id}:`, error);
    }
  }

  return {
    processed: students.length,
    highRisk,
    mediumRisk,
    lowRisk,
  };
}

/**
 * Log access to risk profile for audit compliance
 */
export async function logRiskProfileAccess(
  profileId: string,
  userId: string,
  action: 'VIEWED' | 'GENERATED' | 'INTERVENTION_CREATED' | 'EXPORTED',
  metadata?: Record<string, any>
): Promise<void> {
  await prisma.studentRiskAuditLog.create({
    data: {
      profileId,
      userId,
      action,
      ipAddress: metadata?.ipAddress || null,
      userAgent: metadata?.userAgent || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

export default {
  collectStudentRiskData,
  calculateRiskScores,
  generateRiskAssessment,
  saveRiskProfile,
  processGroupRiskAssessments,
  enhanceRiskAssessmentWithAI,
  logRiskProfileAccess,
};
