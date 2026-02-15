'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { addDays, format, parseISO } from 'date-fns';
import useSWR from 'swr';
import { Clock, MapPin, Users } from 'lucide-react';
import { fetcher } from '@/lib/swr-config';
import { useGroups } from '@/contexts/GroupsContext';

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

interface NextSessionPanelProps {
  variant?: 'list' | 'single';
  limit?: number;
  className?: string;
  title?: string;
  showFooterLink?: boolean;
}

function parseTimeToDate(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map((part) => Number(part));
  const next = new Date(date.getTime());
  next.setHours(hours || 0, minutes || 0, 0, 0);
  return next;
}

function isSessionActive(session: TimetableSession, now: Date) {
  const sessionDate = parseISO(session.date);
  const start = parseTimeToDate(sessionDate, session.startTime);
  const end = parseTimeToDate(sessionDate, session.endTime);
  return now.getTime() >= start.getTime() && now.getTime() <= end.getTime() && format(now, 'yyyy-MM-dd') === format(sessionDate, 'yyyy-MM-dd');
}

export default function NextSessionPanel({
  variant = 'list',
  limit = variant === 'single' ? 1 : 3,
  className = '',
  title,
  showFooterLink = false,
}: NextSessionPanelProps) {
  const { groups } = useGroups();
  const now = new Date();
  const rangeEnd = addDays(now, 45);

  const { data, isLoading } = useSWR(
    `/api/timetable?start=${now.toISOString()}&end=${rangeEnd.toISOString()}`,
    fetcher
  );

  const sessions = useMemo(() => {
    const items: TimetableSession[] = data?.data || [];
    const upcoming = items
      .map((session) => {
        const sessionDate = parseISO(session.date);
        const startDate = parseTimeToDate(sessionDate, session.startTime);
        const endDate = parseTimeToDate(sessionDate, session.endTime);
        return { session, startDate, endDate };
      })
      .filter(({ endDate }) => endDate.getTime() >= now.getTime())
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(0, limit)
      .map(({ session }) => session);

    return upcoming;
  }, [data, now, limit]);

  const panelTitle = title || (variant === 'single' ? 'Next Session' : 'Next Sessions');

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{panelTitle}</h3>
        {variant === 'list' && (
          <span className="text-xs text-slate-500">Upcoming</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(limit)].map((_, index) => (
            <div key={index} className="h-24 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No upcoming sessions found.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const group = groups.find((item) => item.id === session.groupId);
            const studentsCount = group?._count?.students || group?.students?.length || 0;
            const highlight = isSessionActive(session, now);
            const barColor = session.group?.colour || '#10b981';

            return (
              <div
                key={session.id}
                className={`relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition ${
                  highlight ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'
                }`}
              >
                <span
                  className="absolute left-0 top-0 h-full w-1.5"
                  style={{ backgroundColor: barColor }}
                />
                <div className="pl-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {session.group?.name || 'Unnamed group'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(parseISO(session.date), 'EEEE, d MMM yyyy')}
                      </p>
                    </div>
                    {highlight && (
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Happening now
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {session.startTime} – {session.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{session.venue || 'Venue TBC'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      <span>{studentsCount} students</span>
                    </div>
                  </div>

                  {session.groupId && (
                    <Link
                      href={`/groups/${session.groupId}`}
                      className="mt-3 inline-flex text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Go to Group →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showFooterLink && (
        <Link
          href="/timetable"
          className="inline-flex text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          View full timetable →
        </Link>
      )}
    </div>
  );
}
