'use client';

import React, { useMemo, useState } from 'react';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { fetcher } from '@/lib/swr-config';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';

interface TimetableSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  venue?: string;
  groupId?: string;
  group?: {
    id: string;
    name: string;
    colour: string;
  } | null;
}

interface WeeklyViewProps {
  groupId?: string;
  initialDate?: Date;
}

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export function WeeklyCalendarView({ groupId, initialDate = new Date() }: WeeklyViewProps) {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState<Date>(
    startOfWeek(initialDate, { weekStartsOn: 1 })
  );
  const weekEnd = addDays(weekStart, 4);
  const weekShowingStart = `${format(weekStart, 'MMM d, yyyy')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  const weekUrl = `/api/timetable?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}${
    groupId ? `&groupId=${groupId}` : ''
  }`;

  const { data: weeklyData, isLoading } = useSWR(weekUrl, fetcher, {
    revalidateOnFocus: false,
  });

  const sessions = useMemo(() => (weeklyData?.data || []) as TimetableSession[], [weeklyData]);

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, TimetableSession[]>();
    sessions.forEach((session) => {
      const key = format(parseISO(session.date), 'yyyy-MM-dd');
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(session);
    });
    return map;
  }, [sessions]);

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
            const dayKey = format(dayDate, 'yyyy-MM-dd');
            const daySessions = sessionsByDay.get(dayKey) || [];
            const isToday = dayKey === format(new Date(), 'yyyy-MM-dd');

            const grouped = daySessions.reduce<Record<string, TimetableSession[]>>(
              (acc, session) => {
                const key = `${session.startTime}-${session.endTime}-${session.venue || ''}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(session);
                return acc;
              },
              {}
            );

            const groupKeys = Object.keys(grouped).sort((a, b) =>
              a.localeCompare(b)
            );

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
                <div className="pt-4 space-y-3 p-3">
                  {groupKeys.length > 0 ? (
                    groupKeys.map((groupKey) => (
                      <div key={groupKey} className="flex gap-2">
                        {grouped[groupKey].map((session) => (
                          <button
                            key={session.id}
                            type="button"
                            onClick={() => session.groupId && router.push(`/groups/${session.groupId}`)}
                            className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm hover:bg-slate-50 transition"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: session.group?.colour || '#94a3b8' }}
                              />
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {session.group?.name || 'Unknown group'}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                              <MapPin className="w-3 h-3" />
                              <span>{session.venue || 'Venue TBC'}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-slate-600">
                              <Clock className="w-3 h-3" />
                              <span>{session.startTime} - {session.endTime}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm text-slate-400 py-4">No sessions</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
