'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Check, Calendar } from 'lucide-react';
import { formatGroupNameDisplay } from '@/lib/groupName';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr-config';
import { invalidateAttendance } from '@/lib/cache-invalidation';

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MarkAttendanceModal({ isOpen, onClose, onSuccess }: MarkAttendanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to today's date in YYYY-MM-DD format
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [attendance, setAttendance] = useState<Record<string, string>>({});

  // Use SWR for groups to prevent duplicate requests and enable caching
  const { data: groupsData, error: groupsError, isLoading: groupsLoading } = useSWR(
    isOpen ? '/api/groups' : null,
    fetcher
  );

  const groups = groupsData?.data || [];

  useEffect(() => {
    if (selectedGroup) {
      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedGroup('');
      // Reset to today's date when modal closes
      const today = new Date();
      setSelectedDate(today.toISOString().split('T')[0]);
      setStudents([]);
      setAttendance({});
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/students?groupId=${selectedGroup}`);
      const data = await response.json();
      setStudents(data.data || []);
      
      // Initialize all students as not marked
      const initialAttendance: Record<string, string> = {};
      (data.data || []).forEach((student: any) => {
        initialAttendance[student.id] = '';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleMarkAll = (status: string) => {
    const newAttendance: Record<string, string> = {};
    students.forEach((student) => {
      newAttendance[student.id] = status;
    });
    setAttendance(newAttendance);
  };

  const handleSubmit = async () => {
    if (!selectedGroup) {
      alert('Please select a group');
      return;
    }

    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    const unmarkedCount = Object.values(attendance).filter(status => !status).length;
    if (unmarkedCount > 0) {
      if (!confirm(`${unmarkedCount} student(s) are not marked. Continue anyway?`)) {
        return;
      }
    }

    setSaving(true);
    try {
      const attendanceRecords = Object.entries(attendance)
        .filter(([_, status]) => status)
        .map(([studentId, status]) => ({
          studentId,
          groupId: selectedGroup,
          status,
          date: new Date(selectedDate).toISOString(),
        }));

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: attendanceRecords }),
      });

      if (response.ok) {
        // Invalidate all attendance-related caches to sync data across views
        await invalidateAttendance();
        alert('Attendance saved successfully!');
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save attendance');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mark Attendance</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Group *
                </label>
                {groupsLoading ? (
                  <div className="flex items-center justify-center py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Loading groups...</span>
                  </div>
                ) : groupsError ? (
                  <div className="p-3 border border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <p className="text-sm text-red-700 dark:text-red-400">⚠️ {groupsError}</p>
                  </div>
                ) : (
                  <select
                    value={selectedGroup}
                    onChange={(e) => {
                      setSelectedGroup(e.target.value);
                      setAttendance({}); // Clear attendance when group changes
                    }}
                    disabled={groups.length === 0}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{groups.length === 0 ? 'No groups available' : 'Choose a group'}</option>
                    {groups.map((group: any) => (
                      <option key={group.id} value={group.id}>
                        {formatGroupNameDisplay(group.name)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Attendance Date *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]} // Prevent future dates
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Select the date for which you want to mark attendance
                </p>
              </div>

              {selectedGroup && loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">Loading students...</span>
                </div>
              )}
            </div>

            {selectedGroup && students.length > 0 && (
              <>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => handleMarkAll('PRESENT')}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 rounded-lg"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={() => handleMarkAll('ABSENT')}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 rounded-lg"
                  >
                    Mark All Absent
                  </button>
                  <button
                    onClick={() => handleMarkAll('')}
                    className="px-3 py-1 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 rounded-lg"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{student.studentId}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAttendance({ ...attendance, [student.id]: 'PRESENT' })}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            attendance[student.id] === 'PRESENT'
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          {attendance[student.id] === 'PRESENT' && <Check className="w-4 h-4 inline mr-1" />}
                          Present
                        </button>
                        <button
                          onClick={() => setAttendance({ ...attendance, [student.id]: 'LATE' })}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            attendance[student.id] === 'LATE'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          {attendance[student.id] === 'LATE' && <Check className="w-4 h-4 inline mr-1" />}
                          Late
                        </button>
                        <button
                          onClick={() => setAttendance({ ...attendance, [student.id]: 'ABSENT' })}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            attendance[student.id] === 'ABSENT'
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          {attendance[student.id] === 'ABSENT' && <Check className="w-4 h-4 inline mr-1" />}
                          Absent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !selectedGroup || !selectedDate || students.length === 0}
              className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Attendance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
