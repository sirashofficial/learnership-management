import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/validation/data-integrity
 * Comprehensive data integrity validation endpoint
 * Returns list of data quality issues found in the system
 */
async function handleGet(request: NextRequest) {
  try {

    const issues: Array<{
      severity: 'critical' | 'warning' | 'info';
      category: string;
      issue: string;
      count?: number;
      details?: any[];
    }> = [];

    // 1. Check for students without required assessments
    const students = await prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: {
        assessments: {
          select: { id: true, unitStandardId: true, type: true, result: true },
        },
        group: {
          include: {
            unitStandardRollouts: {
              select: { unitStandardId: true },
            },
          },
        },
      },
    });

    const unitStandards = await prisma.unitStandard.findMany({
      select: { id: true, code: true, title: true, credits: true },
    });

    const studentsWithMissingAssessments: any[] = [];

    for (const student of students) {
      const requiredUnitStandardIds = new Set(
        student.group?.unitStandardRollouts?.map((r) => r.unitStandardId) || []
      );
      
      const studentAssessmentUSIds = new Set(
        student.assessments.map((a) => a.unitStandardId)
      );

      const missingUSIds = Array.from(requiredUnitStandardIds).filter(
        (id) => !studentAssessmentUSIds.has(id)
      );

      if (missingUSIds.length > 0) {
        const missingUS = unitStandards.filter((us) => missingUSIds.includes(us.id));
        studentsWithMissingAssessments.push({
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          groupName: student.group?.name,
          missingCount: missingUSIds.length,
          missing: missingUS.map((us) => ({
            code: us.code,
            title: us.title,
          })),
        });
      }
    }

    if (studentsWithMissingAssessments.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'assessments',
        issue: 'Students missing required assessments',
        count: studentsWithMissingAssessments.length,
        details: studentsWithMissingAssessments.slice(0, 10), // Limit to first 10
      });
    }

    // 2. Validate totalCreditsEarned matches actual competent assessments
    const creditMismatches: any[] = [];

    for (const student of students) {
      const competentAssessments = student.assessments.filter(
        (a) => a.result === 'COMPETENT'
      );

      // Get unique unit standard IDs (deduplicate)
      const uniqueUSIds = new Set(competentAssessments.map((a) => a.unitStandardId));

      // Calculate actual credits
      const actualCredits = unitStandards
        .filter((us) => uniqueUSIds.has(us.id))
        .reduce((sum, us) => sum + us.credits, 0);

      if (actualCredits !== student.totalCreditsEarned) {
        creditMismatches.push({
          studentId: student.studentId,
          name: `${student.firstName} ${student.lastName}`,
          storedCredits: student.totalCreditsEarned,
          actualCredits,
          difference: Math.abs(actualCredits - student.totalCreditsEarned),
        });
      }
    }

    if (creditMismatches.length > 0) {
      issues.push({
        severity: 'critical',
        category: 'credits',
        issue: 'Student credit totals do not match competent assessments',
        count: creditMismatches.length,
        details: creditMismatches.slice(0, 10),
      });
    }

    // 3. Check for orphaned UnitStandardProgress records
    const allProgress = await prisma.unitStandardProgress.findMany({
      include: {
        student: { select: { id: true, studentId: true, status: true } },
        unitStandard: { select: { id: true, code: true } },
      },
    });

    const orphanedProgress = allProgress.filter(
      (p) => !p.student || !p.unitStandard
    );

    if (orphanedProgress.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'progress',
        issue: 'Orphaned unit standard progress records',
        count: orphanedProgress.length,
      });
    }

    // 4. Check for students with inconsistent progress percentage
    const progressInconsistencies: any[] = [];

    for (const student of students) {
      const competentCount = student.assessments.filter(
        (a) => a.result === 'COMPETENT'
      ).length;

      const requiredCount =
        student.group?.unitStandardRollouts?.length || 0;

      if (requiredCount > 0) {
        const calculatedProgress = Math.round(
          (competentCount / requiredCount) * 100
        );

        // Allow 5% tolerance for rounding differences
        if (Math.abs(calculatedProgress - student.progress) > 5) {
          progressInconsistencies.push({
            studentId: student.studentId,
            name: `${student.firstName} ${student.lastName}`,
            storedProgress: student.progress,
            calculatedProgress,
            competentCount,
            requiredCount,
          });
        }
      }
    }

    if (progressInconsistencies.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'progress',
        issue: 'Student progress percentages inconsistent with assessments',
        count: progressInconsistencies.length,
        details: progressInconsistencies.slice(0, 10),
      });
    }

    // 5. Check for assessments without due dates  
    const assessmentsWithoutDates = await prisma.assessment.count({
      where: {
        OR: [
          { dueDate: { equals: undefined } },
          { dueDate: { lt: new Date('2000-01-01') } }, // Catch invalid dates
        ],
        result: 'PENDING',
      },
    });

    if (assessmentsWithoutDates > 0) {
      issues.push({
        severity: 'info',
        category: 'assessments',
        issue: 'Pending assessments without due dates',
        count: assessmentsWithoutDates,
      });
    }

    // 6. Check for groups without rollout plans
    const groupsWithoutRollouts = await prisma.group.count({
      where: {
        status: 'ACTIVE',
        unitStandardRollouts: {
          none: {},
        },
      },
    });

    if (groupsWithoutRollouts > 0) {
      issues.push({
        severity: 'warning',
        category: 'rollout',
        issue: 'Active groups without rollout plans',
        count: groupsWithoutRollouts,
      });
    }

    // 7. Check for duplicate assessments (same student, unit standard, type)
    const duplicateAssessments = await prisma.$queryRaw`
      SELECT studentId, unitStandardId, type, COUNT(*) as count
      FROM Assessment
      GROUP BY studentId, unitStandardId, type
      HAVING COUNT(*) > 1
    `;

    if (Array.isArray(duplicateAssessments) && duplicateAssessments.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'assessments',
        issue: 'Duplicate assessments found (same student, unit standard, type)',
        count: duplicateAssessments.length,
        details: duplicateAssessments.slice(0, 10),
      });
    }

    // Summary
    const summary = {
      totalIssues: issues.length,
      critical: issues.filter((i) => i.severity === 'critical').length,
      warnings: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
      studentsChecked: students.length,
      timestamp: new Date().toISOString(),
    };

    return successResponse({
      summary,
      issues,
    });
  } catch (err: any) {
    console.error('Data integrity validation error:', err);
    return errorResponse(err.message || 'Validation failed', 500);
  }
}

export const GET = withAuth(withRateLimit(handleGet, 'generous'), ['ADMIN']);
