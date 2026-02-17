'use client';

import { useMemo, useRef, useState } from 'react';
import { addDays, format, isSameDay, parseISO, startOfWeek } from 'date-fns';
import useSWR from 'swr';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetcher } from '@/lib/swr-config';
import { useGroups } from '@/contexts/GroupsContext';
import MiniCalendar from '@/components/calendar/MiniCalendar';
import SessionDetailPanel from '@/components/dashboard/SessionDetailPanel';
import SessionHoverCard from '@/components/dashboard/SessionHoverCard';
import NextSessionPanel from '@/components/dashboard/NextSessionPanel';
import { getGroupColour } from '@/lib/groupColours';
import SessionAttendanceModal from '@/components/modals/SessionAttendanceModal';
import Toast, { useToast } from '@/components/ui/Toast';
import { formatGroupNameDisplay } from '@/lib/groupName';

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

interface TimetableWeekViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
}

function getShortGroupName(name: string) {
  const formatted = formatGroupNameDisplay(name || '');
  return formatted.replace(/\s*\(\d{4}\)\s*$/, '').trim();
}

export default function TimetableWeekView({
  selectedDate,
  onSelectDate,
  selectedGroupId,
  onGroupChange,
}: TimetableWeekViewProps) {
  const { groups } = useGroups();
  const [selectedSession, setSelectedSession] = useState<TimetableSession | null>(null);
  const [attendanceSession, setAttendanceSession] = useState<TimetableSession | null>(null);
  const [hoveredSession, setHoveredSession] = useState<TimetableSession | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 });
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 4);
  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;

  const weekUrl = `/api/timetable?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}${
    selectedGroupId !== 'all' ? `&groupId=${selectedGroupId}` : ''
  }`;

  const { data, isLoading } = useSWR(weekUrl, fetcher, { revalidateOnFocus: false });
  const sessions = useMemo(() => (data?.data || []) as TimetableSession[], [data]);

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, TimetableSession[]>();
    sessions.forEach((session) => {
      const key = format(parseISO(session.date), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(session);
    });
    return map;
  }, [sessions]);

  const dayDates = Array.from({ length: 5 }, (_, index) => addDays(weekStart, index));

  const handlePrevWeek = () => onSelectDate(addDays(weekStart, -7));
  const handleNextWeek = () => onSelectDate(addDays(weekStart, 7));
  const handleToday = () => onSelectDate(new Date());

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
      <div className="w-full min-[1200px]:w-[240px] flex-shrink-0 space-y-4">
        <MiniCalendar
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedSession(null);
            onSelectDate(date);
          }}
        />
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-base font-semibold text-slate-800">Group Legend</p>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => onGroupChange('all')}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors duration-150 cursor-pointer ${
                selectedGroupId === 'all' ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              All Groups
            </button>
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => onGroupChange(group.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors duration-150 cursor-pointer ${
                  selectedGroupId === group.id
                    ? 'bg-green-50 text-green-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: getGroupColour(group.name) }}
                />
                {formatGroupNameDisplay(group.name)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Week View</h2>
            <p className="text-sm text-slate-500">{weekLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-5 border-b border-slate-200">
            {dayDates.map((day) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${
                    isToday ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'
                  }`}
                >
                  <div>{format(day, 'EEE')}</div>
                  <div className="text-base font-bold text-slate-900">{format(day, 'd')}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-5">
            {dayDates.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const daySessions = sessionsByDay.get(dayKey) || [];
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={dayKey}
                  className={`min-h-[180px] border-r border-slate-200 p-3 ${
                    isToday ? 'bg-emerald-50/60' : 'bg-white'
                  } last:border-r-0`}
                >
                  <div className="text-xs font-semibold text-slate-500">09:00 – 14:00</div>
                  {isLoading ? (
                    <div className="mt-4 space-y-3">
                      {[...Array(2)].map((_, index) => (
                        <div key={index} className="h-16 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />
                      ))}
                    </div>
                  ) : daySessions.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 text-slate-400">
                      <Calendar className="h-5 w-5" />
                      <span className="text-sm">No sessions</span>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {daySessions.map((session) => (
                        <button
                          key={session.id}
                          type="button"
                          onMouseEnter={(event) => handleMouseEnter(session, event.currentTarget.getBoundingClientRect())}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => {
                            setSelectedSession(session);
                            setHoveredSession(null);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className="mt-1 h-10 w-1 rounded-full"
                              style={{ backgroundColor: session.group?.colour || '#10b981' }}
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {getShortGroupName(session.group?.name || 'Unnamed group')}
                              </p>
                              <p className="text-xs text-slate-500">{session.venue || 'Venue TBC'}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full min-[1200px]:w-[280px] flex-shrink-0">
        <SessionDetailPanel
          session={selectedSession}
          group={activeGroup}
          onClose={() => setSelectedSession(null)}
          onMarkAttendance={(session) => setAttendanceSession(session)}
          emptyState={<NextSessionPanel variant="single" />}
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


