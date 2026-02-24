'use client';

import { useState } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { useDashboardCharts } from '@/hooks/useDashboard';
import AttendanceTrendChart from './AttendanceTrendChart';
import GroupDistributionChart from './GroupDistributionChart';
import CourseProgressChart from './CourseProgressChart';
import EmptyState from './EmptyState';

/**
 * REDESIGN: Dashboard Charts Section
 * Features:
 * - Better visual hierarchy and spacing
 * - Proper chart titles and padding
 * - Loading states that don't look broken
 * - Empty state messages
 * - Export functionality with icons
 */
export default function DashboardCharts() {
  const [timeRange, setTimeRange] = useState('30');
  const { attendanceTrend, groupDistribution, courseProgress, isLoading } = useDashboardCharts(timeRange);

  const handleExport = (chartName: string, data: any[]) => {
    if (!data || data.length === 0) {
      alert('No data available to export');
      return;
    }

    // Convert data to CSV
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => {
      return Object.values(row).map(val => {
        // Handle values that might contain commas
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val;
      }).join(',');
    }).join('\n');
    const csv = `${headers}\n${rows}`;

    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chartName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Analytics
        </h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
            rounded-lg text-slate-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 
            hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Attendance Trend Chart */}
      <div className="dashboard-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Attendance Trend</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Attendance rate over time</p>
          </div>
          <button
            onClick={() => handleExport('Attendance Trend', attendanceTrend)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Export as CSV"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300" />
          </button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-700/20 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-600 border-t-transparent"></div>
          </div>
        ) : attendanceTrend && attendanceTrend.length > 0 ? (
          <div className="h-64">
            <AttendanceTrendChart data={attendanceTrend} />
          </div>
        ) : (
          <EmptyState
            title="No Attendance Data Yet"
            description="Data will appear once attendance sessions are logged"
          />
        )}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Group Distribution */}
        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Group Distribution</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Students across groups</p>
            </div>
            <button
              onClick={() => handleExport('Group Distribution', groupDistribution)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Export as CSV"
            >
              <Download className="w-4 h-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300" />
            </button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-700/20 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-600 border-t-transparent"></div>
            </div>
          ) : groupDistribution && groupDistribution.length > 0 ? (
            <div className="h-64">
              <GroupDistributionChart data={groupDistribution} />
            </div>
          ) : (
            <EmptyState
              title="No Group Data Yet"
              description="Data will appear once groups are created"
            />
          )}
        </div>

        {/* Course Progress */}
        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Course Progress</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Completion status by course</p>
            </div>
            <button
              onClick={() => handleExport('Course Progress', courseProgress)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Export as CSV"
            >
              <Download className="w-4 h-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300" />
            </button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-700/20 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-600 border-t-transparent"></div>
            </div>
          ) : courseProgress && courseProgress.length > 0 ? (
            <div className="h-64">
              <CourseProgressChart data={courseProgress} />
            </div>
          ) : (
            <EmptyState
              title="No Course Data Yet"
              description="Data will appear once courses are started"
            />
          )}
        </div>
      </div>
    </div>
  );
}
