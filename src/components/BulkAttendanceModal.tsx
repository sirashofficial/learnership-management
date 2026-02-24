'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { X, Loader2, Users, CheckSquare, Square, Check, UserX, Clock } from 'lucide-react';
import { invalidateAttendance } from '@/lib/cache-invalidation';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  groupId: string;
  groupName?: string;
}

interface Group {
  id: string;
  name: string;
}

interface BulkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (undoId?: string, count?: number) => void;
  groups?: Group[];
  preSelectedGroupId?: string;
}

const ABSENCE_REASONS = [
  { value: 'SICK', label: 'Sick' },
  { value: 'UNAUTHORIZED', label: 'Unauthorized' },
  { value: 'AUTHORIZED', label: 'Authorized absence' },
  { value: 'LATE', label: 'Late arrival' },
  { value: 'FAMILY', label: 'Family emergency' },
  { value: 'OTHER', label: 'Other' },
];

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export default function BulkAttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  groups: groupsProp,
  preSelectedGroupId,
}: BulkAttendanceModalProps) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(preSelectedGroupId ? [preSelectedGroupId] : []);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sessionType, setSessionType] = useState('CLASSROOM');
  const [groups, setGroups] = useState<Group[]>(groupsProp ?? []);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Map<string, { status: AttendanceStatus; reason?: string }>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setStudents([]);
      setStudentsLoaded(false);
      setAttendanceMap(new Map());
      setSearchQuery('');
    } else if (!groupsProp) {
      // Auto-fetch groups if not provided
      fetch('/api/groups?active=true', { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => setGroups(Array.isArray(d) ? d : d?.data ?? []))
        .catch(() => {});
    }
  }, [isOpen]);

  const loadStudents = async () => {
    if (selectedGroupIds.length === 0) return;
    setLoadingStudents(true);
    try {
      const params = selectedGroupIds.map((id) => `groupId=${id}`).join('&');
      const res = await fetch(`/api/students?${params}&status=ACTIVE`, { credentials: 'include' });
      const data = await res.json();
      const list: Student[] = (Array.isArray(data) ? data : data.data || [])
        .filter((s: any) => selectedGroupIds.includes(s.groupId));

      setStudents(list);
      // Pre-set all students as PRESENT
      const map = new Map<string, { status: AttendanceStatus; reason?: string }>();
      list.forEach((s) => map.set(s.id, { status: 'PRESENT' }));
      setAttendanceMap(map);
      setStudentsLoaded(true);
    } finally {
      setLoadingStudents(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q)
    );
  });

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
    setStudentsLoaded(false);
  };

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    const current = attendanceMap.get(studentId);
    const next = new Map(attendanceMap);
    next.set(studentId, { ...current, status });
    setAttendanceMap(next);
  };

  const setReason = (studentId: string, reason: string) => {
    const current = attendanceMap.get(studentId);
    const next = new Map(attendanceMap);
    next.set(studentId, { ...current!, reason });
    setAttendanceMap(next);
  };

  const markAllPresent = () => {
    const next = new Map(attendanceMap);
    filteredStudents.forEach((s) => next.set(s.id, { status: 'PRESENT' }));
    setAttendanceMap(next);
  };

  const countByStatus = (status: AttendanceStatus) =>
    Array.from(attendanceMap.values()).filter((v) => v.status === status).length;

  const handleSubmit = async () => {
    if (!studentsLoaded || students.length === 0) return;
    setSubmitting(true);
    try {
      const records = students.map((s) => {
        const entry = attendanceMap.get(s.id) ?? { status: 'PRESENT' as AttendanceStatus };
        return {
          studentId: s.id,
          groupId: s.groupId,
          date: new Date(date).toISOString(),
          status: entry.status,
          notes: entry.reason ?? null,
        };
      });

      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ records, sessionType }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to save attendance');
        return;
      }

      const data = await res.json();
      const count = students.length;
      
      // Invalidate attendance caches to sync data across views
      await invalidateAttendance();
      
      onSuccess?.(data?.data?.undoId, count);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Bulk Attendance Marking</h2>
            <p className="text-sm text-gray-500 mt-0.5">Mark attendance for multiple students at once</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Config section */}
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setStudentsLoaded(false); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Session Type</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="CLASSROOM">Classroom</option>
                <option value="WORKPLACE">Workplace</option>
                <option value="ONLINE">Online</option>
                <option value="PRACTICAL">Practical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Groups</label>
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition ${
                    selectedGroupIds.includes(g.id)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={loadStudents}
            disabled={selectedGroupIds.length === 0 || loadingStudents}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingStudents ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
            Load Students
          </button>
        </div>

        {/* Students */}
        {studentsLoaded && (
          <>
            {/* Summary + controls */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-4">
              <span className="text-xs text-gray-500 font-medium">
                <span className="text-green-700 font-bold">{countByStatus('PRESENT')}</span> present,{' '}
                <span className="text-red-700 font-bold">{countByStatus('ABSENT')}</span> absent,{' '}
                <span className="text-orange-700 font-bold">{countByStatus('LATE')}</span> late
              </span>
              <button
                onClick={markAllPresent}
                className="ml-auto flex items-center gap-1.5 text-xs text-green-600 hover:text-green-800 font-semibold"
              >
                <CheckSquare size={14} /> Mark All Present
              </button>
            </div>

            <div className="px-5 py-2">
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="overflow-y-auto flex-1 px-5 pb-3 space-y-1.5">
              {filteredStudents.map((student) => {
                const entry = attendanceMap.get(student.id) ?? { status: 'PRESENT' as AttendanceStatus };
                return (
                  <div key={student.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{student.studentId}</div>
                    </div>

                    {/* Status toggle */}
                    <div className="flex gap-1">
                      {(['PRESENT', 'LATE', 'ABSENT'] as AttendanceStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(student.id, s)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                            entry.status === s
                              ? s === 'PRESENT'
                                ? 'bg-green-600 text-white'
                                : s === 'LATE'
                                ? 'bg-orange-500 text-white'
                                : 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {s === 'PRESENT' ? '✓' : s === 'LATE' ? '~' : '✗'} {s}
                        </button>
                      ))}
                    </div>

                    {/* Reason when absent */}
                    {entry.status === 'ABSENT' && (
                      <select
                        value={entry.reason ?? ''}
                        onChange={(e) => setReason(student.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1 w-36"
                      >
                        <option value="">Reason...</option>
                        {ABSENCE_REASONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!studentsLoaded || students.length === 0 || submitting}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {submitting ? 'Saving...' : `Save Attendance (${students.length} students)`}
          </button>
        </div>
      </div>
    </div>
  );
}
