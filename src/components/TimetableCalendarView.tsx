'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Bell } from 'lucide-react';
import useSWR from 'swr';
import { EventDetailModal } from './EventDetailModal';
import { PlanForm } from './PlanForm';
import { SessionForm } from './SessionForm';
import { ReminderWidget } from './ReminderWidget';

interface Lesson {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  venue?: string;
  groupId?: string;
}

interface Plan {
  id: string;
  userId: string;
  title: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  color: string;
  type: 'note' | 'event';
  isPrivate: boolean;
}

interface CalendarEvent {
  id: string;
  type: 'lesson' | 'plan';
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  color: string;
  data: Lesson | Plan;
}

export function TimetableCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [selectedDayForPlan, setSelectedDayForPlan] = useState<Date | null>(null);
  const [selectedDayForSession, setSelectedDayForSession] = useState<Date | null>(null);
  const [editingSession, setEditingSession] = useState<any>(null);

  // Fetch lessons for the month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: lessonsData, mutate: mutateLessons } = useSWR(
    `/api/timetable?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`,
    (url) => fetch(url).then((res) => res.json())
  );

  // Fetch plans for the month
  const { data: plansData, mutate: mutatePlans } = useSWR(
    `/api/plans?startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`,
    (url) => fetch(url).then((res) => res.json())
  );

  // Combine lessons and plans into calendar events
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    if (lessonsData?.data) {
      lessonsData.data.forEach((lesson: Lesson) => {
        events.push({
          id: lesson.id,
          type: 'lesson',
          title: lesson.title,
          date: parseISO(lesson.date),
          startTime: lesson.startTime,
          endTime: lesson.endTime,
          color: '#3b82f6', // Blue for lessons
          data: lesson,
        });
      });
    }

    if (plansData?.data) {
      plansData.data.forEach((plan: Plan) => {
        events.push({
          id: plan.id,
          type: 'plan',
          title: plan.title,
          date: parseISO(plan.startDate),
          startTime: plan.startTime,
          endTime: plan.endTime,
          color: plan.color,
          data: plan,
        });
      });
    }

    return events;
  }, [lessonsData, plansData]);

  // Generate calendar days
  const monthStartDate = startOfMonth(currentDate);
  const monthEndDate = endOfMonth(currentDate);
  const calendarStartDate = startOfWeek(monthStartDate);
  const calendarEndDate = endOfWeek(monthEndDate);

  const daysInCalendar = [];
  let currentDay = calendarStartDate;

  while (currentDay <= calendarEndDate) {
    daysInCalendar.push(new Date(currentDay));
    currentDay = addDays(currentDay, 1);
  }

  const weeks = [];
  for (let i = 0; i < daysInCalendar.length; i += 7) {
    weeks.push(daysInCalendar.slice(i, i + 7));
  }

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter((event) => isSameDay(event.date, day));
  };

  const handleDayClick = (day: Date, event?: CalendarEvent) => {
    if (event) {
      setSelectedEvent(event);
      setShowEventModal(true);
    }
  };

  const handleCreatePlan = (day: Date) => {
    setSelectedDayForPlan(day);
    setShowPlanForm(true);
  };

  const handleCreateSession = (day: Date) => {
    setSelectedDayForSession(day);
    setEditingSession(null);
    setShowSessionForm(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    if (event.type === 'lesson') {
      setEditingSession(event.data);
      setShowSessionForm(true);
    } else if (event.type === 'plan') {
      // For plans, use the existing PlanForm
      setSelectedDayForPlan(event.date);
      setShowPlanForm(true);
    }
  };

  return (
    <div className="flex h-full gap-4">
      {/* Main Calendar */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleCreateSession(new Date())}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              New Session
            </button>
            <button
              onClick={() => handleCreatePlan(new Date())}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              New Plan
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0 border-b border-gray-200 dark:border-gray-700">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-3 text-center font-semibold text-sm bg-gray-50 dark:bg-gray-800"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="flex-1 grid grid-cols-7 gap-0">
            {weeks.map((week, weekIndex) => (
              <React.Fragment key={weekIndex}>
                {week.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={`min-h-24 p-2 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 transition ${isToday
                          ? 'bg-blue-100 dark:bg-blue-900'
                          : !isCurrentMonth
                            ? 'bg-gray-50 dark:bg-gray-800'
                            : 'bg-white dark:bg-gray-900'
                        }`}
                    >
                      {/* Day number */}
                      <div
                        className={`text-sm font-semibold mb-1 ${isCurrentMonth
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-400'
                          }`}
                      >
                        {format(day, 'd')}
                      </div>

                      {/* Events */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDayClick(day, event);
                            }}
                            className="text-xs p-1 rounded truncate text-white font-semibold cursor-pointer hover:opacity-80 transition"
                            style={{ backgroundColor: event.color }}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>

                      {/* Quick add button */}
                      {isCurrentMonth && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreatePlan(day);
                          }}
                          className="mt-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar: Reminders Widget */}
      <div className="w-64 flex flex-col gap-4">
        <ReminderWidget />
      </div>

      {/* Modals */}
      {showEventModal && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setShowEventModal(false)}
          onEdit={handleEditEvent}
          onEventUpdated={() => {
            mutateLessons();
            mutatePlans();
          }}
        />
      )}

      {showSessionForm && (
        <SessionForm
          selectedDate={selectedDayForSession || undefined}
          editingSession={editingSession}
          onClose={() => {
            setShowSessionForm(false);
            setSelectedDayForSession(null);
            setEditingSession(null);
          }}
          onSessionSaved={() => {
            mutateLessons();
            setShowSessionForm(false);
            setSelectedDayForSession(null);
            setEditingSession(null);
          }}
        />
      )}

      {showPlanForm && selectedDayForPlan && (
        <PlanForm
          selectedDate={selectedDayForPlan}
          onClose={() => {
            setShowPlanForm(false);
            setSelectedDayForPlan(null);
          }}
          onPlanCreated={() => {
            mutatePlans();
            setShowPlanForm(false);
          }}
        />
      )}
    </div>
  );
}
