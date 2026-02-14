'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import useSWR from 'swr';
import { AlertCircle, CheckCircle2, Clock, Users, TrendingUp, AlertTriangle } from 'lucide-react';

interface TodayClass {
  id: string;
  groupName: string;
  time: string;
  topic: string;
  facilitator: string;
  studentsCount: number;
  currentModule: string;
  moduleProgress: number;
  averageProgress: number;
  expectedProgress: number;
  onTrack: boolean;
  status: string;
  warning?: string;
}

interface DashboardSummary {
  total: number;
  onTrack: number;
  atRisk: number;
}

export function TodayClassesDashboard() {
  const { data: dashboardData, isLoading } = useSWR(
    '/api/dashboard/today-classes',
    (url) => fetch(url).then((res) => res.json()),
    { revalidateOnFocus: false, revalidateOnReconnect: true }
  );

  const summary: DashboardSummary = dashboardData?.data?.summary || {
    total: 0,
    onTrack: 0,
    atRisk: 0,
  };

  const classes: TodayClass[] = dashboardData?.data?.classes || [];
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Today's Classes</h1>
        <p className="text-slate-600 mt-1">{today}</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading today's schedule...</div>
      ) : classes.length === 0 ? (
        <div className="border border-slate-200 rounded-lg">
          <div className="pt-12 pb-12 text-center">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">No classes scheduled for today</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg">
              <div className="pt-6 pb-6 px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Total Classes</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{summary.total}</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-500 opacity-20" />
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg">
              <div className="pt-6 pb-6 px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">On Track</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">{summary.onTrack}</p>
                  </div>
                  <CheckCircle2 className="w-10 h-10 text-green-500 opacity-30" />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg">
              <div className="pt-6 pb-6 px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700 font-medium">At Risk</p>
                    <p className="text-3xl font-bold text-amber-900 mt-2">{summary.atRisk}</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-amber-500 opacity-30" />
                </div>
              </div>
            </div>
          </div>

          {/* Classes List */}
          <div className="space-y-4">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className={`border-2 rounded-lg transition-colors ${
                  classItem.onTrack
                    ? 'border-green-200 bg-white hover:bg-green-50'
                    : 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <div className="pt-6 px-6 pb-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {classItem.groupName}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">{classItem.topic}</p>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap flex items-center gap-2 ${
                          classItem.onTrack
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {classItem.onTrack ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            ON TRACK
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            AT RISK
                          </>
                        )}
                      </div>
                    </div>

                    {/* Class Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-600 font-semibold uppercase">Time</p>
                        <p className="text-sm font-medium text-slate-900 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {classItem.time}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-600 font-semibold uppercase">Students</p>
                        <p className="text-sm font-medium text-slate-900 flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {classItem.studentsCount}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-600 font-semibold uppercase">Facilitator</p>
                        <p className="text-sm font-medium text-slate-900">{classItem.facilitator}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-600 font-semibold uppercase">Current</p>
                        <p className="text-sm font-medium text-slate-900">{classItem.currentModule}</p>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      {/* Module Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-700">Module Progress</p>
                          <p className="text-xs font-semibold text-slate-900">{classItem.moduleProgress}%</p>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${classItem.moduleProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Student Progress vs Expected */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-700">Student Progress</p>
                          <p className="text-xs font-semibold text-slate-900">
                            {classItem.averageProgress}% / {classItem.expectedProgress}% expected
                          </p>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden relative">
                          {/* Expected progress (light background) */}
                          <div
                            className="h-full bg-slate-300 absolute"
                            style={{ width: `${classItem.expectedProgress}%` }}
                          />
                          {/* Actual progress */}
                          <div
                            className={`h-full transition-all relative z-10 ${
                              classItem.averageProgress >= classItem.expectedProgress * 0.8
                                ? 'bg-green-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${classItem.averageProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Warning Message */}
                    {classItem.warning && (
                      <div className="p-3 bg-amber-100 border border-amber-300 rounded-lg flex items-start gap-2 text-amber-800 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>{classItem.warning}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
