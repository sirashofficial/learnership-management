'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { useGroups } from '@/contexts/GroupsContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ScheduleLessonModal from '@/components/ScheduleLessonModal';
import RecurringSessionModal from '@/components/RecurringSessionModal';
import { notificationManager, checkAndScheduleUpcomingNotifications } from '@/lib/notifications';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Search,
  Bell,
  Share2,
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import {
  startOfWeek,
  endOfWeek,
  format,
  addWeeks,
  subWeeks,
  parseISO,
  isSameDay,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameMonth,
} from 'date-fns';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  venue: string | null;
  module: {
    id: string;
    code: string;
    name: string;
  };
  facilitator: {
    id: string;
    name: string;
    email: string;
  } | null;
  group: {
    id: string;
    name: string;
    company: {
      id: string;
      name: string;
    };
  };
}

interface RecurringSessionOverride {
  id: string;
  date: string;
  groupName: string;
  venue: string;
  isCancelled: boolean;
  cancellationReason: string | null;
  notes: string | null;
  notificationEnabled: boolean;
  notificationSent: boolean;
  notificationTime: number;
}

interface ParentGroup {
  id: string;
  name: string;
  subGroups: {
    id: string;
    name: string;
    room: 'Lecture Room' | 'Computer Lab';
  }[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Modern pastel color palette matching the design
const LESSON_COLORS = [
  { bg: 'bg-purple-200', border: 'border-purple-300', text: 'text-purple-900', hover: 'hover:bg-purple-300' },
  { bg: 'bg-green-200', border: 'border-green-300', text: 'text-green-900', hover: 'hover:bg-green-300' },
  { bg: 'bg-blue-200', border: 'border-blue-300', text: 'text-blue-900', hover: 'hover:bg-blue-300' },
  { bg: 'bg-pink-200', border: 'border-pink-300', text: 'text-pink-900', hover: 'hover:bg-pink-300' },
  { bg: 'bg-cyan-200', border: 'border-cyan-300', text: 'text-cyan-900', hover: 'hover:bg-cyan-300' },
  { bg: 'bg-amber-200', border: 'border-amber-300', text: 'text-amber-900', hover: 'hover:bg-amber-300' },
];

// Time slot: 09:00 - 14:00 (5 hours)
const TIME_SLOT = { start: '09:00', end: '14:00' };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Group definitions with parent-child relationships
const GROUP_DEFINITIONS = {
  'Montzelity 26\'': {
    isParent: true,
    subGroups: ['Azelis 25\'', 'Beyond Insights 26\'', 'City Logistics 26\'', 'Monteagle 25\''],
    color: { bg: 'bg-purple-200', border: 'border-purple-400', text: 'text-purple-900' }
  },
  'Azelis 25\'': {
    color: { bg: 'bg-teal-200', border: 'border-teal-400', text: 'text-teal-900' }
  },
  'Beyond Insights 26\'': {
    color: { bg: 'bg-blue-200', border: 'border-blue-400', text: 'text-blue-900' }
  },
  'City Logistics 26\'': {
    color: { bg: 'bg-cyan-200', border: 'border-cyan-400', text: 'text-cyan-900' }
  },
  'Monteagle 25\'': {
    color: { bg: 'bg-pink-200', border: 'border-pink-400', text: 'text-pink-900' }
  },
  'Kelpack 25\'': {
    color: { bg: 'bg-green-200', border: 'border-green-400', text: 'text-green-900' }
  },
  'Flint Group 25\'': {
    color: { bg: 'bg-indigo-200', border: 'border-indigo-400', text: 'text-indigo-900' }
  },
  'Wahl 25\'': {
    color: { bg: 'bg-amber-200', border: 'border-amber-400', text: 'text-amber-900' }
  },
  'Packaging World 25\'': {
    color: { bg: 'bg-emerald-200', border: 'border-emerald-400', text: 'text-emerald-900' }
  }
};

// Weekly schedule structure
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
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [showToDoSidebar, setShowToDoSidebar] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [addLessonPreset, setAddLessonPreset] = useState<{ date: string; time: string } | null>(null);

  // Recurring session management
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedRecurringSession, setSelectedRecurringSession] = useState<{
    date: Date;
    groupName: string;
    venue: string;
    parentGroup?: string;
  } | null>(null);

