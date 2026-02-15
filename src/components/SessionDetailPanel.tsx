'use client';

import { format, parseISO } from 'date-fns';
import useSWR from 'swr';
import Link from 'next/link';
import { Calendar, MapPin, Trash2, Users, X } from 'lucide-react';
import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { fetcher } from '@/lib/swr-config';
import { Group } from '@/contexts/GroupsContext';
import Toast, { useToast } from '@/components/Toast';

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

interface SessionDetailPanelProps {
  session: TimetableSession | null;
  group?: Group;
  onClose?: () => void;
  onMarkAttendance?: (session: TimetableSession) => void;
  emptyState?: React.ReactNode;
}

function getStatusBadge(progressPercent: number) {
  if (progressPercent >= 75) {
    return { label: 'On Track', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (progressPercent >= 50) {
    return { label: 'Behind', classes: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  return { label: 'At Risk', classes: 'bg-rose-50 text-rose-700 border-rose-200' };
}

export default function SessionDetailPanel({
  session,
  group,
  onClose,
  onMarkAttendance,
  emptyState,
}: SessionDetailPanelProps) {
  const { mutate } = useSWRConfig();
  const { toast, showToast, hideToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: attendanceData } = useSWR(
    session?.groupId ? `/api/attendance/stats?groupId=${session.groupId}` : null,
    fetcher
  );

  if (!session) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {emptyState || (
          <div className="text-sm text-slate-500">Select a session to view details.</div>
        )}
      </div>
    );
  }

  const attendanceRate = attendanceData?.data?.attendanceRate ?? 0;
  const studentsCount = group?._count?.students || group?.students?.length || 0;
  const creditsEarned = group?.actualProgress?.avgCreditsPerStudent ?? 0;
  const creditsTotal = group?.actualProgress?.totalCreditsRequired ?? 140;
  const progressPercent = group?.actualProgress?.avgProgressPercent ?? 0;
  const status = getStatusBadge(progressPercent);
  const alerts: string[] = [];

  if (attendanceRate > 0 && attendanceRate < 75) alerts.push('Low attendance');
  if (progressPercent > 0 && progressPercent < 50) alerts.push('Credits lagging');
  if (group?.status && group.status !== 'ACTIVE') alerts.push('Group inactive');

  const handleDeleteSession = async () => {
    if (!session) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/timetable/${session.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      await mutate((key) => typeof key === 'string' && key.startsWith('/api/timetable'));
      setShowDeleteConfirm(false);
      onClose?.();
      showToast('Session deleted', 'error');
    } catch (error) {
      console.error('Error deleting session:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-slate-900">
            {session.group?.name || 'Unnamed group'}
          </p>
          <span
            className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${status.classes}`}
          >
            {status.label}
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Close details"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-700">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-600" />
          <span>
            {format(parseISO(session.date), 'EEEE, d MMM yyyy')} · {session.startTime} – {session.endTime}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-600" />
          <span>{session.venue || 'Venue TBC'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-600" />
          <span>{studentsCount} students enrolled</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">Attendance</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {attendanceRate.toFixed(0)}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">Credits Earned</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {creditsEarned}/{creditsTotal}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {alerts.map((alert) => (
          <span
            key={alert}
            className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
          >
            {alert}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {onMarkAttendance && (
          <button
            type="button"
            onClick={() => onMarkAttendance(session)}
            className="btn-primary text-center"
          >
            Mark Attendance
          </button>
        )}
        {session.groupId && (
          <Link href={`/groups/${session.groupId}`} className="btn-secondary text-center">
            Go to Group
          </Link>
        )}
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete this session
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-sm font-semibold text-slate-900">Delete this session?</p>
            <p className="mt-2 text-xs text-slate-500">This cannot be undone.</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSession}
                disabled={isDeleting}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
