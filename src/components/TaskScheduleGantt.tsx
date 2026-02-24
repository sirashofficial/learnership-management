'use client'

import React, { useMemo } from 'react'
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

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

interface TaskScheduleGanttProps {
  tasks: GanttTask[]
  isLoading?: boolean
}

export default function TaskScheduleGantt({ tasks, isLoading }: TaskScheduleGanttProps) {
  const now = new Date()
  
  // Get date range from tasks or use current month
  const dateRange = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      }
    }
    
    const dates = tasks.flatMap(t => [t.startDate, t.endDate])
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
    
    return { start: minDate, end: maxDate }
  }, [tasks])

  const days = useMemo(() => eachDayOfInterval({ start: dateRange.start, end: dateRange.end }), [dateRange])

  const getTaskPosition = (task: GanttTask) => {
    const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1
    const startOffset = differenceInDays(task.startDate, dateRange.start)
    const duration = differenceInDays(task.endDate, task.startDate) + 1
    
    return {
      left: Math.max(0, (startOffset / totalDays) * 100),
      width: Math.max(2, (duration / totalDays) * 100)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500'
      case 'IN_PROGRESS':
        return 'bg-blue-500'
      case 'OVERDUE':
        return 'bg-red-500'
      default:
        return 'bg-slate-400'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MODULE':
        return '📚'
      case 'ASSESSMENT':
        return '✏️'
      case 'SESSION':
        return '📅'
      default:
        return '📌'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-32 h-8 bg-slate-200 rounded"></div>
            <div className="flex-1 h-8 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full">
        {/* Header with dates */}
        <div className="flex sticky top-0 bg-white border-b border-slate-200 z-10">
          <div className="w-48 flex-shrink-0 px-4 py-2 border-r border-slate-200">
            <p className="text-xs font-semibold text-slate-600 uppercase">Task</p>
          </div>
          <div className="flex-1 flex">
            {days.map((day, idx) => (
              <div
                key={day.toISOString()}
                className={`flex-1 px-1 py-2 text-center text-xs font-medium border-r border-slate-100 ${
                  format(day, 'E') === 'Sun' ? 'bg-slate-50' : ''
                }`}
              >
                {idx % 5 === 0 && format(day, 'd')}
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        {tasks && tasks.length > 0 ? (
          tasks.map((task) => {
            const position = getTaskPosition(task)
            return (
              <div key={task.id} className="flex border-b border-slate-100 hover:bg-slate-50 transition-colors">
                {/* Task label */}
                <div className="w-48 flex-shrink-0 px-4 py-3 border-r border-slate-200 text-xs">
                  <p className="font-medium text-slate-900 line-clamp-2">
                    {getTypeIcon(task.type)} {task.title}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">{task.groupName}</p>
                </div>

                {/* Timeline bar */}
                <div className="flex-1 relative px-1 py-3">
                  <div className="absolute h-6 bg-slate-100 rounded border border-slate-200 top-1/2 transform -translate-y-1/2" style={{
                    left: `${position.left}%`,
                    width: `${position.width}%`
                  }}>
                    <div className={`h-full ${getStatusColor(task.status)} rounded border border-opacity-0 flex items-center justify-end px-2`}>
                      {task.progress > 0 && (
                        <span className="text-xs font-bold text-white">{task.progress}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No tasks to display</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-6 p-4 bg-slate-50 border-t border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded"></div>
          <span className="text-slate-600">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-slate-600">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-slate-600">Overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-400 rounded"></div>
          <span className="text-slate-600">Scheduled</span>
        </div>
      </div>
    </div>
  )
}
