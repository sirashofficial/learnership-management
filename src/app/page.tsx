'use client';

import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addDays, endOfMonth, format, parseISO, startOfMonth } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/contexts/GroupsContext';
import QuickActions from '@/components/QuickActions';
import MiniCalendar from '@/components/MiniCalendar';
import NextSessionPanel from '@/components/NextSessionPanel';
import SessionAttendanceModal from '@/components/SessionAttendanceModal';
import Toast, { useToast } from '@/components/Toast';
import { fetcher } from '@/lib/swr-config';
import useSWR from 'swr';
import { Users, Building2, Calendar, BookOpen, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';

// Dynamic load heavy components
const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), { ssr: false });
const RecentActivity = dynamic(() => import('@/components/RecentActivity'), { ssr: false });
const DashboardAlerts = dynamic(() => import('@/components/DashboardAlerts'), { ssr: false });
const TodaysSchedule = dynamic(() => import('@/components/TodaysSchedule'), { ssr: false });

// Lightweight loading skeleton
function ComponentSkeleton({ height = 'h-48' }: { height?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${height}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 rounded"></div>
          <div className="h-3 bg-slate-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}

interface DashboardStats {
  totalStudents: number;
  totalGroups: number;
  attendanceRate: number;
  activeCourses: number;
  completionRate: number;
  pendingAssessments: number;
}

interface ProgrammeHealth {
  groupId: string;
  groupName: string;
  currentModule: number;
  currentModuleName: string;
  projectedCompletionDate: string;
  earnedCredits: number;
  totalCredits: number;
  weeksAhead: number;
  status: 'ON_TRACK' | 'AHEAD' | 'BEHIND';
}

interface DashboardData {
  stats: DashboardStats;
  programmeHealth: ProgrammeHealth[];
}

function StatCard({ title, value, icon: Icon, suffix = '' }: { 
  title: string; 
  value: number | string; 
  icon: any; 
  suffix?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {value}{suffix}
          </p>
        </div>
        <div className="bg-emerald-50 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-emerald-600" />
        </div>
      </div>
    </div>
  );
}

function getStatusBadge(status: string, weeksAhead: number) {
  if (status === 'AHEAD') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
        🚀 Ahead {Math.abs(weeksAhead)}w
      </span>
    );
  } else if (status === 'BEHIND') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
        ⚠️ Behind {Math.abs(weeksAhead)}w
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
        ✅ On Track
      </span>
    );
  }
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { groups } = useGroups();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ day: Date; top: number; left: number } | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const dayCardRef = useRef<HTMLDivElement | null>(null);
  const [attendanceSession, setAttendanceSession] = useState<any | null>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (!selectedDay) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (calendarRef.current?.contains(target)) return;
      if (dayCardRef.current?.contains(target)) return;
      setSelectedDay(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedDay]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/summary');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const shouldLoad = Boolean(user);
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const { data: monthSessionsData, isLoading: monthSessionsLoading } = useSWR(
    shouldLoad ? `/api/timetable?start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}` : null,
    fetcher
  );

  const monthSessions = monthSessionsData?.data || [];

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    monthSessions.forEach((session: any) => {
      const key = format(parseISO(session.date), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(session);
    });
    return map;
  }, [monthSessions]);

  const selectedDayKey = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : '';
  const selectedSessions = selectedDay ? sessionsByDay.get(selectedDayKey) || [] : [];

  const { data: alertsData } = useSWR(shouldLoad ? '/api/dashboard/alerts' : null, fetcher);
  const alerts = alertsData?.data?.alerts || [];

  const { data: attendanceData } = useSWR(
    shouldLoad && selectedDay ? `/api/attendance?date=${format(selectedDay, 'yyyy-MM-dd')}` : null,
    fetcher
  );

  const attendanceRecorded = (attendanceData?.data || []).length > 0;

  const dayGroupNames = useMemo(() => {
    const names = new Set<string>();
    selectedSessions.forEach((session: any) => {
      if (session.group?.name) {
        names.add(session.group.name);
      }
    });
    return names;
  }, [selectedSessions]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const dayAlerts = alerts.filter((alert: any) => dayGroupNames.has(alert.data?.groupName));

  const getStudentCount = (groupId?: string) => {
    if (!groupId) return 0;
    const match = groups.find((group) => group.id === groupId);
    return match?._count?.students || match?.students?.length || 0;
  };

  const totalStudents = selectedSessions.reduce((sum: number, session: any) => {
    return sum + getStudentCount(session.groupId);
  }, 0);

  const handleDayHover = (day: Date, rect: DOMRect) => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }

    hoverTimeout.current = setTimeout(() => {
      const key = format(day, 'yyyy-MM-dd');
      const daySessions = sessionsByDay.get(key) || [];
      if (daySessions.length === 0) return;
      setHoverInfo({ day, top: rect.bottom + 8, left: rect.left + rect.width / 2 });
    }, 400);
  };

  const handleDayLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    setHoverInfo(null);
  };

  return (
    <div className="min-[1200px]:flex min-[1200px]:items-start gap-6">
      <div className="flex-1 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Welcome back, {user.name}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Here&apos;s an overview of your learnership programme.
          </p>
        </div>

        {/* Stats */}
        {loadingData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : dashboardData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="Total Students"
              value={dashboardData.stats.totalStudents}
              icon={Users}
            />
            <StatCard
              title="Groups & Companies"
              value={dashboardData.stats.totalGroups}
              icon={Building2}
            />
            <StatCard
              title="Attendance Rate"
              value={dashboardData.stats.attendanceRate}
              icon={Calendar}
              suffix="%"
            />
            <StatCard
              title="Active Courses"
              value={dashboardData.stats.activeCourses}
              icon={BookOpen}
            />
            <StatCard
              title="Completion Rate"
              value={dashboardData.stats.completionRate}
              icon={CheckCircle}
              suffix="%"
            />
            <StatCard
              title="Pending Assessments"
              value={dashboardData.stats.pendingAssessments}
              icon={AlertCircle}
            />
          </div>
        ) : null}

        {/* Quick Actions */}
        <QuickActions />

        {/* Programme Health */}
        {!loadingData && dashboardData && dashboardData.programmeHealth.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Programme Health</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">
                      Group
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">
                      Current Module
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">
                      Credit Progress
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">
                      Projected Completion
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardData.programmeHealth.map((group) => {
                    const progressPercent = group.totalCredits > 0 
                      ? Math.round((group.earnedCredits / group.totalCredits) * 100) 
                      : 0;
                    
                    return (
                      <tr key={group.groupId} className="hover:bg-slate-50">
                        <td className="py-3">
                          <Link 
                            href={`/groups/${group.groupId}`}
                            className="text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            {group.groupName}
                          </Link>
                        </td>
                        <td className="py-3 text-sm text-slate-700">
                          Module {group.currentModule}: {group.currentModuleName}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[120px]">
                              <div 
                                className="bg-emerald-500 h-2 rounded-full transition-all"
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-slate-600 min-w-[60px]">
                              {group.earnedCredits}/{group.totalCredits}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-slate-700">
                          {group.projectedCompletionDate 
                            ? new Date(group.projectedCompletionDate).toLocaleDateString('en-ZA', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })
                            : 'N/A'}
                        </td>
                        <td className="py-3">
                          {getStatusBadge(group.status, group.weeksAhead)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Charts */}
        <Suspense fallback={<ComponentSkeleton height="h-64" />}>
          <DashboardCharts />
        </Suspense>

        {/* Activity + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<ComponentSkeleton />}>
            <RecentActivity />
          </Suspense>
          <Suspense fallback={<ComponentSkeleton />}>
            <DashboardAlerts />
          </Suspense>
        </div>

        {/* Schedule */}
        <Suspense fallback={<ComponentSkeleton height="h-96" />}>
          <TodaysSchedule />
        </Suspense>
      </div>

      <aside className="w-full min-[1200px]:w-[300px] flex-shrink-0 space-y-4">
        <div ref={calendarRef}>
          <MiniCalendar
            displayMonth={calendarMonth}
            onMonthChange={setCalendarMonth}
            onDayClick={(day) => setSelectedDay(day)}
            onDayHover={handleDayHover}
            onDayLeave={handleDayLeave}
            sessions={monthSessions}
            isSessionsLoading={monthSessionsLoading}
          />
        </div>

        {hoverInfo && (
          <div
            className="fixed z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-xl"
            style={{ top: hoverInfo.top, left: hoverInfo.left, transform: 'translateX(-50%)' }}
          >
            <p className="text-sm font-semibold text-slate-900">
              {format(hoverInfo.day, 'EEEE, d MMM')}
            </p>
            <div className="mt-2 space-y-1">
              {(sessionsByDay.get(format(hoverInfo.day, 'yyyy-MM-dd')) || []).map((session: any) => (
                <div key={session.id} className="text-slate-600">
                  {session.group?.name || 'Group'} — {session.venue || 'Venue TBC'} — {session.startTime}–{session.endTime}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDay && (
          <div ref={dayCardRef} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {format(selectedDay, 'EEEE, d MMMM yyyy')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = addDays(selectedDay, -1);
                  setSelectedDay(next);
                  setCalendarMonth(startOfMonth(next));
                }}
                className="rounded-lg border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = addDays(selectedDay, 1);
                  setSelectedDay(next);
                  setCalendarMonth(startOfMonth(next));
                }}
                className="rounded-lg border border-slate-200 p-1 text-slate-500 hover:bg-slate-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sessions
              </p>
              {selectedSessions.length === 0 ? (
                <p className="text-sm text-slate-500">No training sessions scheduled</p>
              ) : (
                <div className="space-y-2">
                  {selectedSessions.map((session: any) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: session.group?.colour || '#10b981' }}
                        />
                        <span className="font-semibold text-slate-900">
                          {session.group?.name || 'Group'}
                        </span>
                        <span>· {session.venue || 'Venue TBC'}</span>
                        <span>· {session.startTime}–{session.endTime}</span>
                        <span>· {getStudentCount(session.groupId)} students</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttendanceSession(session)}
                        className="rounded-lg border border-emerald-200 bg-white px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                      >
                        Mark Attendance
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Quick Stats
              </p>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                Groups attending: {dayGroupNames.size} | Total students: {totalStudents} | Attendance recorded: {attendanceRecorded ? 'Yes' : 'No'}
              </div>
            </div>

            {dayAlerts.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Alerts
                </p>
                <div className="flex flex-wrap gap-2">
                  {dayAlerts.map((alert: any) => (
                    <span
                      key={alert.id}
                      className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700"
                    >
                      {alert.data?.studentName || alert.message}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <NextSessionPanel variant="list" limit={3} showFooterLink />
        </div>
      </aside>

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
