import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthContext, withAuth, withRateLimit } from '@/middleware/apiAuth'

export const dynamic = 'force-dynamic'

interface TimelineEvent {
  id: string
  studentId: string
  studentName: string
  groupName: string
  eventType: 'ENROLLED' | 'START_MODULE' | 'COMPLETE_MODULE' | 'ASSESSMENT' | 'ACHIEVE_CREDIT'
  date: Date
  details: string
  progress: number
}

interface GanttTask {
  id: string
  title: string
  type: 'MODULE' | 'ASSESSMENT' | 'SESSION'
  startDate: Date
  endDate: Date
  groupName: string
  progress: number
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
  assignedTo?: string
}

interface TimelineData {
  studentProgressTimeline: TimelineEvent[]
  taskScheduleGantt: GanttTask[]
  stats: {
    totalEvents: number
    totalTasks: number
    completedTasks: number
    overdueTasks: number
  }
}

async function getTimelineHandler(request: NextRequest) {
  try {
    const authContext = getAuthContext(request)
    const groupFilter = authContext?.user.role === 'FACILITATOR'
      ? { groupId: { in: authContext.allowedGroupIds } }
      : {}

    if (authContext?.user.role === 'FACILITATOR' && authContext.allowedGroupIds.length === 0) {
      return NextResponse.json({
        studentProgressTimeline: [],
        taskScheduleGantt: [],
        stats: { totalEvents: 0, totalTasks: 0, completedTasks: 0, overdueTasks: 0 }
      })
    }

    // Get student timeline events
    const students = await prisma.student.findMany({
      where: { status: 'ACTIVE', ...groupFilter },
      include: {
        group: { select: { name: true } },
        assessments: {
          select: { dueDate: true, result: true, unitStandardId: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Build student progress timeline
    const studentProgressTimeline: TimelineEvent[] = []

    students.forEach(student => {
      // Enrollment event
      studentProgressTimeline.push({
        id: `${student.id}-enrolled`,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        groupName: student.group?.name || 'Unassigned',
        eventType: 'ENROLLED',
        date: student.createdAt,
        details: `Enrolled in ${student.group?.name || 'programme'}`,
        progress: 0
      })

      // Progress milestones
      if (student.progress > 0) {
        studentProgressTimeline.push({
          id: `${student.id}-progress`,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`.trim(),
          groupName: student.group?.name || 'Unassigned',
          eventType: 'ACHIEVE_CREDIT',
          date: new Date(student.updatedAt),
          details: `Progress: ${student.progress}%`,
          progress: student.progress
        })
      }

      // Assessment events
      student.assessments?.slice(0, 3).forEach(assessment => {
        studentProgressTimeline.push({
          id: `${student.id}-assessment-${assessment.unitStandardId}`,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`.trim(),
          groupName: student.group?.name || 'Unassigned',
          eventType: 'ASSESSMENT',
          date: assessment.dueDate,
          details: assessment.result ? `Assessment Complete: ${assessment.result}` : 'Assessment Due',
          progress: student.progress
        })
      })
    })

    // Get task schedule data (modules, sessions, assessments)
    const [modules, sessions, assessments] = await Promise.all([
      prisma.module.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, code: true },
        take: 20
      }),
      prisma.session.findMany({
        where: {
          ...(authContext?.user.role === 'FACILITATOR'
            ? { groupId: { in: authContext.allowedGroupIds } }
            : {})
        },
        orderBy: { date: 'asc' },
        include: { group: { select: { name: true } } },
        take: 30
      }),
      prisma.assessment.findMany({
        where: {
          result: null,
          ...(authContext?.user.role === 'FACILITATOR'
            ? { student: { groupId: { in: authContext.allowedGroupIds } } }
            : {})
        },
        orderBy: { dueDate: 'asc' },
        include: { student: { select: { firstName: true, lastName: true } } },
        take: 30
      })
    ])

    // Build Gantt tasks
    const ganttTasks: GanttTask[] = []

    // Module tasks
    modules.forEach(module => {
      const startDate = new Date()
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 21) // 3 weeks per module

      ganttTasks.push({
        id: `module-${module.id}`,
        title: `${module.code}: ${module.name}`,
        type: 'MODULE',
        startDate,
        endDate,
        groupName: 'All Groups',
        progress: 45,
        status: 'IN_PROGRESS'
      })
    })

    // Session tasks
    sessions.forEach(session => {
      const daysUntilEnd = Math.ceil((new Date(session.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      let status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' = 'SCHEDULED'
      if (daysUntilEnd < 0) status = 'COMPLETED'
      else if (daysUntilEnd === 0) status = 'IN_PROGRESS'

      ganttTasks.push({
        id: `session-${session.id}`,
        title: `📚 ${session.title}`,
        type: 'SESSION',
        startDate: new Date(session.date),
        endDate: new Date(new Date(session.date).getTime() + (2 * 60 * 60 * 1000)), // 2 hours
        groupName: session.group?.name || 'Unknown',
        progress: status === 'COMPLETED' ? 100 : status === 'IN_PROGRESS' ? 50 : 0,
        status
      })
    })

    // Assessment tasks
    assessments.forEach(assessment => {
      const daysUntilDue = Math.ceil((new Date(assessment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      let status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' = 'SCHEDULED'
      if (daysUntilDue < 0) status = 'OVERDUE'
      else if (daysUntilDue <= 3) status = 'IN_PROGRESS'

      ganttTasks.push({
        id: `assessment-${assessment.id}`,
        title: `✏️ Assessment (${assessment.student?.firstName || 'Student'})`,
        type: 'ASSESSMENT',
        startDate: new Date(new Date(assessment.dueDate).getTime() - (7 * 24 * 60 * 60 * 1000)), // 7 days before due
        endDate: assessment.dueDate,
        groupName: 'Assessments',
        progress: 0,
        status,
        assignedTo: assessment.student?.firstName
      })
    })

    // Calculate stats
    const completedTasks = ganttTasks.filter(t => t.status === 'COMPLETED').length
    const overdueTasks = ganttTasks.filter(t => t.status === 'OVERDUE').length

    const data: TimelineData = {
      studentProgressTimeline: studentProgressTimeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      taskScheduleGantt: ganttTasks.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
      stats: {
        totalEvents: studentProgressTimeline.length,
        totalTasks: ganttTasks.length,
        completedTasks,
        overdueTasks
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching timeline data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline data' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(withRateLimit(getTimelineHandler, 'generous'), ['ADMIN', 'FACILITATOR'])
