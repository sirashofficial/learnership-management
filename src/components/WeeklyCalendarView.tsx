'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr-config';
import { ChevronLeft, ChevronRight, Clock, Users, AlertCircle } from 'lucide-react';

interface WeeklySession {
  id: string;
  time: string;
  topic: string;
  facilitator?: string;
  status: string;
}

interface WeeklyViewProps {
  groupId: string;
  initialDate?: Date;
}

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export function WeeklyCalendarView({ groupId, initialDate = new Date() }: WeeklyViewProps) {
  const [weekStart, setWeekStart] = useState<Date>(
    startOfWeek(initialDate, { weekStartsOn: 1 }) // Start on Monday
  );

  const weekShowingStart = `${format(weekStart, 'MMM d, yyyy')} - ${format(addDays(weekStart, 4), 'MMM d, yyyy')}`;

  // Fetch weekly schedule
  const { data: weeklyData, isLoading } = useSWR(
    `/api/sessions/generate?weekStart=${weekStart.toISOString()}&groupId=${groupId}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const schedule = weeklyData?.data?.schedule || {};

  const handlePrevWeek = () => {
    setWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setWeekStart((prev) => addDays(prev, 7));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Weekly Schedule</h2>
          <p className="text-sm text-slate-600 mt-1">{weekShowingStart}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading schedule...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {DAYS_OF_WEEK.map((day, index) => {
            const dayDate = addDays(weekStart, index);
            const dayClasses = schedule[day] || [];
            const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

            return (
              <div
                key={day}
                className={`border rounded-lg overflow-hidden ${isToday ? 'bg-blue-50 border-blue-200' : 'border-slate-200'}`}
              >
                <div className={`p-3 ${isToday ? 'bg-blue-100' : 'bg-slate-50'}`}>
                  <div>
                    <p className={`text-xs font-semibold ${isToday ? 'text-blue-700' : 'text-slate-600'} uppercase`}>
                      {day}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-blue-900' : 'text-slate-900'}`}>
                      {format(dayDate, 'd')}
                    </p>
                    {isToday && (
                      <p className="text-xs text-blue-600 font-medium mt-1">Today</p>
                    )}
                  </div>
                </div>
                <div className="pt-4 space-y-2 p-3">
                  {dayClasses.length > 0 ? (
                    dayClasses.map((session: WeeklySession) => (
                      <div
                        key={session.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-slate-900 truncate">
                              {session.topic}
                            </p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-slate-600">
                              <Clock className="w-3 h-3" />
                              <span>{session.time}</span>
                            </div>
                            {session.facilitator && (
                              <p className="text-xs text-slate-500 mt-1">
                                👨‍🏫 {session.facilitator}
                              </p>
                            )}
                          </div>
                          <div
                            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                              session.status === 'SCHEDULED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {session.status}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-slate-400 py-4">No classes</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && Object.values(schedule).every((day: any) => day.length === 0) && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-6 flex items-center gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">No classes scheduled for this week. Generate sessions to populate the timetable.</p>
        </div>
      )}
    </div>
  );
}
