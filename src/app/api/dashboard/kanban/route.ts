import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthContext, withAuth, withRateLimit } from '@/middleware/apiAuth'

export const dynamic = 'force-dynamic'

interface StudentPipelineCard {
  id: string
  studentId: string
  name: string
  email: string
  status: 'APPLICATION' | 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'WITHDRAWN'
  groupName: string
  progress: number
  joinedDate: Date
  daysInPipeline: number
}

interface AssessmentCard {
  id: string
  assessmentId: string
  studentName: string
  unitStandard: string
  dueDate: Date
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'MARKED' | 'APPROVED'
  result: string | null
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface PipelineColumn {
  id: string
  name: string
  count: number
  cards: StudentPipelineCard[]
}

interface AssessmentColumn {
  id: string
  name: string
  count: number
  cards: AssessmentCard[]
}

interface KanbanData {
  studentPipeline: PipelineColumn[]
  assessmentBoard: AssessmentColumn[]
  stats: {
    totalStudents: number
    totalAssessments: number
    overdueAssessments: number
    avgProgress: number
  }
}

async function getKanbanHandler(request: NextRequest) {
  try {
    const authContext = getAuthContext(request)
    const groupFilter = authContext?.user.role === 'FACILITATOR'
      ? { groupId: { in: authContext.allowedGroupIds } }
      : {}

    if (authContext?.user.role === 'FACILITATOR' && authContext.allowedGroupIds.length === 0) {
      return NextResponse.json({
        studentPipeline: [],
        assessmentBoard: [],
        stats: { totalStudents: 0, totalAssessments: 0, overdueAssessments: 0, avgProgress: 0 }
      })
    }

    // Get all active students with their group and status info
    const students = await prisma.student.findMany({
      where: { status: 'ACTIVE', ...groupFilter },
      include: {
        group: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Get all pending/in-progress assessments
    const assessments = await prisma.assessment.findMany({
      where: {
        result: null,
        ...(authContext?.user.role === 'FACILITATOR'
          ? { student: { groupId: { in: authContext.allowedGroupIds } } }
          : {})
      },
      include: {
        student: {
          select: { firstName: true, lastName: true }
        },
        unitStandard: {
          select: { code: true }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 100
    })

    // Build student pipeline based on progress
    const studentsByStatus: Record<string, StudentPipelineCard[]> = {
      'APPLICATION': [],
      'ENROLLED': [],
      'IN_PROGRESS': [],
      'COMPLETED': [],
      'WITHDRAWN': []
    }

    students.forEach(student => {
      let status: 'APPLICATION' | 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'WITHDRAWN' = 'ENROLLED'
      
      if (student.progress >= 100) {
        status = 'COMPLETED'
      } else if (student.progress > 0) {
        status = 'IN_PROGRESS'
      }

      const now = new Date()
      const daysInPipeline = Math.floor((now.getTime() - new Date(student.createdAt).getTime()) / (1000 * 60 * 60 * 24))

      studentsByStatus[status].push({
        id: student.id,
        studentId: student.id,
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student',
        email: student.email || '',
        status,
        groupName: student.group?.name || 'Unassigned',
        progress: student.progress || 0,
        joinedDate: student.createdAt,
        daysInPipeline
      })
    })

    // Build assessment board based on result status
    const assessmentsByStatus: Record<string, AssessmentCard[]> = {
      'NOT_STARTED': [],
      'IN_PROGRESS': [],
      'SUBMITTED': [],
      'MARKED': [],
      'APPROVED': []
    }

    assessments.forEach(assessment => {
      let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'MARKED' | 'APPROVED' = 'NOT_STARTED'
      
      if (assessment.moderationStatus === 'APPROVED') {
        status = 'APPROVED'
      } else if (assessment.result) {
        status = 'MARKED'
      } else if (new Date(assessment.dueDate) <= new Date()) {
        status = 'IN_PROGRESS'
      }

      // Calculate priority based on due date
      const daysUntilDue = Math.ceil((new Date(assessment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
      if (daysUntilDue <= 3) priority = 'HIGH'
      else if (daysUntilDue <= 7) priority = 'MEDIUM'

      assessmentsByStatus[status].push({
        id: assessment.id,
        assessmentId: assessment.id,
        studentName: `${assessment.student?.firstName || ''} ${assessment.student?.lastName || ''}`.trim() || 'Unknown',
        unitStandard: assessment.unitStandard?.code || 'Unknown',
        dueDate: assessment.dueDate,
        status,
        result: assessment.result,
        priority
      })
    })

    // Count total assessments
    const totalAssessments = assessments.length
    const overdueAssessments = assessments.filter(a => new Date(a.dueDate) <= new Date()).length
    const avgProgress = students.length > 0 
      ? Math.round(students.reduce((sum, s) => sum + (s.progress || 0), 0) / students.length)
      : 0

    // Format response
    const studentPipeline: PipelineColumn[] = [
      {
        id: 'APPLICATION',
        name: '📋 Application',
        count: studentsByStatus['APPLICATION'].length,
        cards: studentsByStatus['APPLICATION']
      },
      {
        id: 'ENROLLED',
        name: '✅ Enrolled',
        count: studentsByStatus['ENROLLED'].length,
        cards: studentsByStatus['ENROLLED']
      },
      {
        id: 'IN_PROGRESS',
        name: '🚀 In Progress',
        count: studentsByStatus['IN_PROGRESS'].length,
        cards: studentsByStatus['IN_PROGRESS']
      },
      {
        id: 'COMPLETED',
        name: '🎓 Completed',
        count: studentsByStatus['COMPLETED'].length,
        cards: studentsByStatus['COMPLETED']
      },
      {
        id: 'WITHDRAWN',
        name: '❌ Withdrawn',
        count: studentsByStatus['WITHDRAWN'].length,
        cards: studentsByStatus['WITHDRAWN']
      }
    ]

    const assessmentBoard: AssessmentColumn[] = [
      {
        id: 'NOT_STARTED',
        name: '⏸️ Not Started',
        count: assessmentsByStatus['NOT_STARTED'].length,
        cards: assessmentsByStatus['NOT_STARTED']
      },
      {
        id: 'IN_PROGRESS',
        name: '🔄 In Progress',
        count: assessmentsByStatus['IN_PROGRESS'].length,
        cards: assessmentsByStatus['IN_PROGRESS']
      },
      {
        id: 'SUBMITTED',
        name: '📤 Submitted',
        count: assessmentsByStatus['SUBMITTED'].length,
        cards: assessmentsByStatus['SUBMITTED']
      },
      {
        id: 'MARKED',
        name: '✏️ Marked',
        count: assessmentsByStatus['MARKED'].length,
        cards: assessmentsByStatus['MARKED']
      },
      {
        id: 'APPROVED',
        name: '✅ Approved',
        count: assessmentsByStatus['APPROVED'].length,
        cards: assessmentsByStatus['APPROVED']
      }
    ]

    const data: KanbanData = {
      studentPipeline,
      assessmentBoard,
      stats: {
        totalStudents: students.length,
        totalAssessments,
        overdueAssessments,
        avgProgress
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching kanban data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch kanban data' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(withRateLimit(getKanbanHandler, 'generous'), ['ADMIN', 'FACILITATOR'])
