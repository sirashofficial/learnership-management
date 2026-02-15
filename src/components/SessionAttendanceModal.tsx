'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, Loader2, X } from 'lucide-react';
import { useSWRConfig } from 'swr';
import { fetcher } from '@/lib/swr-config';
import useSWR from 'swr';

interface SessionAttendanceModalProps {
  isOpen: boolean;
  session: {
    id: string;
    date: string;
    startTime?: string;
    endTime?: string;
    groupId?: string;
    groupName?: string;
  } | null;
  onClose: () => void;
  onSaved: (summary: { present: number; absent: number; late: number }) => void;
}

export default function SessionAttendanceModal({
  isOpen,
  session,
  onClose,
  onSaved,
}: SessionAttendanceModalProps) {
  const { mutate } = useSWRConfig();
  const [saving, setSaving] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  const groupId = session?.groupId;

  const { data: studentsData } = useSWR(
    isOpen && groupId ? `/api/students?groupId=${groupId}` : null,
    fetcher
  );

  const students = studentsData?.data || [];

  useEffect(() => {
    if (!isOpen || !students.length) return;
    const initial: Record<string, string> = {};
    students.forEach((student: any) => {
      initial[student.id] = '';
    });
    setAttendance(initial);
  }, [isOpen, students]);

  const headerLabel = useMemo(() => {
    if (!session) return 'Mark Attendance';
    const day = format(parseISO(session.date), 'd MMM yyyy');
    return `Mark Attendance — ${session.groupName || 'Group'} — ${day}`;
  }, [session]);

  const handleMarkAll = () => {
    const next: Record<string, string> = {};
    students.forEach((student: any) => {
      next[student.id] = 'PRESENT';
    });
    setAttendance(next);
  };

  const handleSubmit = async () => {
    if (!session || !groupId) return;

    const records = Object.entries(attendance)
      .filter(([_, status]) => status)
      .map(([studentId, status]) => ({
        studentId,
        sessionId: session.id,
        groupId,
        status,
        date: session.date,
      }));

    setSaving(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });

      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }

      const counts = records.reduce(
        (acc, record) => {
          if (record.status === 'PRESENT') acc.present += 1;
          if (record.status === 'ABSENT') acc.absent += 1;
          if (record.status === 'LATE') acc.late += 1;
          return acc;
        },
        { present: 0, absent: 0, late: 0 }
      );

      await mutate((key) => typeof key === 'string' && key.startsWith('/api/attendance'));
      onSaved(counts);
    } catch (error) {
      console.error('Error saving attendance:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{headerLabel}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {students.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No students found for this group.
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student: any) => (
                <div
                  key={student.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{student.studentId}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['PRESENT', 'ABSENT', 'LATE'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setAttendance({ ...attendance, [student.id]: status })}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                          attendance[student.id] === status
                            ? status === 'PRESENT'
                              ? 'bg-emerald-600 text-white'
                              : status === 'ABSENT'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {attendance[student.id] === status && <Check className="mr-1 inline h-3 w-3" />}
                        {status === 'PRESENT' ? 'Present' : status === 'ABSENT' ? 'Absent' : 'Late'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={handleMarkAll}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
          >
            Mark All Present
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || students.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Attendance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
