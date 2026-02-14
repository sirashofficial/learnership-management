'use client';

import React from 'react';
import { CalendarDays, Users, BookOpen, TrendingUp, TrendingDown } from 'lucide-react';

interface ProgressReportProps {
  groups: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    overallProgress: number;
    daysElapsed: number;
    totalDays: number;
    _count: { students: number };
    courses: Array<{
      id: string;
      plannedStartDate: string;
      plannedEndDate: string;
      status: string;
      course: { name: string; totalDuration: number };
      progress: Array<{
        status: string;
        student: { id: string; firstName: string; lastName: string };
      }>;
    }>;
  }>;
}

export default function ProgressReport({ groups }: ProgressReportProps) {
  const calculateVariance = (group: any) => {
    const timeProgress = (group.daysElapsed / group.totalDays) * 100;
    const variance = group.overallProgress - timeProgress;
    return { variance, timeProgress };
  };

  const getStatusColor = (variance: number) => {
    if (variance > 10) return 'text-green-600';
    if (variance > -5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (variance: number) => {
    if (variance > 10) return { color: 'bg-green-100 text-green-800', label: 'Ahead' };
    if (variance > -5) return { color: 'bg-yellow-100 text-yellow-800', label: 'On Track' };
    return { color: 'bg-red-100 text-red-800', label: 'Behind' };
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Groups</p>
              <p className="text-3xl font-bold text-slate-900">{groups.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Students</p>
              <p className="text-3xl font-bold text-slate-900">
                {groups.reduce((sum, group) => sum + group._count.students, 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Progress</p>
              <p className="text-3xl font-bold text-slate-900">
                {Math.round(groups.reduce((sum, group) => sum + group.overallProgress, 0) / groups.length)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Behind Schedule</p>
              <p className="text-3xl font-bold text-slate-900">
                {groups.filter(group => calculateVariance(group).variance < -5).length}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Group Progress Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.map((group) => {
          const { variance, timeProgress } = calculateVariance(group);
          const statusBadge = getStatusBadge(variance);
          
          return (
            <div key={group.id} className="bg-white rounded-lg border border-slate-200 p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{group.name}</h3>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overall Progress</span>
                    <span className="font-medium">{group.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${group.overallProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Time Progress</span>
                    <span className="font-medium">{Math.round(timeProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-slate-500 h-2 rounded-full transition-all" 
                      style={{ width: `${timeProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Variance Indicator */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Progress vs Timeline:</span>
                <div className={`flex items-center gap-1 ${getStatusColor(variance)}`}>
                  {variance >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {variance >= 0 ? '+' : ''}{Math.round(variance)}%
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium">{group._count.students}</span>
                  </div>
                  <p className="text-xs text-slate-500">Students</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium">{group.daysElapsed}</span>
                  </div>
                  <p className="text-xs text-slate-500">Days Elapsed</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium">{group.courses.length}</span>
                  </div>
                  <p className="text-xs text-slate-500">Courses</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Started: {new Date(group.startDate).toLocaleDateString()}</span>
                  <span>Ends: {new Date(group.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {groups.filter(group => calculateVariance(group).variance < -5).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Groups Requiring Attention</h3>
          <div className="space-y-2">
            {groups
              .filter(group => calculateVariance(group).variance < -5)
              .map(group => (
                <div key={group.id} className="text-sm">
                  <strong>{group.name}</strong> is {Math.abs(Math.round(calculateVariance(group).variance))}% behind schedule.
                  Consider additional support or timeline adjustment.
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
