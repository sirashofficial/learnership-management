'use client';

import React, { useState, useEffect } from 'react';
import { GripHorizontal, X, Settings } from 'lucide-react';

interface Widget {
  id: string;
  title: string;
  type: 'metric' | 'table' | 'chart' | 'list';
  size: 'small' | 'medium' | 'large'; // 1x1, 2x2, 2x3
  position?: { x: number; y: number };
  component: React.ComponentType<any>;
  config?: Record<string, any>;
}

interface WidgetGridProps {
  widgets: Widget[];
  onRemoveWidget?: (widgetId: string) => void;
  onUpdateWidget?: (widgetId: string, config: Record<string, any>) => void;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

/**
 * WidgetGrid Container
 * Responsive 12-column grid for dashboard widgets
 * Handles drag-drop (manual for now, can upgrade to react-beautiful-dnd later)
 */
export default function WidgetGrid({
  widgets,
  onRemoveWidget,
  onUpdateWidget,
  isDragging = false,
  onDragStart,
  onDragEnd
}: WidgetGridProps) {
  const [localWidgets, setLocalWidgets] = useState<Widget[]>(widgets);

  const getSizeClasses = (size: Widget['size']) => {
    switch (size) {
      case 'small':
        return 'col-span-4'; // 4 out of 12 ≈ 33%
      case 'medium':
        return 'col-span-6'; // 6 out of 12 = 50%
      case 'large':
        return 'col-span-12'; // Full width
      default:
        return 'col-span-6';
    }
  };

  return (
    <div className="w-full">
      {/* Grid Container */}
      <div className="grid grid-cols-12 gap-6 auto-rows-max">
        {localWidgets.map(widget => {
          const Component = widget.component;
          const sizeClass = getSizeClasses(widget.size);

          return (
            <div key={widget.id} className={`${sizeClass}`}>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Widget Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <GripHorizontal className="w-4 h-4 text-slate-400 cursor-grab active:cursor-grabbing" />
                    <h3 className="font-semibold text-slate-900 text-sm">
                      {widget.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {onUpdateWidget && (
                      <button
                        className="p-1.5 hover:bg-slate-200 rounded-md text-slate-600 transition-colors"
                        title="Widget settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}

                    {onRemoveWidget && (
                      <button
                        onClick={() => onRemoveWidget(widget.id)}
                        className="p-1.5 hover:bg-red-100 rounded-md text-slate-600 hover:text-red-600 transition-colors"
                        title="Remove widget"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Widget Content */}
                <div className="p-6">
                  {typeof Component === 'function' ? (
                    <Component config={widget.config} />
                  ) : (
                    <div className="text-slate-500 text-sm">Widget not configured</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {localWidgets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-slate-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">No widgets yet</h3>
          <p className="text-slate-600 text-sm max-w-sm">
            Get started by adding your first dashboard widget. Click "Customize" above.
          </p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-8 flex gap-3 justify-between items-center border-t border-slate-200 pt-4">
        <div className="text-sm text-slate-600">
          {localWidgets.length} widget{localWidgets.length !== 1 ? 's' : ''} displayed
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            + Add Widget
          </button>
          <button className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            Reset Layout
          </button>
        </div>
      </div>
    </div>
  );
}