  const { groups } = useGroups();

  // Calculate date range for the week
  const dateRange = useMemo(() => {
    return {
      start: startOfWeek(currentDate, { weekStartsOn: 1 }),
      end: endOfWeek(currentDate, { weekStartsOn: 1 }),
    };
  }, [currentDate]);

  // Build API URL
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      startDate: format(dateRange.start, 'yyyy-MM-dd'),
      endDate: format(dateRange.end, 'yyyy-MM-dd'),
    });
    return `/api/timetable?${params.toString()}`;
  }, [dateRange]);

  const { data, error, isLoading } = useSWR<{ lessons: Lesson[] }>(
    apiUrl,
    fetcher
  );

  const lessons = data?.lessons || [];

  // Fetch group schedules
  const { data: groupSchedulesData } = useSWR<{ data: any[] }>(
    '/api/group-schedules?groupId=all', // Note: API needs to support fetching all or we fetch per visible group
    fetcher
  );

  const groupSchedules = groupSchedulesData?.data || [];

  // Helper to get the active schedule template for a group on a specific date
  const getActiveTemplateForGroup = (groupName: string, date: Date) => {
    // Find the group ID from the name (this mapping needs to be cleaner in a real app)
    // For now, we'll assume we can match by name or fetch groups to get IDs
    // Since we don't have IDs easily here, we might need to rely on the API returning populated data
    // OR we update the component to work with IDs primarily.

    // Fallback to hardcoded for now until full migration
    return WEEKLY_SCHEDULE;
  };

  // Fetch recurring session overrides
  const overridesApiUrl = useMemo(() => {
    const params = new URLSearchParams({
      startDate: format(dateRange.start, 'yyyy-MM-dd'),
      endDate: format(dateRange.end, 'yyyy-MM-dd'),
    });
    return `/api/recurring-sessions?${params.toString()}`;
  }, [dateRange]);

  const { data: overridesData } = useSWR<RecurringSessionOverride[]>(
    overridesApiUrl,
    fetcher
  );

  const overrides = overridesData || [];

  // Get override for a specific session
  const getOverride = (date: Date, groupName: string, venue: string): RecurringSessionOverride | null => {
    return overrides.find(o =>
      o.groupName === groupName &&
      o.venue === venue &&
      isSameDay(parseISO(o.date), date)
    ) || null;
  };

  // Request notification permission on mount
  useEffect(() => {
    notificationManager.requestPermission();
  }, []);

  // Schedule notifications for upcoming sessions
  useEffect(() => {
    if (overrides.length === 0) return;

    const upcomingSessions = overrides
      .filter(o => !o.isCancelled && o.notificationEnabled && !o.notificationSent)
      .map(o => ({
        date: parseISO(o.date),
        groupName: o.groupName,
        startTime: TIME_SLOT.start,
        venue: o.venue,
        notificationEnabled: o.notificationEnabled,
        notificationTime: o.notificationTime,
      }));

    checkAndScheduleUpcomingNotifications(upcomingSessions);
  }, [overrides]);

  // Navigation
  const handlePrevious = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNext = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Get all days for month view (including padding days)
  const getMonthDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Start from Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  // Lesson actions
  const handleAddLesson = (dayIndex: number, timeSlot: string) => {
    const targetDate = addDays(dateRange.start, dayIndex);
    setAddLessonPreset({
      date: format(targetDate, 'yyyy-MM-dd'),
      time: timeSlot,
    });
    setShowAddModal(true);
  };

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowDetailModal(true);
  };

  // Recurring session actions
  const handleRecurringSessionClick = (date: Date, groupName: string, venue: string) => {
    const parentGroup = Object.entries(GROUP_DEFINITIONS).find(([_, def]) =>
      'subGroups' in def && def.subGroups?.includes(groupName)
    );

    setSelectedRecurringSession({
      date,
      groupName,
      venue,
      parentGroup: parentGroup ? parentGroup[0] : undefined,
    });
    setShowRecurringModal(true);
  };

  const handleSaveRecurringSession = async (data: {
    isCancelled: boolean;
    cancellationReason?: string;
    notes?: string;
    notificationEnabled: boolean;
    notificationTime: number;
  }) => {
    if (!selectedRecurringSession) return;

    try {
      const response = await fetch('/api/recurring-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: format(selectedRecurringSession.date, 'yyyy-MM-dd'),
          groupName: selectedRecurringSession.groupName,
          venue: selectedRecurringSession.venue,
          ...data,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error saving recurring session:', error);
      throw error;
    }
  };

  const handleDeleteRecurringSessionOverride = async () => {
    if (!selectedRecurringSession) return;

    try {
      const params = new URLSearchParams({
        date: format(selectedRecurringSession.date, 'yyyy-MM-dd'),
        groupName: selectedRecurringSession.groupName,
        venue: selectedRecurringSession.venue,
      });

      const response = await fetch(`/api/recurring-sessions?${params.toString()}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error deleting override:', error);
      throw error;
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const response = await fetch(`/api/timetable/${lessonId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Lesson deleted successfully');
        // Refresh the data
        window.location.reload();
      } else {
        alert('Failed to delete lesson');
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Error deleting lesson');
    }
  };

  const handleModalSuccess = () => {
    setShowAddModal(false);
    setShowDetailModal(false);
    setSelectedLesson(null);
    setAddLessonPreset(null);
    // Refresh the data
    window.location.reload();
  };

  // Get color for lesson based on group
  const getColorForGroup = (groupName: string) => {
    // Safety check for undefined/null groupName
    if (!groupName) {
      return LESSON_COLORS[0]; // Default color
    }

    const groupDef = GROUP_DEFINITIONS[groupName as keyof typeof GROUP_DEFINITIONS];
    if (groupDef?.color) {
      return groupDef.color;
    }
    // Fallback to hash-based color
    const hash = groupName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return LESSON_COLORS[hash % LESSON_COLORS.length];
  };

  // Get lessons for a specific day and venue (Lecture Room or Computer Lab)
  const getLessonsForDayVenue = (dayIndex: number, venue: 'Lecture Room' | 'Computer Lab') => {
    const targetDate = addDays(dateRange.start, dayIndex);
    return lessons.filter((lesson) => {
      const lessonDate = parseISO(lesson.date);
      return isSameDay(lessonDate, targetDate) && lesson.venue === venue;
    });
  };

  // Check if a group is a parent group
  const isParentGroup = (groupName: string) => {
    const def = GROUP_DEFINITIONS[groupName as keyof typeof GROUP_DEFINITIONS];
    return def && 'isParent' in def ? def.isParent : false;
  };

  // Get sub-groups of a parent group
  const getSubGroups = (groupName: string) => {
    const def = GROUP_DEFINITIONS[groupName as keyof typeof GROUP_DEFINITIONS];
    return def && 'subGroups' in def ? def.subGroups : [];
  };

  // Process database schedules into a usable format
  const dbScheduleMap = useMemo(() => {
    if (!groupSchedules || groupSchedules.length === 0) return null;

    const map: Record<string, Record<string, string[]>> = {}; // Day -> Venue -> Groups[]

    groupSchedules.forEach((schedule: any) => {
      if (!schedule.template?.schedule) return;

      try {
        const scheduleDef = JSON.parse(schedule.template.schedule);
        const groupName = schedule.group?.name;

        if (!groupName) return;

        // Iterate through days in the template
        Object.entries(scheduleDef).forEach(([day, timeSlots]: [string, any]) => {
          if (!map[day]) map[day] = {};

          // Check each time slot
          Object.values(timeSlots).forEach((slot: any) => {
            // Determine venue based on activity/room (simplified logic)
            // In a real app, this would be more explicit in the data
            const venue = slot.room || (slot.activity === 'Lecture' ? 'Lecture Room' : 'Computer Lab');

            if (!map[day][venue]) map[day][venue] = [];
            if (!map[day][venue].includes(groupName)) {
              map[day][venue].push(groupName);
            }
          });
        });
      } catch (e) {
        console.error('Failed to parse schedule for group', schedule.groupId, e);
      }
    });

    return map;
  }, [groupSchedules]);

  // Get scheduled groups for a specific day and venue
  // Prioritizes Database Schedule, falls back to Static Schedule
  const getScheduledGroups = (dayIndex: number, venue: 'Lecture Room' | 'Computer Lab') => {
    const dayName = DAYS[dayIndex];

    // 1. Try DB Schedule
    if (dbScheduleMap && dbScheduleMap[dayName]?.[venue]) {
      return dbScheduleMap[dayName][venue];
    }

    // 2. Fallback to Static Schedule
    return WEEKLY_SCHEDULE[dayName as keyof typeof WEEKLY_SCHEDULE]?.[venue] || [];
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden flex">
          {/* Main Calendar Area */}
          <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${showToDoSidebar ? 'mr-0' : 'mr-0'}`}>
            {/* Top Navigation Bar - Sticky */}
            <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                {/* Left: Navigation */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-600 pl-4">
                      <button
                        onClick={handleToday}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        Today
                      </button>
                      <button
                        onClick={handlePrevious}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {viewMode === 'week'
                          ? `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`
                          : format(currentDate, 'MMMM yyyy')
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Search className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Share2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">Export</span>
                  </button>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('week')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'week'
                        ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                        }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setViewMode('month')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'month'
                        ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                        }`}
                    >
                      Month
                    </button>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Lesson</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-full mx-auto">
                {/* Calendar Grid */}
                {isLoading ? (
                  <div className="flex items-center justify-center h-96 bg-white dark:bg-slate-800 rounded-xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : viewMode === 'week' ? (
                  // Week View
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Calendar Header */}
                    <div className="grid grid-cols-6 border-b border-slate-200 dark:border-slate-700">
                      <div className="p-4 border-r border-slate-200 dark:border-slate-700">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Time / Room
                        </div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">
                          {TIME_SLOT.start} - {TIME_SLOT.end}
                        </div>
                      </div>
                      {DAYS.map((day, index) => {
                        const date = addDays(dateRange.start, index);
                        const isCurrentDay = isToday(date);
                        return (
                          <div
                            key={day}
                            className="p-4 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className={`text-xs font-semibold uppercase tracking-wider ${isCurrentDay ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                                  }`}>
                                  {day.substring(0, 3)}
                                </div>
                                <div className={`text-lg font-bold mt-1 ${isCurrentDay ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'
                                  }`}>
                                  {format(date, 'd')}
                                </div>
                              </div>
                              {isCurrentDay && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Calendar Body - Two Rooms */}
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                      {/* Lecture Room Row */}
                      <div className="grid grid-cols-6">
                        <div className="p-4 border-r border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/10">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                              Lecture Room
                            </span>
                          </div>
                        </div>
                        {DAYS.map((day, dayIndex) => {
                          const scheduledGroups = getScheduledGroups(dayIndex, 'Lecture Room');
                          const actualLessons = getLessonsForDayVenue(dayIndex, 'Lecture Room');

                          return (
                            <div
                              key={`lecture-${day}`}
                              className="p-3 border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-h-[150px] hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors group"
                            >
                              {scheduledGroups.length > 0 ? (
                                <div className="space-y-2">
                                  {scheduledGroups.map((groupName) => {
                                    const colors = getColorForGroup(groupName);
                                    const parentGroup = isParentGroup(groupName);
                                    const subGroups = parentGroup ? getSubGroups(groupName) : [];

                                    // Find actual lesson data if exists
                                    const lessonData = actualLessons.find(l => l.group.name === groupName);

                                    return (
                                      <div
                                        key={groupName}
                                        onClick={() => lessonData && handleLessonClick(lessonData)}
                                        className={`${colors.bg} ${colors.border} border-l-4 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md group/lesson`}
                                      >
                                        <div className={`${colors.text} space-y-1`}>
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                              <div className="font-bold text-sm leading-tight">
                                                {groupName}
                                              </div>
                                              {parentGroup && subGroups.length > 0 && (
                                                <div className="text-xs mt-1 opacity-75">
                                                  <div className="flex flex-wrap gap-1 mt-1">
                                                    {subGroups.map(sg => (
                                                      <span key={sg} className="px-2 py-0.5 bg-white/50 rounded text-[10px]">
                                                        {sg}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                            {lessonData && (
                                              <div className="opacity-0 group-hover/lesson:opacity-100 transition-opacity flex gap-1">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLessonClick(lessonData);
                                                  }}
                                                  className="p-1 bg-white/50 hover:bg-white/80 rounded"
                                                  title="View Details"
                                                >
                                                  <Edit2 className="w-3 h-3" />
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1 text-xs opacity-75">
                                            <Clock className="w-3 h-3" />
                                            <span>{TIME_SLOT.start} - {TIME_SLOT.end}</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAddLesson(dayIndex, TIME_SLOT.start)}
                                  className="w-full h-full min-h-[120px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                  title={`Add lesson for ${day} - Lecture Room`}
                                >
                                  <div className="text-center">
                                    <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                                    <span className="text-xs text-slate-600 dark:text-slate-400">Add</span>
                                  </div>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Computer Lab Row */}
                      <div className="grid grid-cols-6">
                        <div className="p-4 border-r border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-900/10">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                              Computer Lab
                            </span>
                          </div>
                        </div>
                        {DAYS.map((day, dayIndex) => {
                          const scheduledGroups = getScheduledGroups(dayIndex, 'Computer Lab');
                          const actualLessons = getLessonsForDayVenue(dayIndex, 'Computer Lab');

                          return (
                            <div
                              key={`lab-${day}`}
                              className="p-3 border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-h-[150px] hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors group"
                            >
                              {scheduledGroups.length > 0 ? (
                                <div className="space-y-2">
                                  {scheduledGroups.map((groupName) => {
                                    const colors = getColorForGroup(groupName);
                                    const lessonData = actualLessons.find(l => l.group.name === groupName);

                                    return (
                                      <div
                                        key={groupName}
                                        onClick={() => lessonData && handleLessonClick(lessonData)}
                                        className={`${colors.bg} ${colors.border} border-l-4 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md group/lesson`}
                                      >
                                        <div className={`${colors.text} space-y-1`}>
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                              <div className="font-bold text-sm leading-tight">
                                                {groupName}
                                              </div>
                                            </div>
                                            {lessonData && (
                                              <div className="opacity-0 group-hover/lesson:opacity-100 transition-opacity flex gap-1">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLessonClick(lessonData);
                                                  }}
                                                  className="p-1 bg-white/50 hover:bg-white/80 rounded"
                                                  title="View Details"
                                                >
                                                  <Edit2 className="w-3 h-3" />
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1 text-xs opacity-75">
                                            <Clock className="w-3 h-3" />
                                            <span>{TIME_SLOT.start} - {TIME_SLOT.end}</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAddLesson(dayIndex, TIME_SLOT.start)}
                                  className="w-full h-full min-h-[120px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"
                                  title={`Add lesson for ${day} - Computer Lab`}
                                >
                                  <div className="text-center">
                                    <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                                    <span className="text-xs text-slate-600 dark:text-slate-400">Add</span>
                                  </div>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Month View
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6">
                      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                        {/* Day headers */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="bg-slate-50 dark:bg-slate-800 p-3 text-center">
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                              {day}
                            </div>
                          </div>
                        ))}

                        {/* Calendar days */}
                        {getMonthDays().map(day => {
                          const dayOfWeek = day.getDay();
                          const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0=Monday

                          // Get scheduled groups for this day (Monday-Thursday)
                          const scheduledGroupsLR = dayIndex < 4 ? getScheduledGroups(dayIndex, 'Lecture Room') : [];
                          const scheduledGroupsCL = dayIndex < 4 ? getScheduledGroups(dayIndex, 'Computer Lab') : [];

                          // Get actual lessons from database
                          const dayLessons = lessons.filter(lesson =>
                            isSameDay(parseISO(lesson.date), day)
                          );

                          // Create items grouped by venue for better display
                          const itemsByVenue: Array<{ venue: string, items: Array<{ type: 'scheduled' | 'lesson', data: any, groupName: string }> }> = [];

                          // Process Lecture Room groups
                          if (scheduledGroupsLR.length > 0) {
                            const lrItems = scheduledGroupsLR.map(scheduledGroup => {
                              const matchingLesson = dayLessons.find(l => l.group.name === scheduledGroup);
                              return matchingLesson
                                ? { type: 'lesson' as const, data: matchingLesson, groupName: matchingLesson.group.name }
                                : { type: 'scheduled' as const, data: null, groupName: scheduledGroup };
                            });
                            itemsByVenue.push({ venue: 'LR', items: lrItems });
                          }

                          // Process Computer Lab groups
                          if (scheduledGroupsCL.length > 0) {
                            const clItems = scheduledGroupsCL.map(scheduledGroup => {
                              const matchingLesson = dayLessons.find(l => l.group.name === scheduledGroup);
                              return matchingLesson
                                ? { type: 'lesson' as const, data: matchingLesson, groupName: matchingLesson.group.name }
                                : { type: 'scheduled' as const, data: null, groupName: scheduledGroup };
                            });
                            itemsByVenue.push({ venue: 'CL', items: clItems });
                          }

                          // Add any extra lessons that aren't part of the scheduled groups
                          const allScheduledGroupNames = [...scheduledGroupsLR, ...scheduledGroupsCL];
                          const extraLessons = dayLessons.filter(lesson => !allScheduledGroupNames.includes(lesson.group.name));
                          if (extraLessons.length > 0) {
                            itemsByVenue.push({
                              venue: 'Extra',
                              items: extraLessons.map(l => ({ type: 'lesson' as const, data: l, groupName: l.group.name }))
                            });
                          }

                          const isCurrentDay = isToday(day);
                          const isCurrentMonth = isSameMonth(day, currentDate);

                          return (
                            <div
                              key={day.toString()}
                              className={`bg-white dark:bg-slate-800 p-2 min-h-[120px] ${isCurrentDay ? 'ring-2 ring-inset ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                                } ${!isCurrentMonth ? 'bg-slate-50 dark:bg-slate-900 opacity-50' : ''
                                }`}
                            >
                              <div className={`text-sm font-semibold mb-2 ${isCurrentDay
                                ? 'text-blue-600 dark:text-blue-400'
                                : !isCurrentMonth
                                  ? 'text-slate-400 dark:text-slate-600'
                                  : 'text-slate-900 dark:text-white'
                                }`}>
                                {format(day, 'd')}
                              </div>
                              {isCurrentMonth && itemsByVenue.length > 0 && (
                                <div className="space-y-1.5">
                                  {itemsByVenue.map((venueGroup, venueIdx) => (
                                    <div key={venueIdx} className="space-y-0.5">
                                      {/* Venue header */}
                                      <div className="flex items-center gap-1 px-1">
                                        <div className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                                          {venueGroup.venue}
                                        </div>
                                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                                      </div>

                                      {/* Groups for this venue */}
                                      <div className="space-y-0.5">
                                        {venueGroup.items.map((item, itemIdx) => {
                                          const colors = getColorForGroup(item.groupName);
                                          const parentGroup = Object.entries(GROUP_DEFINITIONS).find(([_, def]) =>
                                            'subGroups' in def && def.subGroups?.includes(item.groupName)
                                          );
                                          const venue = venueGroup.venue === 'LR' ? 'Lecture Room' : 'Computer Lab';

                                          if (item.type === 'scheduled') {
                                            // Scheduled group - check if cancelled
                                            const override = getOverride(day, item.groupName, venue);
                                            const isCancelled = override?.isCancelled ?? false;

                                            return (
                                              <div
                                                key={`sched-${venueIdx}-${itemIdx}`}
                                                onClick={() => handleRecurringSessionClick(day, item.groupName, venue)}
                                                className={`${colors.bg} ${colors.border} border-l-2 text-xs p-1 rounded cursor-pointer hover:shadow-md transition-all ${isCancelled ? 'opacity-50' : ''}`}
                                                title={isCancelled ? 'Cancelled - Click to view details' : 'Click to manage this recurring session'}
                                              >
                                                <div className={`${colors.text} flex items-center justify-between gap-1`}>
                                                  <span className="flex-1 truncate font-medium text-[10px] ${isCancelled ? 'line-through' : ''}">
                                                    {item.groupName}
                                                  </span>
                                                  {isCancelled && (
                                                    <span className="text-[8px] px-1 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                                                      Cancelled
                                                    </span>
                                                  )}
                                                  {!isCancelled && parentGroup && (
                                                    <span className="text-[8px] px-1 py-0.5 bg-white/50 dark:bg-black/20 rounded">
                                                      {parentGroup[0]}
                                                    </span>
                                                  )}
                                                </div>
                                                {override?.notes && !isCancelled && (
                                                  <div className={`${colors.text} text-[9px] opacity-60 truncate mt-0.5`}>
                                                    {override.notes}
                                                  </div>
                                                )}
                                                {override?.notificationEnabled && !isCancelled && (
                                                  <Bell className="w-2.5 h-2.5 absolute top-0.5 right-0.5 text-blue-500" />
                                                )}
                                              </div>
                                            );
                                          } else {
                                            // Actual lesson
                                            return (
                                              <div
                                                key={item.data.id}
                                                onClick={() => handleLessonClick(item.data)}
                                                className={`${colors.bg} ${colors.border} border-l-2 text-xs p-1 rounded cursor-pointer hover:shadow-md transition-all relative group`}
                                              >
                                                <div className={`${colors.text} flex items-center justify-between gap-1`}>
                                                  <span className="flex-1 truncate font-semibold text-[10px]">
                                                    {item.groupName}
                                                  </span>
                                                  {parentGroup && (
                                                    <span className="text-[8px] px-1 py-0.5 bg-white/50 dark:bg-black/20 rounded">
                                                      {parentGroup[0]}
                                                    </span>
                                                  )}
                                                </div>
                                                {item.data.title && (
                                                  <div className={`${colors.text} text-[9px] opacity-60 truncate mt-0.5`}>
                                                    {item.data.title}
                                                  </div>
                                                )}
                                                <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <Edit2 className="w-2.5 h-2.5" />
                                                </div>
                                              </div>
                                            );
                                          }
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Group Legend & Information */}
          {showToDoSidebar && (
            <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Groups</h3>
                  <button
                    onClick={() => setShowToDoSidebar(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Group Structure Info */}
                <div className="space-y-4 mb-6">
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <h4 className="font-semibold text-purple-900 dark:text-purple-300">
                        Combined Group
                      </h4>
                    </div>
                    <div className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                      <strong>Montzelity 26'</strong>
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                      <div>Contains 4 sub-groups:</div>
                      <ul className="list-disc list-inside pl-2 space-y-0.5">
                        <li>Azelis 25'</li>
                        <li>Beyond Insights 26'</li>
                        <li>City Logistics 26'</li>
                        <li>Monteagle 25'</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* All Groups */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    All Groups
                  </h4>
                  {Object.entries(GROUP_DEFINITIONS).map(([groupName, def]) => {
                    const colors = def.color;
                    const isParent = 'isParent' in def ? def.isParent : false;
                    const subGroups = 'subGroups' in def ? def.subGroups : [];

                    return (
                      <div
                        key={groupName}
                        className={`${colors.bg} ${colors.border} border-l-4 rounded-lg p-3`}
                      >
                        <div className={`${colors.text}`}>
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {groupName}
                            {isParent && (
                              <span className="px-2 py-0.5 bg-white/50 rounded text-[10px] font-normal">
                                PARENT
                              </span>
                            )}
                          </div>
                          {isParent && subGroups.length > 0 && (
                            <div className="text-xs mt-2 space-y-1">
                              {subGroups.map(sg => (
                                <div key={sg} className="pl-2 opacity-75">• {sg}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Weekly Schedule Summary */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                    Weekly Schedule
                  </h4>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                    <div className="bg-slate-50 dark:bg-slate-750 p-2 rounded">
                      <div className="font-medium text-slate-700 dark:text-slate-300">Monday & Wednesday</div>
                      <div className="mt-1">LR: Montzelity 26'</div>
                      <div>CL: Azelis 25', Packaging World 25'</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-750 p-2 rounded">
                      <div className="font-medium text-slate-700 dark:text-slate-300">Tuesday & Thursday</div>
                      <div className="mt-1">LR: Flint Group 25'</div>
                      <div>CL: Wahl 25', Monteagle 25'</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-750 p-2 rounded">
                      <div className="font-medium text-slate-700 dark:text-slate-300">Friday</div>
                      <div className="mt-1 text-slate-500">TBD</div>
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-500">
                    LR = Lecture Room, CL = Computer Lab
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Floating button to show sidebar when hidden */}
          {!showToDoSidebar && (
            <button
              onClick={() => setShowToDoSidebar(true)}
              className="fixed right-6 bottom-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center z-50 hover:scale-110"
              title="Show Groups"
            >
              <Users className="w-6 h-6" />
            </button>
          )}
        </main>

        {/* Add Lesson Modal */}
        <ScheduleLessonModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setAddLessonPreset(null);
          }}
          onSuccess={handleModalSuccess}
        />

        {/* Lesson Detail Modal */}
        {showDetailModal && selectedLesson && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Lesson Details
                </h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedLesson(null);
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Title Section */}
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {selectedLesson.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      {selectedLesson.module.code}
                    </span>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                      {selectedLesson.module.name}
                    </span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Date</div>
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                      <CalendarIcon className="w-4 h-4" />
                      {format(parseISO(selectedLesson.date), 'EEEE, MMMM d, yyyy')}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Time</div>
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                      <Clock className="w-4 h-4" />
                      {selectedLesson.startTime.substring(0, 5)} - {selectedLesson.endTime.substring(0, 5)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Group</div>
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                      <Users className="w-4 h-4" />
                      {selectedLesson.group.name}
                      <span className="text-xs text-slate-500">({selectedLesson.group.company.name})</span>
                    </div>
                  </div>

                  {selectedLesson.venue && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Venue</div>
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <MapPin className="w-4 h-4" />
                        {selectedLesson.venue}
                      </div>
                    </div>
                  )}

                  {selectedLesson.facilitator && (
                    <div className="space-y-1 col-span-2">
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Facilitator</div>
                      <div className="text-slate-900 dark:text-white">
                        {selectedLesson.facilitator.name}
                        <span className="text-sm text-slate-500 ml-2">({selectedLesson.facilitator.email})</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedLesson.description && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Description</div>
                    <div className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-750 p-4 rounded-lg">
                      {selectedLesson.description}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      // TODO: Implement edit functionality
                      alert('Edit functionality coming soon!');
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Lesson
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleDeleteLesson(selectedLesson.id);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recurring Session Modal */}
        {selectedRecurringSession && (
          <RecurringSessionModal
            isOpen={showRecurringModal}
            onClose={() => {
              setShowRecurringModal(false);
              setSelectedRecurringSession(null);
            }}
            session={{
              date: selectedRecurringSession.date,
              groupName: selectedRecurringSession.groupName,
              venue: selectedRecurringSession.venue,
              timeSlot: TIME_SLOT,
              parentGroup: selectedRecurringSession.parentGroup,
            }}
            override={getOverride(
              selectedRecurringSession.date,
              selectedRecurringSession.groupName,
              selectedRecurringSession.venue
            )}
            onSave={handleSaveRecurringSession}
            onDelete={handleDeleteRecurringSessionOverride}
          />
        )}
      </div>
    </div>
  );
}

