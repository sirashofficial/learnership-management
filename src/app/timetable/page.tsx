'use client';

import { useState, useMemo, useEffect } from 'react';
import { useGroups } from '@/contexts/GroupsContext';
import TimetableWeekView from '@/components/TimetableWeekView';
import { TimetableCalendarView } from '@/components/TimetableCalendarView';
import { WeeklyCalendarView } from '@/components/WeeklyCalendarView';
import { notificationManager } from '@/lib/notifications';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  startOfWeek,
  endOfWeek,
  format,
  addWeeks,
  subWeeks,
} from 'date-fns';

// Weekly schedule structure - matches screenshot layout
const WEEKLY_SCHEDULE = {
  'Monday': {
    'Lecture Room': ['Montzelity 26\''],
    'Computer Lab': ['Azelis 25\'', 'Packaging World 25\'']
  },
  'Tuesday': {
    'Lecture Room': ['Flint Group 25\''],
    'Computer Lab': ['Wahl 25\'', 'Monteagle 25\'']
  },
  'Wednesday': {
    'Lecture Room': ['Montzelity 26\''],
    'Computer Lab': ['Azelis 25\'', 'Packaging World 25\'']
  },
  'Thursday': {
    'Lecture Room': ['Flint Group 25\''],
    'Computer Lab': ['Wahl 25\'', 'Monteagle 25\'']
  },
  'Friday': {
    'Lecture Room': [],
    'Computer Lab': []
  }
};

export default function TimetablePage() {
  const [currentDate, setCurrentDate] = useState(new Date('2026-02-09'));
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'week'>('calendar');

  const { groups } = useGroups();

  // Get list of group names from groups context
  const groupNames = useMemo(() => {
    return groups.map((g: any) => g.name);
  }, [groups]);

  // Calculate date range for the week
  const dateRange = useMemo(() => {
    return {
      start: startOfWeek(currentDate, { weekStartsOn: 1 }),
      end: endOfWeek(currentDate, { weekStartsOn: 1 }),
    };
  }, [currentDate]);

  // Request notification permission on mount
  useEffect(() => {
    notificationManager.requestPermission();
  }, []);

  // Navigation
  const handlePrevious = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNext = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
              {/* Header with Navigation */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarIcon className="w-8 h-8 text-indigo-600" />
                    Timetable
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Training session schedules with calendar and personal plans
                  </p>
                </div>

                {/* Group Filter */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Filter by Group:
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Groups</option>
                    {groups.map((group: any) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* View Mode Tabs */}
              <div className="mb-6 flex gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg shadow w-fit">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-lg transition-colors font-semibold ${
                    viewMode === 'calendar'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  📅 Calendar View
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 rounded-lg transition-colors font-semibold ${
                    viewMode === 'week'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  📋 Week View
                </button>
              </div>

              {/* Content - Calendar or Week View */}
              <div className="flex-1 min-h-0">
                {viewMode === 'calendar' ? (
                  <TimetableCalendarView />
                ) : (
                  <div className="space-y-6">
                    {/* New Weekly Calendar View - Mon to Fri with actual sessions */}
                    <WeeklyCalendarView 
                      groupId={selectedGroup === 'all' ? (groups[0]?.id || '') : selectedGroup} 
                      initialDate={currentDate} 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
