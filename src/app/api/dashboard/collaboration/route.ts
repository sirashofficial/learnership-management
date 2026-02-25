import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, handleApiError, errorResponse } from '@/lib/api-utils'
import { withAuth, withRateLimit, getAuthContext } from '@/middleware/apiAuth'
import { getUnreadCount } from '@/lib/collaboration'

export const dynamic = 'force-dynamic'

interface Comment {
  id: string
  author: string
  authorId: string
  avatar: string
  content: string
  mentions: string[]
  date: Date
  likes: number
  replies: number
  isLiked: boolean
}

interface ActivityItem {
  id: string
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'ASSESSMENT_SUBMITTED' | 'MODULE_COMPLETED' | 'GROUP_JOINED'
  actor: string
  actorId: string
  actorAvatar: string
  subject: string
  object?: string
  objectType?: 'ASSESSMENT' | 'MODULE' | 'USER' | 'GROUP'
  date: Date
  isFollowing?: boolean
}

interface CollaborationData {
  comments: Comment[]
  activity: ActivityItem[]
  stats: {
    totalComments: number
    totalActivity: number
    totalLikes: number
    totalFollows: number
  }
}

async function handleGet(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get('studentId')
    const groupId = request.nextUrl.searchParams.get('groupId')

    // Get students to fetch comments for
    let students = await prisma.student.findMany({
      where: studentId ? { id: studentId } : groupId ? { groupId } : undefined,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        group: { select: { name: true } }
      },
      take: 10
    })

    // Build sample comments (would be fetched from actual comments table if it existed)
    const comments: Comment[] = students.flatMap(student => [
      {
        id: `${student.id}-comment-1`,
        author: `${student.firstName} ${student.lastName}`,
        authorId: student.id,
        avatar: `https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName}&background=0D8ABC&color=fff`,
        content: `Great work on the assessment! Keep it up! @${student.firstName}`,
        mentions: [student.firstName],
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        likes: 3,
        replies: 1,
        isLiked: false
      },
      {
        id: `${student.id}-comment-2`,
        author: 'Mentor',
        authorId: 'mentor-1',
        avatar: 'https://ui-avatars.com/api/?name=Mentor&background=FF6B6B&color=fff',
        content: `Please review the module materials before submitting the next assessment.`,
        mentions: [student.firstName],
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        likes: 1,
        replies: 0,
        isLiked: false
      }
    ])

    // Build sample activity feed
    const getActivityDate = (daysAgo: number) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

    const activity: ActivityItem[] = [
      ...students.slice(0, 5).map((student, idx) => ({
        id: `activity-assessment-${idx}`,
        type: 'ASSESSMENT_SUBMITTED' as const,
        actor: `${student.firstName} ${student.lastName}`,
        actorId: student.id,
        actorAvatar: `https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName}&background=0D8ABC&color=fff`,
        subject: 'Submitted Assessment',
        object: 'Unit Standard 123',
        objectType: 'ASSESSMENT' as const,
        date: getActivityDate(idx)
      })),
      ...students.slice(0, 3).map((student, idx) => ({
        id: `activity-module-${idx}`,
        type: 'MODULE_COMPLETED' as const,
        actor: `${student.firstName} ${student.lastName}`,
        actorId: student.id,
        actorAvatar: `https://ui-avatars.com/api/?name=${student.firstName}+${student.lastName}&background=0D8ABC&color=fff`,
        subject: 'Completed Module',
        object: 'Module 5: Advanced Topics',
        objectType: 'MODULE' as const,
        date: getActivityDate(idx + 3)
      })),
      ...students.slice(0, 4).map((student, idx) => ({
        id: `activity-like-${idx}`,
        type: 'LIKE' as const,
        actor: 'Group Member',
        actorId: `student-${idx}`,
        actorAvatar: `https://ui-avatars.com/api/?name=Member+${idx}&background=65C78D&color=fff`,
        subject: 'Liked',
        object: `${student.firstName}'s progress`,
        objectType: 'USER' as const,
        date: getActivityDate(idx + 5),
        isFollowing: false
      })),
      ...students.slice(0, 2).map((student, idx) => ({
        id: `activity-follow-${idx}`,
        type: 'FOLLOW' as const,
        actor: 'New Mentor',
        actorId: `mentor-${idx}`,
        actorAvatar: `https://ui-avatars.com/api/?name=Mentor+${idx}&background=FF6B6B&color=fff`,
        subject: 'Started Following',
        object: `${student.firstName} ${student.lastName}`,
        objectType: 'USER' as const,
        date: getActivityDate(idx + 7),
        isFollowing: idx === 0
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime())

    const stats = {
      totalComments: comments.length,
      totalActivity: activity.length,
      totalLikes: activity.filter(a => a.type === 'LIKE').length,
      totalFollows: activity.filter(a => a.type === 'FOLLOW').length
    }

    // Convert dates to ISO strings for JSON serialization
    const data: CollaborationData = {
      comments: comments.map(c => ({
        ...c,
        date: c.date
      })),
      activity: activity.map(a => ({
        ...a,
        date: a.date
      })),
      stats
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Collaboration API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collaboration data' },
      { status: 500 }
    )
  }
}

async function handlePost(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, commentText, mentions } = body

    if (!studentId || !commentText) {
      return NextResponse.json(
        { error: 'studentId and commentText required' },
        { status: 400 }
      )
    }

    // In a real app, this would save the comment to the database
    // For now, return a success response with the new comment
    const newComment = {
      id: `comment-${Date.now()}`,
      author: 'Current User',
      authorId: 'user-123',
      avatar: 'https://ui-avatars.com/api/?name=Current+User&background=0D8ABC&color=fff',
      content: commentText,
      mentions: mentions || [],
      date: new Date(),
      likes: 0,
      replies: 0,
      isLiked: false
    }

    return NextResponse.json(
      { success: true, comment: newComment },
      { status: 201 }
    )
  } catch (error) {
    console.error('Comment POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(withRateLimit(handleGet, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const POST = withAuth(withRateLimit(handlePost, 'strict'), ['ADMIN', 'FACILITATOR']);
