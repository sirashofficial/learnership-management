'use client'

import React, { useState } from 'react'
import useSWR from 'swr'
import StudentProgressTimeline from '@/components/StudentProgressTimeline'
import TaskScheduleGantt from '@/components/TaskScheduleGantt'
import { AlertCircle } from 'lucide-react'

interface TimelineData {
  studentProgressTimeline: Array<{
    id: string
    studentId: string
    studentName: string
    groupName: string
    eventType: 'ENROLLED' | 'START_MODULE' | 'COMPLETE_MODULE' | 'ASSESSMENT' | 'ACHIEVE_CREDIT'
    date: string
    details: string
    progress: number
  }>
  taskScheduleGantt: Array<{
    id: string
    title: string
    type: 'MODULE' | 'ASSESSMENT' | 'SESSION'
    startDate: string
    endDate: string
    groupName: string
    progress: number
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
  }>
  stats: {
    totalEvents: number
    totalTasks: number
    completedTasks: number
    overdueTasks: number
  }
}

export default function TimelineView() {
  const [view, setView] = useState<'progress' | 'schedule'>('progress')

  const { data, isLoading, error } = useSWR<TimelineData>(
    '/api/dashboard/timeline',
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch timeline data')
      return res.json()
    },
    { revalidateOnFocus: false, refreshInterval: 60000 }
  )

  // Convert string dates to Date objects for components
  const studentProgressEvents: Array<{
    id: string
    studentId: string
    studentName: string
    groupName: string
    eventType: 'ENROLLED' | 'START_MODULE' | 'COMPLETE_MODULE' | 'ASSESSMENT' | 'ACHIEVE_CREDIT'
    date: Date
    details: string
    progress: number
  }> = data?.studentProgressTimeline.map(event => ({
    ...event,
    date: new Date(event.date),
    studentId: event.studentId
  })) || []

  const ganttTasks = data?.taskScheduleGantt.map(task => ({
    ...task,
    startDate: new Date(task.startDate),
    endDate: new Date(task.endDate)
  })) || []

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error loading timeline</h3>
            <p className="text-red-700 text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setView('progress')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            view === 'progress'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          📅 Student Progress
        </button>
        <button
          onClick={() => setView('schedule')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            view === 'schedule'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          📋 Task Schedule
        </button>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Total Events</p>
            <p className="text-2xl font-bold text-slate-900">{data.stats.totalEvents}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Tasks</p>
            <p className="text-2xl font-bold text-slate-900">{data.stats.totalTasks}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Completed</p>
            <p className="text-2xl font-bold text-emerald-600">{data.stats.completedTasks}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-600">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{data.stats.overdueTasks}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        {view === 'progress' ? (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Learner Progress Timeline</h3>
            <StudentProgressTimeline 
              events={studentProgressEvents as any}
              isLoading={isLoading}
            />
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Task Schedule</h3>
            <TaskScheduleGantt 
              tasks={ganttTasks}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  )
}
