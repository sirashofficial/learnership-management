'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useDashboardCharts } from '@/hooks/useDashboard';
import AttendanceTrendChart from './AttendanceTrendChart';
import GroupDistributionChart from './GroupDistributionChart';
import CourseProgressChart from './CourseProgressChart';

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
    <div className="space-y-6 mb-8">
      {/* Time Range Filter */}
      <div className="flex justify-end">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:text-white"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Attendance Trend Chart */}
      <div className="card-premium overflow-hidden p-8 noise-texture">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors font-display tracking-tight">Attendance Trend</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Daily interaction velocity across cohorts</p>
          </div>
          <button
            onClick={() => handleExport('Attendance Trend', attendanceTrend)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Export Chart"
          >
            <Download className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <AttendanceTrendChart data={attendanceTrend} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Group Distribution Chart */}
        <div className="card-premium p-8 noise-texture">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 font-display tracking-tight">Group Distribution</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Student density by cohort allocation</p>
            </div>
            <button
              onClick={() => handleExport('Group Distribution', groupDistribution)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Export Chart"
            >
              <Download className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <GroupDistributionChart data={groupDistribution} />
          )}
        </div>

        {/* Course Progress Chart */}
        <div className="card-premium p-8 noise-texture">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 font-display tracking-tight">Curriculum Velocity</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Completion trajectory across active courses</p>
            </div>
            <button
              onClick={() => handleExport('Course Progress', courseProgress)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Export Chart"
            >
              <Download className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <CourseProgressChart data={courseProgress} />
          )}
        </div>
      </div>
    </div>
  );
}
