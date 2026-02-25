import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthContext, withAuth, withRateLimit } from '@/middleware/apiAuth'

export const dynamic = 'force-dynamic'

interface Alert {
  id: string
  type: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  message: string
  details: string
  entityId: string
  entityType: 'GROUP' | 'STUDENT' | 'ASSESSMENT'
  createdAt: Date
}

/**
 * GET /api/dashboard/alerts?severity=CRITICAL|WARNING|INFO&role=ADMIN|FACILITATOR|LEARNER
 * Returns all alerts filtered by severity for role
 * Includes: At-risk groups, overdue assessments, low attendance warnings
 */
async function getEnhancedAlertsHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const severity = searchParams.get('severity') || 'ALL'
    const role = searchParams.get('role') || 'ADMIN'

    const authContext = getAuthContext(request)
    const allowedGroupIds = authContext?.user.role === 'FACILITATOR'
      ? authContext.allowedGroupIds
      : null

    if (authContext?.user.role === 'FACILITATOR' && authContext.allowedGroupIds.length === 0) {
      return NextResponse.json({
        alerts: [],
        count: { critical: 0, warning: 0, info: 0 },
        timestamp: new Date().toISOString()
      })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const alerts: Alert[] = []

    // Get all active groups with student data (limit to prevent performance issues)
    const groups = await prisma.group.findMany({
      where: {
        status: 'ACTIVE',
        ...(allowedGroupIds ? { id: { in: allowedGroupIds } } : {})
      },
      include: {
        students: {
          include: {
            attendance: { where: { date: { gte: thirtyDaysAgo } } },
            assessments: { where: { dueDate: { gte: new Date() } } }
          }
        },
        plans: true
      },
      take: 100 // Limit to 100 groups max for performance
    })

    // Check each group for risks
    groups.forEach(group => {
      if (group.students.length === 0) {
        alerts.push({
          id: `group-${group.id}-no-students`,
          type: 'NO_STUDENTS',
          severity: 'WARNING',
          message: `${group.name} has no students enrolled`,
          details: 'Consider adding students or archiving this group',
          entityId: group.id,
          entityType: 'GROUP',
          createdAt: new Date()
        })
        return
      }

      // Calculate group metrics
      const avgAttendance =
        group.students.reduce((sum, s) => {
          if (s.attendance.length === 0) return sum
          const present = s.attendance.filter(
            a => a.status === 'PRESENT' || a.status === 'LATE'
          ).length
          return sum + (present / s.attendance.length) * 100
        }, 0) / group.students.length

      const avgProgress =
        group.students.reduce(
          (sum, s) => sum + (s.totalCreditsEarned || 0),
          0
        ) / group.students.length

      const pendingCount = group.students.reduce(
        (sum, s) => sum + s.assessments.filter(a => a.result === 'PENDING').length,
        0
      )

      // Calculate risk score
      const riskScore =
        (Math.max(0, 100 - avgAttendance) * 0.3) +
        (Math.max(0, 100 - avgProgress) * 0.4) +
        (pendingCount * 0.15)

      // Only create ONE alert per group - the most severe one
      let alertAdded = false

      // CRITICAL: At-risk groups
      if (riskScore > 75 && !alertAdded) {
        alerts.push({
          id: `group-${group.id}-at-risk`,
          type: 'AT_RISK',
          severity: 'CRITICAL',
          message: `${group.name}: AT RISK - Intervention needed`,
          details: `Attendance: ${Math.round(avgAttendance)}% | Progress: ${Math.round(avgProgress)}/140 credits | Pending: ${pendingCount}`,
          entityId: group.id,
          entityType: 'GROUP',
          createdAt: new Date()
        })
        alertAdded = true
      }

      // CRITICAL: Low attendance
      if (avgAttendance < 50 && !alertAdded) {
        alerts.push({
          id: `group-${group.id}-critical-attendance`,
          type: 'CRITICAL_ATTENDANCE',
          severity: 'CRITICAL',
          message: `${group.name}: Critical attendance - ${Math.round(avgAttendance)}%`,
          details: 'Attendance below 50%. Immediate intervention required.',
          entityId: group.id,
          entityType: 'GROUP',
          createdAt: new Date()
        })
        alertAdded = true
      }

      // WARNING: Low attendance
      if (avgAttendance < 75 && avgAttendance >= 50 && !alertAdded) {
        alerts.push({
          id: `group-${group.id}-low-attendance`,
          type: 'LOW_ATTENDANCE',
          severity: 'WARNING',
          message: `${group.name}: Low attendance - ${Math.round(avgAttendance)}%`,
          details: 'Attendance trending below target',
          entityId: group.id,
          entityType: 'GROUP',
          createdAt: new Date()
        })
        alertAdded = true
      }

      // WARNING: Behind schedule
      if (avgProgress < 50 && !alertAdded) {
        alerts.push({
          id: `group-${group.id}-behind`,
          type: 'BEHIND_SCHEDULE',
          severity: 'WARNING',
          message: `${group.name}: Behind schedule - ${Math.round(avgProgress)}/140 credits`,
          details: 'Group progress below expected trajectory',
          entityId: group.id,
          entityType: 'GROUP',
          createdAt: new Date()
        })
        alertAdded = true
      }

      // INFO: Completions (only if no critical/warning issues)
      const completedStudents = group.students.filter(
        s => s.status === 'COMPLETED'
      )
      if (completedStudents.length > 0 && !alertAdded) {
        alerts.push({
          id: `group-${group.id}-completed`,
          type: 'COMPLETED',
          severity: 'INFO',
          message: `${completedStudents.length} student(s) in ${group.name} completed programme`,
          details: `Ready for graduation: ${completedStudents.map(s => `${s.firstName} ${s.lastName}`).join(', ')}`,
          entityId: group.id,
          entityType: 'GROUP',
          createdAt: new Date()
        })
      }
    })

    // Check for overdue assessments (CRITICAL) - limit to top 20 most overdue
    const overdueAssessments = await prisma.assessment.findMany({
      where: {
        result: null,  // Pending = not yet graded
        dueDate: { lt: new Date() },
        ...(allowedGroupIds ? { student: { groupId: { in: allowedGroupIds } } } : {})
      },
      include: { student: true, unitStandard: true },
      orderBy: { dueDate: 'asc' },
      take: 20
    })

    overdueAssessments.forEach(assessment => {
      alerts.push({
        id: `assessment-${assessment.id}-overdue`,
        type: 'OVERDUE_ASSESSMENT',
        severity: 'CRITICAL',
        message: `Overdue: ${assessment.unitStandard.title} - ${assessment.student.firstName} ${assessment.student.lastName}`,
        details: `Due: ${assessment.dueDate.toLocaleDateString()}`,
        entityId: assessment.id,
        entityType: 'ASSESSMENT',
        createdAt: new Date()
      })
    })

    // Filter by severity if requested
    let filtered = alerts
    if (severity !== 'ALL') {
      filtered = alerts.filter(a => a.severity === severity)
    }

    // Sort by severity (CRITICAL → WARNING → INFO) and date
    filtered.sort((a, b) => {
      const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 }
      const severityDiff =
        severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

    return NextResponse.json({
      alerts: filtered,
      count: {
        critical: filtered.filter(a => a.severity === 'CRITICAL').length,
        warning: filtered.filter(a => a.severity === 'WARNING').length,
        info: filtered.filter(a => a.severity === 'INFO').length
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Dashboard Alerts Error]', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard alerts' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(withRateLimit(getEnhancedAlertsHandler, 'generous'), ['ADMIN', 'FACILITATOR'])
