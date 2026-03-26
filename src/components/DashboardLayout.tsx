'use client';

import React, { useState } from 'react';
import { LayoutDashboard, Grid3X3, Clock, Users, BarChart3, ChevronDown } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'kanban' | 'timeline' | 'collaboration' | 'analytics';
  onViewChange: (view: 'dashboard' | 'kanban' | 'timeline' | 'collaboration' | 'analytics') => void;
  alertSidebar?: React.ReactNode;
}

/**
 * REDESIGN: Dashboard Layout with refined visual hierarchy
 * Features:
 * - Modern header styling with subtle separators
 * - Tab navigation with better hover states
 * - Refined spacing and typography
 * - Responsive layout with alert sidebar
 * - Dark mode support
 */
export default function DashboardLayout({
  children,
  currentView,
  onViewChange,
  alertSidebar
}: DashboardLayoutProps) {
  const views = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kanban', label: 'Kanban', icon: Grid3X3 },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'collaboration', label: 'Collaboration', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* View tab bar */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6">
        <div className="flex gap-1 max-w-[1600px] mx-auto">
          {views.map((v) => {
            const Icon = v.icon;
            const isActive = currentView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => onViewChange(v.id)}
                className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors duration-150 ${
                  isActive
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex gap-6 p-6 max-w-[1600px] mx-auto">
        {/* Primary Content */}
        <div className="flex-1">
          {children}
        </div>

        {/* Alert Sidebar */}
        {alertSidebar && (
          <div className="w-full lg:w-96 space-y-6">
            {alertSidebar}
          </div>
        )}
      </div>
    </div>
  );
}
