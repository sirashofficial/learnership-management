'use client'

import React from 'react'
import KanbanBoard from '@/components/KanbanBoard'

/**
 * Kanban View - Student Pipeline & Assessment Board
 * Displays dual Kanban boards for pipeline management and assessment tracking
 */
export default function KanbanView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Kanban Boards</h2>
        <p className="text-sm text-slate-600">Manage student pipelines and track assessment progress</p>
      </div>
      <KanbanBoard />
    </div>
  )
}
