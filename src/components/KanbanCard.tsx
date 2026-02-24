'use client'

import React from 'react'
import { AlertCircle, Calendar, Flag, User } from 'lucide-react'

interface StudentCardProps {
  id: string
  name: string
  email: string
  groupName: string
  progress: number
  daysInPipeline: number
  status: string
  onCardClick?: (id: string) => void
  draggable?: boolean
}

interface AssessmentCardProps {
  id: string
  studentName: string
  unitStandard: string
  dueDate: Date
  status: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  onCardClick?: (id: string) => void
  draggable?: boolean
}

export type KanbanCardProps = StudentCardProps | AssessmentCardProps

function isStudentCard(props: any): props is StudentCardProps {
  return 'groupName' in props && 'progress' in props
}

export default function KanbanCard(props: KanbanCardProps) {
  const isStudent = isStudentCard(props)

  if (isStudent) {
    const { id, name, email, groupName, progress, daysInPipeline, onCardClick, draggable } = props as StudentCardProps
    
    return (
      <div
        draggable={draggable}
        onClick={() => onCardClick?.(id)}
        className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md cursor-grab active:cursor-grabbing transition-all"
      >
        {/* Name + Status Pill */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h4 className="font-semibold text-sm text-slate-900 line-clamp-2 flex-1">
            {name}
          </h4>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
            {daysInPipeline}d
          </span>
        </div>

        {/* Group + Progress */}
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{groupName}</span>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-xs font-medium text-slate-600 min-w-[30px] text-right">
              {progress}%
            </span>
          </div>
        </div>

        {/* Email */}
        <p className="text-xs text-slate-500 truncate mt-2 pt-2 border-t border-slate-100">
          {email}
        </p>
      </div>
    )
  } else {
    const { id, studentName, unitStandard, dueDate, priority, onCardClick, draggable } = props as AssessmentCardProps
    
    const priorityConfig = {
      HIGH: { color: 'bg-red-50', textColor: 'text-red-700', badge: '🔴' },
      MEDIUM: { color: 'bg-amber-50', textColor: 'text-amber-700', badge: '🟡' },
      LOW: { color: 'bg-green-50', textColor: 'text-green-700', badge: '🟢' }
    }
    
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    const isPastDue = days < 0

    return (
      <div
        draggable={draggable}
        onClick={() => onCardClick?.(id)}
        className={`${priorityConfig[priority].color} rounded-lg border border-slate-200 p-4 hover:shadow-md cursor-grab active:cursor-grabbing transition-all`}
      >
        {/* Header: Name + Priority */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-sm text-slate-900 line-clamp-2 flex-1">
            {studentName}
          </h4>
          <span className="text-lg">{priorityConfig[priority].badge}</span>
        </div>

        {/* Unit Standard */}
        <p className="text-xs text-slate-600 mb-3 font-mono">
          {unitStandard}
        </p>

        {/* Due Date */}
        <div className="flex items-center gap-2 text-xs bg-white bg-opacity-50 rounded px-2 py-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span className={isPastDue ? 'text-red-600 font-semibold' : 'text-slate-600'}>
            {isPastDue ? '❌ Overdue' : `Due in ${days}d`}
          </span>
        </div>
      </div>
    )
  }
}
