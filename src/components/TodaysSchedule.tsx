'use client';

import { useLessons } from '@/hooks/useLessons';
import { Calendar, Clock, MapPin, Users, ChevronRight } from 'lucide-react';
import { format, startOfToday, endOfToday, isToday, isTomorrow, addDays } from 'date-fns';
import Link from 'next/link';

export default function TodaysSchedule() {
  const today = startOfToday();
  const threeDaysOut = addDays(today, 3);
  
  const { lessons, isLoading } = useLessons(
    today.toISOString(),
    threeDaysOut.toISOString()
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-background-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text">Upcoming Schedule</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const getDateLabel = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEEE');
  };

  return (
    <div className="bg-white rounded-2xl border border-background-border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text">Upcoming Schedule</h3>
        </div>
        <Link 
          href="/lessons"
          className="text-sm text-primary hover:text-secondary font-medium flex items-center gap-1 transition-colors"
        >
          Full calendar
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {lessons.length === 0 ? (
        <div className="p-8 text-center text-text-light">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No upcoming lessons scheduled</p>
          <Link
            href="/lessons"
            className="text-sm text-primary hover:underline mt-2 inline-block"
          >
            Schedule a lesson
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.slice(0, 3).map((lesson: any, index: number) => {
            const isHighlight = index === 0 && isToday(new Date(lesson.date));
            
            return (
              <div
                key={lesson.id}
                className={`p-4 rounded-xl transition-all ${
                  isHighlight
                    ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20'
                    : 'bg-background border border-background-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                        {getDateLabel(lesson.date)}
                      </span>
                      {isHighlight && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          In Progress
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-text mb-1">{lesson.title}</h4>
                    <p className="text-sm text-text-light mb-2">{lesson.module.name}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-light">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.startTime} - {lesson.endTime}
                      </span>
                      {lesson.site && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {lesson.site.name}
                        </span>
                      )}
                      {lesson.venue && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {lesson.venue}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/lessons/${lesson.id}`}
                    className="text-primary hover:text-secondary p-2 hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
