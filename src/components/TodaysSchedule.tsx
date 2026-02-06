'use client';

import { useState } from 'react';
import { useDashboardSchedule } from '@/hooks/useDashboard';
import { Calendar, Clock, Users, BookOpen, ChevronRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Lesson {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  module: string;
  groups?: Array<{ id: string; name: string }>;
  group?: { name: string };
  facilitator?: { name: string };
  isPast?: boolean;
}

export default function TodaysSchedule() {
  const { schedule, isLoading } = useDashboardSchedule();
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset time components for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) return 'Today';
    if (compareDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const handleLessonClick = (lesson: any) => {
    router.push('/timetable');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Schedule</h3>
        <button
          onClick={() => router.push('/timetable')}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View Calendar
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : schedule.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No lessons scheduled for the next 7 days</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {schedule.map((lesson: Lesson) => {
            const isPast = lesson.isPast;
            return (
              <div
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  isPast
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 opacity-60'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-md'
                }`}
              >
                {/* Date Badge */}
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isPast
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}>
                    {formatDate(lesson.date)}
                  </span>
                  {isPast && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Completed
                    </span>
                  )}
                </div>

                {/* Lesson Details */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <BookOpen className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      isPast ? 'text-gray-400' : 'text-blue-600 dark:text-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium ${
                        isPast 
                          ? 'text-gray-600 dark:text-gray-400' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {lesson.title}
                      </h4>
                      {lesson.module && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          {lesson.module}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Time and Details */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 ml-8">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                      </span>
                    </div>
                    
                    {lesson.groups && lesson.groups.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {lesson.groups.length === 1
                            ? lesson.groups[0].name
                            : `${lesson.groups.length} groups`}
                        </span>
                      </div>
                    )}

                    {lesson.facilitator && (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{lesson.facilitator.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
