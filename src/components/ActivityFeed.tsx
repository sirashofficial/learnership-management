'use client'

import React, { useState } from 'react'
import {
  Heart,
  UserPlus,
  CheckCircle,
  BookOpen,
  Share2,
  MoreVertical,
  TrendingUp,
  Users
} from 'lucide-react'

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

interface ActivityFeedProps {
  activities: ActivityItem[]
  isLoading?: boolean
  onAction?: (activityId: string, action: 'like' | 'follow' | 'unfollow') => void
}

export default function ActivityFeed({ activities, isLoading, onAction }: ActivityFeedProps) {
  const [likedActivities, setLikedActivities] = useState<Set<string>>(new Set())
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(
    new Set(activities.filter(a => a.isFollowing).map(a => a.actorId))
  )

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="w-5 h-5 text-red-600" />
      case 'FOLLOW':
        return <UserPlus className="w-5 h-5 text-blue-600" />
      case 'ASSESSMENT_SUBMITTED':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />
      case 'MODULE_COMPLETED':
        return <BookOpen className="w-5 h-5 text-emerald-600" />
      case 'GROUP_JOINED':
        return <Users className="w-5 h-5 text-orange-600" />
      default:
        return <Share2 className="w-5 h-5 text-slate-600" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'LIKE':
        return 'bg-red-50 border-red-200'
      case 'FOLLOW':
        return 'bg-blue-50 border-blue-200'
      case 'ASSESSMENT_SUBMITTED':
        return 'bg-emerald-50 border-emerald-200'
      case 'MODULE_COMPLETED':
        return 'bg-emerald-50 border-emerald-200'
      case 'GROUP_JOINED':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-slate-50 border-slate-200'
    }
  }

  const getActivityDescription = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'LIKE':
        return `${activity.actor} liked ${activity.object}`
      case 'FOLLOW':
        return `${activity.actor} started following ${activity.object}`
      case 'ASSESSMENT_SUBMITTED':
        return `${activity.actor} submitted ${activity.object}`
      case 'MODULE_COMPLETED':
        return `${activity.actor} completed ${activity.object}`
      case 'GROUP_JOINED':
        return `${activity.actor} joined ${activity.object}`
      default:
        return `${activity.actor} ${activity.subject}`
    }
  }

  const formatDate = (date: Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return d.toLocaleDateString()
  }

  const handleLike = (activityId: string) => {
    const newLiked = new Set(likedActivities)
    if (newLiked.has(activityId)) {
      newLiked.delete(activityId)
    } else {
      newLiked.add(activityId)
    }
    setLikedActivities(newLiked)
    onAction?.(activityId, 'like')
  }

  const handleFollow = (activityId: string, actorId: string, isFollowing: boolean) => {
    const newFollowing = new Set(followingUsers)
    if (isFollowing) {
      newFollowing.delete(actorId)
      onAction?.(activityId, 'unfollow')
    } else {
      newFollowing.add(actorId)
      onAction?.(activityId, 'follow')
    }
    setFollowingUsers(newFollowing)
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3 bg-slate-100 rounded-lg p-4">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              <div className="h-3 bg-slate-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Activity Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <p className="text-xs text-red-600 font-medium">Likes</p>
          <p className="text-2xl font-bold text-red-600">
            {activities.filter(a => a.type === 'LIKE').length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-blue-600 font-medium">Follows</p>
          <p className="text-2xl font-bold text-blue-600">
            {activities.filter(a => a.type === 'FOLLOW').length}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
          <p className="text-xs text-emerald-600 font-medium">Assessments</p>
          <p className="text-2xl font-bold text-emerald-600">
            {activities.filter(a => a.type === 'ASSESSMENT_SUBMITTED').length}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
          <p className="text-xs text-emerald-600 font-medium">Modules</p>
          <p className="text-2xl font-bold text-emerald-600">
            {activities.filter(a => a.type === 'MODULE_COMPLETED').length}
          </p>
        </div>
      </div>

      {/* Activity List */}
      {activities && activities.length > 0 ? (
        <div className="space-y-2">
          {activities.map(activity => {
            const isFollowing = followingUsers.has(activity.actorId)
            return (
              <div
                key={activity.id}
                className={`rounded-lg border p-4 flex items-start gap-4 transition-colors ${getActivityColor(activity.type)}`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <img
                          src={activity.actorAvatar}
                          alt={activity.actor}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {getActivityDescription(activity)}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(activity.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    {activity.type === 'LIKE' && (
                      <button
                        onClick={() => handleLike(activity.id)}
                        className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                          likedActivities.has(activity.id)
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-red-50'
                        }`}
                      >
                        <Heart className="w-4 h-4" />
                        <span>Like</span>
                      </button>
                    )}

                    {activity.type === 'FOLLOW' && (
                      <button
                        onClick={() => handleFollow(activity.id, activity.actorId, isFollowing)}
                        className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                          isFollowing
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50'
                        }`}
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>{isFollowing ? 'Following' : 'Follow'}</span>
                      </button>
                    )}

                    {activity.type === 'ASSESSMENT_SUBMITTED' && (
                      <button className="flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded text-sm hover:bg-emerald-100 transition-colors">
                        <CheckCircle className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    )}

                    {activity.type === 'MODULE_COMPLETED' && (
                      <button className="flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded text-sm hover:bg-emerald-100 transition-colors">
                        <BookOpen className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No activity yet. Engage with the community to see updates!</p>
        </div>
      )}
    </div>
  )
}
