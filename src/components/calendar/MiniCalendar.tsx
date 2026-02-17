'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr-config';

interface TimetableSession {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  groupId?: string;
  group?: {
    id: string;
    name: string;
    colour: string;
  } | null;
}

interface MiniCalendarProps {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  displayMonth?: Date;
  onMonthChange?: (month: Date) => void;
  onDayHover?: (day: Date, rect: DOMRect) => void;
  onDayLeave?: () => void;
  onDayClick?: (day: Date) => void;
  sessions?: TimetableSession[];
  isSessionsLoading?: boolean;
  variant?: 'grid' | 'strip';
  className?: string;
}

function buildWeeks(currentMonth: Date) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let cursor = calendarStart;
  while (cursor <= calendarEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return weeks;
}

export default function MiniCalendar({
  selectedDate,
  onSelectDate,
  displayMonth,
  onMonthChange,
  onDayHover,
  onDayLeave,
  onDayClick,
  sessions,
  isSessionsLoading,
  variant = 'grid',
  className = '',
}: MiniCalendarProps) {
  const [localMonth, setLocalMonth] = useState<Date>(
    startOfMonth(selectedDate ?? new Date())
  );

  const currentMonth = displayMonth ?? localMonth;

  useEffect(() => {
    if (!selectedDate) return;
    const activeMonth = displayMonth ?? localMonth;
    if (!isSameMonth(selectedDate, activeMonth)) {
      const nextMonth = startOfMonth(selectedDate);
      if (onMonthChange) {
        onMonthChange(nextMonth);
      } else {
        setLocalMonth(nextMonth);
      }
    }
  }, [selectedDate, displayMonth, localMonth, onMonthChange]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const { data: sessionData, isLoading } = useSWR(
    `/api/timetable?start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}`,
    fetcher
  );

  const activeSessions = useMemo(
    () => sessions ?? sessionData?.data ?? [],
    [sessions, sessionData]
  );
  const activeLoading = typeof sessions !== 'undefined' ? Boolean(isSessionsLoading) : isLoading;

  const sessionDays = useMemo(() => {
    const set = new Set<string>();
    const data: TimetableSession[] = activeSessions;
    data.forEach((session) => {
      set.add(format(new Date(session.date), 'yyyy-MM-dd'));
    });
    return set;
  }, [activeSessions]);

  const today = new Date();
  const weeks = useMemo(() => buildWeeks(currentMonth), [currentMonth]);
  const daysInMonth = useMemo(() => {
    const days: Date[] = [];
    let cursor = startOfMonth(currentMonth);
    while (cursor <= endOfMonth(currentMonth)) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const next = subMonths(currentMonth, 1);
    if (onMonthChange) {
      onMonthChange(next);
    } else {
      setLocalMonth(next);
    }
  };

  const handleNextMonth = () => {
    const next = addMonths(currentMonth, 1);
    if (onMonthChange) {
      onMonthChange(next);
    } else {
      setLocalMonth(next);
    }
  };

  const renderDayIndicator = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    if (activeLoading) return <span className="mt-1 h-1 w-1 rounded-full bg-slate-200" />;
    if (sessionDays.has(key)) {
      return <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />;
    }
    return <span className="mt-1 h-1.5 w-1.5 rounded-full bg-transparent" />;
  };

  const handleDayClick = (day: Date) => {
    if (onDayClick) {
      onDayClick(day);
      return;
    }
    onSelectDate?.(day);
  };

  const getDayButtonClasses = (day: Date, isStrip = false) => {
    const isToday = isSameDay(day, today);
    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
    const base = isStrip
      ? 'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-150 cursor-pointer'
      : 'flex flex-col items-center justify-center rounded-lg py-2 text-xs font-semibold transition-colors duration-150 cursor-pointer';

    if (isSelected || isToday) {
      return `${base} bg-emerald-600 text-white`;
    }

    return `${base} text-slate-700 hover:bg-emerald-50`;
  };

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {variant === 'strip' ? (
        <div className="mt-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {daysInMonth.map((day) => (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleDayClick(day)}
                onMouseEnter={(event) => onDayHover?.(day, event.currentTarget.getBoundingClientRect())}
                onMouseLeave={() => onDayLeave?.()}
                className={getDayButtonClasses(day, true)}
              >
                <span
                  className={`text-[10px] uppercase tracking-wide ${
                    isSameDay(day, selectedDate ?? today) ? 'text-emerald-50' : 'text-slate-400'
                  }`}
                >
                  {format(day, 'EEE')}
                </span>
                <span className="text-sm">{format(day, 'd')}</span>
                {renderDayIndicator(day)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <div className="grid grid-cols-7 gap-1 text-[11px] font-semibold text-slate-400">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
              <div key={label} className="text-center">
                {label}
              </div>
            ))}
          </div>
          <div className="mt-2 space-y-1">
            {weeks.map((week, index) => (
              <div key={`week-${index}`} className="grid grid-cols-7 gap-1">
                {week.map((day) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={(event) => onDayHover?.(day, event.currentTarget.getBoundingClientRect())}
                      onMouseLeave={() => onDayLeave?.()}
                      className={`${getDayButtonClasses(day)} ${
                        isCurrentMonth ? '' : 'text-slate-300'
                      }`}
                    >
                      <span className="text-xs">{format(day, 'd')}</span>
                      {renderDayIndicator(day)}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
