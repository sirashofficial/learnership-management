'use client'

import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr-config'
import KanbanColumn from './KanbanColumn'
import Toast, { useToast } from './Toast'

interface KanbanStats {
  totalStudents: number
  totalAssessments: number
  overdueAssessments: number
  avgProgress: number
}

interface KanbanBoardData {
  studentPipeline: Array<{
    id: string
    name: string
    count: number
    cards: any[]
  }>
  assessmentBoard: Array<{
    id: string
    name: string
    count: number
    cards: any[]
  }>
  stats: KanbanStats
}

export default function KanbanBoard() {
  const { data, isLoading, error } = useSWR<KanbanBoardData>(
    '/api/dashboard/kanban',
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60000 } // Refresh every 60s
  )

  const [activeBoard, setActiveBoard] = useState<'student' | 'assessment'>('student')
  const { toast, showToast, hideToast } = useToast()
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  const handleCardClick = (cardId: string) => {
    setSelectedCard(cardId)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>

        {/* Board Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-slate-50 rounded-lg border border-slate-200 h-96 animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
        <p className="text-red-900 font-medium mb-2">Unable to load Kanban boards</p>
        <p className="text-red-700 text-sm">Please try refreshing the page</p>
      </div>
    )
  }

  const stats = data?.stats || {
    totalStudents: 0,
    totalAssessments: 0,
    overdueAssessments: 0,
    avgProgress: 0
  }

  const studentPipeline = data?.studentPipeline || []
  const assessmentBoard = data?.assessmentBoard || []

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Students</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalStudents}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Avg Progress</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.avgProgress}%</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Assessments</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalAssessments}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Overdue</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.overdueAssessments}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Board Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveBoard('student')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeBoard === 'student'
              ? 'text-emerald-600 border-emerald-600'
              : 'text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          👥 Student Pipeline
        </button>
        <button
          onClick={() => setActiveBoard('assessment')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeBoard === 'assessment'
              ? 'text-emerald-600 border-emerald-600'
              : 'text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          📝 Assessment Board
        </button>
      </div>

      {/* Kanban Boards */}
      {activeBoard === 'student' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {studentPipeline.map(column => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.name}
              count={column.count}
              cards={column.cards}
              isStudentCard={true}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {assessmentBoard.map(column => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.name}
              count={column.count}
              cards={column.cards}
              isStudentCard={false}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
