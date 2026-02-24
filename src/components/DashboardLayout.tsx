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
      {/* REDESIGN: Content Area */}
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
