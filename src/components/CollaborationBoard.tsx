'use client'

import React, { useState } from 'react'
import useSWR from 'swr'
import Comments from '@/components/Comments'
import ActivityFeed from '@/components/ActivityFeed'
import { AlertCircle, MessageCircle, TrendingUp } from 'lucide-react'

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

interface CollaborationBoardProps {
  studentId?: string
  groupId?: string
}

export default function CollaborationBoard({ studentId, groupId }: CollaborationBoardProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments')

  const params = new URLSearchParams()
  if (studentId) params.append('studentId', studentId)
  if (groupId) params.append('groupId', groupId)

  const { data, isLoading, error, mutate } = useSWR<CollaborationData>(
    `/api/dashboard/collaboration?${params.toString()}`,
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch collaboration data')
      return res.json()
    },
    { revalidateOnFocus: false, refreshInterval: 30000 }
  )

  const handleCommentSubmit = async (text: string, mentions: string[]) => {
    try {
      const res = await fetch('/api/dashboard/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId: studentId || groupId, 
          commentText: text, 
          mentions 
        })
      })
      
      if (res.ok) {
        // Revalidate to get the new comment
        mutate()
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
    }
  }

  const handleActivityAction = (activityId: string, action: 'like' | 'follow' | 'unfollow') => {
    // In a real app, this would make an API call to record the action
    console.log(`Activity ${activityId}: ${action}`)
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error loading collaboration</h3>
            <p className="text-red-700 text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Total Comments</p>
            <p className="text-2xl font-bold text-slate-900">{data.stats.totalComments}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Total Activity</p>
            <p className="text-2xl font-bold text-slate-900">{data.stats.totalActivity}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Likes</p>
            <p className="text-2xl font-bold text-red-600">{data.stats.totalLikes}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Follows</p>
            <p className="text-2xl font-bold text-blue-600">{data.stats.totalFollows}</p>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'comments'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          Comments
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'activity'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          Activity Feed
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        {activeTab === 'comments' ? (
          <Comments
            comments={data?.comments || []}
            onCommentSubmit={handleCommentSubmit}
            isLoading={isLoading}
          />
        ) : (
          <ActivityFeed
            activities={data?.activity || []}
            isLoading={isLoading}
            onAction={handleActivityAction}
          />
        )}
      </div>
    </div>
  )
}
