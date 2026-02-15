'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import useSWR from 'swr';
import { MapPin, Users } from 'lucide-react';
import { fetcher } from '@/lib/swr-config';
import { Group } from '@/contexts/GroupsContext';

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

interface SessionHoverCardProps {
  session: TimetableSession;
  group?: Group;
  position: { top: number; left: number };
  visible: boolean;
}

function getStatusBadge(progressPercent: number) {
  if (progressPercent >= 75) {
    return { label: 'On Track', classes: 'bg-emerald-50 text-emerald-700' };
  }
  if (progressPercent >= 50) {
    return { label: 'Behind', classes: 'bg-amber-50 text-amber-700' };
  }
  return { label: 'At Risk', classes: 'bg-rose-50 text-rose-700' };
}

export default function SessionHoverCard({
  session,
  group,
  position,
  visible,
}: SessionHoverCardProps) {
  const { data: attendanceData } = useSWR(
    visible && session.groupId ? `/api/attendance/stats?groupId=${session.groupId}` : null,
    fetcher
  );

  if (!visible) return null;

  const attendanceRate = attendanceData?.data?.attendanceRate ?? 0;
  const studentsCount = group?._count?.students || group?.students?.length || 0;
  const creditsEarned = group?.actualProgress?.avgCreditsPerStudent ?? 0;
  const creditsTotal = group?.actualProgress?.totalCreditsRequired ?? 140;
  const progressPercent = group?.actualProgress?.avgProgressPercent ?? 0;
  const status = getStatusBadge(progressPercent);

  const viewportWidth = typeof window === 'undefined' ? 1024 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 768 : window.innerHeight;
  const left = Math.min(position.left, viewportWidth - 260);
  const top = Math.min(position.top, viewportHeight - 220);

  return (
    <div
      className="fixed z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
      style={{ left, top }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {session.group?.name || 'Unnamed group'}
          </p>
          <p className="text-xs text-slate-500">
            {format(parseISO(session.date), 'EEE, d MMM')} · {session.startTime} – {session.endTime}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.classes}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-3 space-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" />
          <span>{session.venue || 'Venue TBC'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5" />
          <span>{studentsCount} students</span>
        </div>
        <div className="text-xs text-slate-500">Attendance: {attendanceRate.toFixed(0)}%</div>
        <div className="text-xs text-slate-500">
          Credits: {creditsEarned}/{creditsTotal}
        </div>
      </div>

      {session.groupId && (
        <Link
          href={`/groups/${session.groupId}`}
          className="mt-3 inline-flex text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          → Go to Group
        </Link>
      )}
    </div>
  );
}
