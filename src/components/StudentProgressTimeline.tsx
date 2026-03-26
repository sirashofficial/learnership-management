'use client'

import React from 'react'
import { format } from 'date-fns'
import { ChevronRight, User, BookOpen, CheckCircle, AlertCircle } from 'lucide-react'

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

interface StudentProgressTimelineProps {
  events: TimelineEvent[]
  isLoading?: boolean
}

export default function StudentProgressTimeline({ events, isLoading }: StudentProgressTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-3 bg-slate-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ENROLLED':
        return <User className="w-5 h-5 text-blue-600" />
      case 'START_MODULE':
      case 'COMPLETE_MODULE':
        return <BookOpen className="w-5 h-5 text-emerald-600" />
      case 'ASSESSMENT':
        return <AlertCircle className="w-5 h-5 text-orange-600" />
      case 'ACHIEVE_CREDIT':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />
      default:
        return <ChevronRight className="w-5 h-5 text-slate-400" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'ENROLLED':
        return 'bg-blue-50 border-blue-200'
      case 'START_MODULE':
      case 'COMPLETE_MODULE':
        return 'bg-emerald-50 border-emerald-200'
      case 'ASSESSMENT':
        return 'bg-orange-50 border-orange-200'
      case 'ACHIEVE_CREDIT':
        return 'bg-emerald-50 border-emerald-200'
      default:
        return 'bg-slate-50 border-slate-200'
    }
  }

  return (
    <div className="space-y-4">
      {events && events.length > 0 ? (
        events.map((event, idx) => (
          <div key={event.id} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${getEventColor(event.eventType)}`}>
                {getEventIcon(event.eventType)}
              </div>
              {idx < events.length - 1 && (
                <div className="w-0.5 h-12 bg-slate-200 mt-2"></div>
              )}
            </div>

            {/* Event details */}
            <div className={`flex-1 pt-1 pb-4 rounded-lg border px-4 py-3 ${getEventColor(event.eventType)}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900">
                    {event.studentName}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {event.details}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                    <span>{event.groupName}</span>
                    <span>•</span>
                    <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                {event.progress > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {event.progress}%
                    </p>
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mt-1">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${event.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-slate-500">
          <p className="text-sm">No timeline events</p>
        </div>
      )}
    </div>
  )
}
