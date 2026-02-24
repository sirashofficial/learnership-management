import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/cards
 * Returns all metric cards data for the dashboard
 * Includes: totalStudents, totalGroups, attendanceRate, atRiskCount, completionRate, pendingAssessments
 */
export async function GET(request: NextRequest) {
  try {
    // Total active students
    const totalStudents = await prisma.student.count({
      where: { status: 'ACTIVE' }
    })

    // Total active groups
    const totalGroups = await prisma.group.count({
      where: { status: 'ACTIVE' }
    })

    // Attendance rate (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const attendance = await prisma.attendance.groupBy({
      by: ['status'],
      where: {
        date: { gte: thirtyDaysAgo },
        status: { in: ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] }
      },
      _count: true
    })

    const totalAttendanceRecords = attendance.reduce(
      (sum, record) => sum + record._count,
      0
    )

    const presentCount = attendance
      .filter(r => r.status === 'PRESENT' || r.status === 'LATE')
      .reduce((sum, r) => sum + r._count, 0)

    const attendanceRate = totalAttendanceRecords > 0 
      ? Math.round((presentCount / totalAttendanceRecords) * 100)
      : 0

    // At-risk count (groups with risk score > 75)
    const groups = await prisma.group.findMany({
      where: { status: 'ACTIVE' },
      include: {
        students: {
          include: {
            attendance: { where: { date: { gte: thirtyDaysAgo } } },
            moduleProgress: true
          }
        },
        plans: true
      }
    })

    let atRiskCount = 0
    groups.forEach(group => {
      if (group.students.length === 0) return

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

      const riskScore =
        (Math.max(0, 100 - avgAttendance) * 0.3) +
        (Math.max(0, 100 - avgProgress) * 0.4) +
        (group.students.length * 0.15)

      if (riskScore > 75) {
        atRiskCount++
      }
    })

    // Completion rate
    const completedStudents = await prisma.student.count({
      where: {
        moduleProgress: {
          every: { status: 'COMPLETED' }
        }
      }
    })

    const completionRate =
      totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0

    // Pending assessments
    const pendingAssessments = await prisma.assessment.count({
      where: {
        result: 'PENDING',
        dueDate: { gte: new Date() }
      }
    })

    return NextResponse.json({
      totalStudents,
      totalGroups,
      attendanceRate,
      atRiskCount,
      completionRate,
      pendingAssessments,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Dashboard Cards Error]', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard cards' },
      { status: 500 }
    )
  }
}
