'use client';

import { useRef, useState } from 'react';
import { endOfDay, format, startOfDay } from 'date-fns';
import useSWR from 'swr';
import { MapPin, Users } from 'lucide-react';
import { fetcher } from '@/lib/swr-config';
import { useGroups } from '@/contexts/GroupsContext';
import MiniCalendar from '@/components/MiniCalendar';
import SessionDetailPanel from '@/components/SessionDetailPanel';
import SessionHoverCard from '@/components/SessionHoverCard';
import SessionAttendanceModal from '@/components/SessionAttendanceModal';
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

interface TimetableDayViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  selectedGroupId: string;
}

export default function TimetableDayView({
  selectedDate,
  onSelectDate,
  selectedGroupId,
}: TimetableDayViewProps) {
  const { groups } = useGroups();
  const [selectedSession, setSelectedSession] = useState<TimetableSession | null>(null);
  const [attendanceSession, setAttendanceSession] = useState<TimetableSession | null>(null);
  const [hoveredSession, setHoveredSession] = useState<TimetableSession | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 });
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  const dayUrl = `/api/timetable?start=${dayStart.toISOString()}&end=${dayEnd.toISOString()}${
    selectedGroupId !== 'all' ? `&groupId=${selectedGroupId}` : ''
  }`;

  const { data, isLoading } = useSWR(dayUrl, fetcher, { revalidateOnFocus: false });
  const sessions: TimetableSession[] = data?.data || [];

  const handleMouseEnter = (session: TimetableSession, rect: DOMRect) => {
    if (selectedSession) return;
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    hoverTimeout.current = setTimeout(() => {
      setHoveredSession(session);
      setHoverPosition({ top: rect.bottom + 8, left: rect.left });
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    setHoveredSession(null);
  };

  const activeGroup = groups.find((group) => group.id === selectedSession?.groupId);

  return (
    <div className="flex flex-col gap-6 min-[1200px]:flex-row">
      <div className="flex-1 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Day View</h2>
          <p className="text-sm text-slate-500">
            {format(selectedDate, 'EEEE, d MMM yyyy')}
          </p>
        </div>

        <MiniCalendar
          variant="strip"
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedSession(null);
            onSelectDate(date);
          }}
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, index) => (
                <div key={index} className="h-20 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-500">
              <div className="h-10 w-10 rounded-full bg-slate-100" />
              No sessions scheduled for this day.
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onMouseEnter={(event) => handleMouseEnter(session, event.currentTarget.getBoundingClientRect())}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => {
                    setSelectedSession(session);
                    setHoveredSession(null);
                  }}
                  className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="text-sm font-semibold text-slate-500">{session.startTime}</div>
                  <span
                    className="h-10 w-1 rounded-full"
                    style={{ backgroundColor: session.group?.colour || '#10b981' }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {session.group?.name || 'Unnamed group'}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.venue || 'Venue TBC'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {groups.find((group) => group.id === session.groupId)?._count?.students || 0} students
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full min-[1200px]:w-[280px] flex-shrink-0">
        <SessionDetailPanel
          session={selectedSession}
          group={activeGroup}
          onClose={() => setSelectedSession(null)}
          onMarkAttendance={(session) => setAttendanceSession(session)}
        />
      </div>

      {hoveredSession && (
        <SessionHoverCard
          session={hoveredSession}
          group={groups.find((group) => group.id === hoveredSession.groupId)}
          position={hoverPosition}
          visible={!selectedSession}
        />
      )}

      {attendanceSession && (
        <SessionAttendanceModal
          isOpen={Boolean(attendanceSession)}
          session={{
            id: attendanceSession.id,
            date: attendanceSession.date,
            groupId: attendanceSession.groupId,
            groupName: attendanceSession.group?.name,
          }}
          onClose={() => setAttendanceSession(null)}
          onSaved={(summary) => {
            showToast(
              `Attendance saved for ${attendanceSession.group?.name || 'group'} — ${summary.present} present, ${summary.absent} absent`,
              'success'
            );
            setAttendanceSession(null);
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
