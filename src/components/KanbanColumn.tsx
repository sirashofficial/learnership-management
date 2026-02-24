'use client'

import React, { ReactNode } from 'react'
import KanbanCard, { KanbanCardProps } from './KanbanCard'

interface KanbanColumnProps {
  id: string
  title: string
  count: number
  cards: any[]
  isStudentCard?: boolean
  onCardClick?: (cardId: string) => void
}

export default function KanbanColumn({
  id,
  title,
  count,
  cards,
  isStudentCard = false,
  onCardClick
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col bg-slate-50 rounded-lg border border-slate-200 h-full min-h-[600px] overflow-hidden">
      {/* Column Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 p-4 z-10">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900">{title}</h3>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
            {count}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div
        className={`flex-1 overflow-y-auto space-y-3 p-4`}
        data-column-id={id}
      >
        {cards && cards.length > 0 ? (
          cards.map((card) => (
            <KanbanCard
              key={card.id}
              {...card}
              onCardClick={onCardClick}
              draggable={true}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-xs text-center">No items</p>
          </div>
        )}
      </div>
    </div>
  )
}
