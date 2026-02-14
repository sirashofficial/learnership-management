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
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex justify-end">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Attendance Trend Chart */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Attendance Trend</h3>
          <button
            onClick={() => handleExport('Attendance Trend', attendanceTrend)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            title="Export"
          >
            <Download className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <AttendanceTrendChart data={attendanceTrend} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Group Distribution */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Group Distribution</h3>
            <button
              onClick={() => handleExport('Group Distribution', groupDistribution)}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              title="Export"
            >
              <Download className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <GroupDistributionChart data={groupDistribution} />
          )}
        </div>

        {/* Course Progress */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Course Progress</h3>
            <button
              onClick={() => handleExport('Course Progress', courseProgress)}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              title="Export"
            >
              <Download className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <CourseProgressChart data={courseProgress} />
          )}
        </div>
      </div>
    </div>
  );
}
