'use client';

import Link from 'next/link';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import useSWR from 'swr';
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

interface TimetableGroupViewProps {
  selectedDate: Date;
  selectedGroupId: string;
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimetableGroupView({
  selectedDate,
  selectedGroupId,
}: TimetableGroupViewProps) {
  const { groups } = useGroups();
  const activeGroup = groups.find((group) => group.id === selectedGroupId);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 4);

  const { data, isLoading } = useSWR(
    selectedGroupId && selectedGroupId !== 'all'
      ? `/api/timetable?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}&groupId=${selectedGroupId}`
      : null,
    fetcher
  );

  const sessions: TimetableSession[] = data?.data || [];

  const sessionsByDay = WEEK_DAYS.reduce<Record<string, TimetableSession | null>>((acc, day, index) => {
    const dateKey = format(addDays(weekStart, index), 'yyyy-MM-dd');
    acc[day] = sessions.find((session) => format(parseISO(session.date), 'yyyy-MM-dd') === dateKey) || null;
    return acc;
  }, {});

  if (selectedGroupId === 'all') {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        Select a group to view its weekly rotation.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Group View</h2>
        <p className="text-sm text-slate-500">Weekly Rotation</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
          <div className="px-4 py-3">Time</div>
          {WEEK_DAYS.map((day) => (
            <div key={day} className="px-4 py-3">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-6">
          <div className="border-r border-slate-200 px-4 py-6 text-sm font-semibold text-slate-600">
            09:00 – 14:00
          </div>
          {WEEK_DAYS.map((day) => {
            const session = sessionsByDay[day];
            return (
              <div key={day} className="border-r border-slate-200 px-4 py-4 last:border-r-0">
                {isLoading ? (
                  <div className="h-16 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
                ) : session ? (
                  <div
                    className="rounded-xl p-3 text-sm font-semibold text-white shadow-sm"
                    style={{ backgroundColor: session.group?.colour || '#10b981' }}
                  >
                    <div>{session.venue || 'Venue TBC'}</div>
                    <div className="mt-1 text-xs text-white/80">Session scheduled</div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-6 text-center text-sm text-slate-400">
                    —
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">This week&apos;s sessions</h3>
          {activeGroup && (
            <span className="text-xs text-slate-500">{activeGroup.name}</span>
          )}
        </div>

        {isLoading ? (
          <div className="mt-4 space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-12 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No sessions scheduled this week.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">
                    {format(parseISO(session.date), 'EEEE d MMM')}
                  </span>{' '}
                  — {session.venue || 'Venue TBC'} — {session.startTime}–{session.endTime}
                </div>
                <Link
                  href={session.groupId ? `/attendance?groupId=${session.groupId}` : '/attendance'}
                  className="btn-secondary"
                >
                  Mark Attendance
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
