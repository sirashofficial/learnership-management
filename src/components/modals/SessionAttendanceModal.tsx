'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, Loader2, X, Users, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useSWRConfig } from 'swr';
import { fetcher } from '@/lib/swr-config';
import useSWR from 'swr';
import { io, Socket } from 'socket.io-client';
import type { AttendanceUpdate } from '@/lib/realtime/attendanceRoom';

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

interface QueuedUpdate {
  studentId: string;
  status: string;
  timestamp: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
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
  
  // Real-time collaboration state
  const [liveCollabEnabled, setLiveCollabEnabled] = useState(false);
  const [collaboratorCount, setCollaboratorCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<QueuedUpdate[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const userInfoRef = useRef<{ id: string; name: string } | null>(null);

  const groupId = session?.groupId;

  const { data: studentsData } = useSWR(
    isOpen && groupId ? `/api/students?groupId=${groupId}` : null,
    fetcher
  );

  const students = useMemo(() => studentsData?.data || [], [studentsData]);

  // Toast notification helper
  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Get user info from session/auth (you might need to adjust this based on your auth system)
  useEffect(() => {
    // Try to get user info from localStorage or API
    const getUserInfo = async () => {
      try {
        // Adjust this based on your auth implementation
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const user = await response.json();
          userInfoRef.current = {
            id: user.id || user.email,
            name: user.name || user.email || 'Unknown User',
          };
        }
      } catch (error) {
        console.warn('Failed to get user info:', error);
        userInfoRef.current = {
          id: 'unknown',
          name: 'Unknown User',
        };
      }
    };
    getUserInfo();
  }, []);

  // WebSocket connection management
  useEffect(() => {
    if (!isOpen || !session?.id || !liveCollabEnabled) {
      // Disconnect if modal closed or live collab disabled
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Initialize WebSocket connection
    const socket = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      
      // Join attendance room for this session
      if (userInfoRef.current) {
        socket.emit('attendance:join-room', {
          sessionId: session.id,
          userId: userInfoRef.current.id,
          userName: userInfoRef.current.name,
        });
      }

      // Process offline queue if any
      if (offlineQueue.length > 0) {
        showToast(`Syncing ${offlineQueue.length} pending changes...`, 'info');
        // Process queue (handled by normal submit flow)
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
      showToast('Connection issue. Changes will sync when back online.', 'warning');
    });

    // Room event handlers
    socket.on('attendance:collaborator-joined', ({ userName, collaboratorCount: count }) => {
      setCollaboratorCount(count);
      if (userName !== userInfoRef.current?.name) {
        showToast(`${userName} joined`, 'info');
      }
    });

    socket.on('attendance:collaborator-left', ({ userName, collaboratorCount: count }) => {
      setCollaboratorCount(count);
      if (userName && userName !== userInfoRef.current?.name) {
        showToast(`${userName} left`, 'info');
      }
    });

    socket.on('attendance:room-state', ({ collaboratorCount: count }) => {
      setCollaboratorCount(count);
    });

    // Real-time attendance updates from other users
    socket.on('attendance:marked', (update: AttendanceUpdate) => {
      console.log('📡 Received attendance update:', update);
      
      // Update local state
      setAttendance((prev) => ({
        ...prev,
        [update.studentId]: update.status,
      }));

      // Find student name for notification
      const student = students.find((s: any) => s.id === update.studentId);
      const studentName = student
        ? `${student.firstName} ${student.lastName}`
        : 'a student';

      showToast(
        `${update.markedByName} marked ${studentName} as ${update.status.toLowerCase()}`,
        'success'
      );
    });

    // Conflict detection
    socket.on('attendance:conflict-detected', ({ studentId, previousMarkedBy, currentMarkedBy, currentStatus, resolvedUpdate }) => {
      console.warn('⚠️  Conflict detected:', {
        studentId,
        previousMarkedBy,
        currentMarkedBy,
      });

      const student = students.find((s: any) => s.id === studentId);
      const studentName = student
        ? `${student.firstName} ${student.lastName}`
        : 'Student';

      showToast(
        `Conflict: ${studentName} was marked by ${previousMarkedBy} and ${currentMarkedBy}. Using ${currentMarkedBy}'s update (${currentStatus}).`,
        'warning'
      );

      // Apply resolved update
      setAttendance((prev) => ({
        ...prev,
        [resolvedUpdate.studentId]: resolvedUpdate.status,
      }));
    });

    socket.on('attendance:error', ({ message }) => {
      showToast(`Error: ${message}`, 'warning');
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.emit('attendance:leave-room', { sessionId: session.id });
        socket.disconnect();
      }
    };
  }, [isOpen, session?.id, liveCollabEnabled, offlineQueue, students, showToast]);

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

  const handleMarkStudent = (studentId: string, status: string) => {
    setAttendance({ ...attendance, [studentId]: status });

    // If live collaboration enabled and connected, emit to WebSocket
    if (liveCollabEnabled && isConnected && socketRef.current && userInfoRef.current && session) {
      socketRef.current.emit('attendance:mark', {
        studentId,
        sessionId: session.id,
        groupId: groupId!,
        status,
        date: session.date,
        markedBy: userInfoRef.current.id,
        markedByName: userInfoRef.current.name,
      });
    } else if (liveCollabEnabled && !isConnected) {
      // Queue for later if offline
      setOfflineQueue((prev) => [
        ...prev.filter((q) => q.studentId !== studentId), // Remove old entry for same student
        { studentId, status, timestamp: Date.now() },
      ]);
    }
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
      
      // Clear offline queue after successful save
      setOfflineQueue([]);
      
      if (liveCollabEnabled) {
        showToast('Attendance saved and synced', 'success');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      showToast('Failed to save attendance', 'warning');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !session) return null;

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right ${
              toast.type === 'info'
                ? 'bg-blue-50 text-blue-900 border border-blue-200'
                : toast.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
            }`}
          >
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        ))}
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
          {/* Header with Live Collaboration Toggle */}
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
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

            {/* Live Collaboration Controls */}
            <div className="flex items-center justify-between gap-4 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={liveCollabEnabled}
                    onChange={(e) => setLiveCollabEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Live Collaboration
                  </span>
                </label>

                {liveCollabEnabled && (
                  <>
                    {/* Connection Status */}
                    <div className="flex items-center gap-1.5">
                      {isConnected ? (
                        <Wifi className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-slate-400" />
                      )}
                      <span className={`text-xs ${isConnected ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {isConnected ? 'Connected' : 'Connecting...'}
                      </span>
                    </div>

                    {/* Collaborator Count */}
                    {isConnected && collaboratorCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">
                          {collaboratorCount} {collaboratorCount === 1 ? 'collaborator' : 'collaborators'}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Offline Queue Indicator */}
              {offlineQueue.length > 0 && (
                <div className="flex items-center gap-1.5 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {offlineQueue.length} pending sync
                  </span>
                </div>
              )}
            </div>
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
                        onClick={() => handleMarkStudent(student.id, status)}
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
    </>
  );
}
