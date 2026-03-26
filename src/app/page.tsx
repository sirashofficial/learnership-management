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
import EmptyState from '@/components/EmptyState';
import { fetcher } from '@/lib/swr-config';
import { formatGroupNameDisplay } from '@/lib/groupName';
import useSWR from 'swr';
import { useDashboardStats, useRecentActivity, useDashboardSchedule } from '@/hooks/useDashboard';
import { useDashboardLite } from '@/hooks/useSummaryAPIs';
import { Users, Building2, Calendar, BookOpen, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, X, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import AlertZone from '@/components/AlertZone';
import DataHealthWidget from '@/components/DataHealthWidget';
import KanbanView from '@/components/views/KanbanView';
import TimelineView from '@/components/views/TimelineView';
import AnalyticsView from '@/components/views/AnalyticsView';
import CollaborationView from '@/components/views/CollaborationView';
import ErrorCatcher from '@/components/ErrorCatcher';
import { calculatePerformanceStatus } from '@/lib/statusUtils';
import { PlanStatus } from '@/types/rollout';

// Dynamic load heavy components
const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), { ssr: false });
const RecentActivity = dynamic(() => import('@/components/RecentActivity'), { ssr: false });
const DashboardAlerts = dynamic(() => import('@/components/DashboardAlerts'), { ssr: false });
const TodaysSchedule = dynamic(() => import('@/components/TodaysSchedule'), { ssr: false });
const StatCard = dynamic(() => import('@/components/StatCard'), { ssr: false });
const TeachingNotifications = dynamic(() => import('@/components/TeachingNotifications'), { ssr: false });

function CardSkeleton({ height = 'h-48' }: { height?: string }) {
  return (
    <div className={`dashboard-card p-6 ${height}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
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

function getStat(stats: any, key: string): number {
  if (typeof stats?.[key]?.value === 'number') return stats[key].value;
  if (typeof stats?.[key] === 'number') return stats[key];
  return 0;
}

// Get current module label from rollout plan
const getModuleLabel = (group: any) => {
  try {
    const rollouts = Array.isArray(group.unitStandardRollouts) ? group.unitStandardRollouts : [];
    if (rollouts.length === 0) return 'No Plan';

    const now = new Date();

    // Find current active module by date
    const activeRollout = rollouts.find((r: any) => {
      const start = r.startDate ? new Date(r.startDate) : null;
      const end = r.assessingDate ? new Date(r.assessingDate) : null;
      return start && end && now >= start && now <= end;
    });

    if (activeRollout?.unitStandard?.module?.moduleNumber) {
      const moduleNum = activeRollout.unitStandard.module.moduleNumber;
      return `Module ${typeof moduleNum === 'number' ? moduleNum : '?'}`;
    }

    // Fallback to latest module if all passed
    const sorted = [...rollouts].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    });

    const latest = sorted.find(r => r.startDate && new Date(r.startDate) <= now) || sorted[0];
    if (latest?.unitStandard?.module?.moduleNumber) {
      const moduleNum = latest.unitStandard.module.moduleNumber;
      return `Module ${typeof moduleNum === 'number' ? moduleNum : '?'}`;
    }

    return 'No Plan';
  } catch (error) {
    console.error('Error in getModuleLabel:', error);
    return 'No Plan';
  }
};

// Render programme health status badge using unified logic
const renderProgrammeStatus = (attendanceRate: number, hasPlan: boolean, group: any) => {
  // Use pre-calculated status from context/API if available
  if (group.healthStatus) {
    return renderStatusBadge(group.healthStatus as PlanStatus);
  }

  // Fallback to calculation if status is missing (legacy compatibility)
  const status = calculatePerformanceStatus(
    80,
    attendanceRate,
    hasPlan,
    attendanceRate,
    0,
    0,
    'ON_TRACK'
  );

  return renderStatusBadge(status);
};

// Helper to render the actual badge UI
const renderStatusBadge = (status: PlanStatus) => {
  switch (status) {
    case 'ON_TRACK':
      return (
        <span className="status-on-track">
          <CheckCircle2 className="w-3 h-3" />
          On Track
        </span>
      );
    case 'BEHIND':
      return (
        <span className="status-behind">
          <AlertTriangle className="w-3 h-3" />
          Behind
        </span>
      );
    case 'AT_RISK':
      return (
        <span className="status-at-risk">
          <AlertTriangle className="w-3 h-3" />
          At Risk
        </span>
      );
    case 'OVERDUE':
      return (
        <span className="status-pill bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
          <Clock className="w-3 h-3" />
          Overdue
        </span>
      );
    case 'COMPLETE':
      return (
        <span className="status-pill bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
          <CheckCircle2 className="w-3 h-3" />
          Complete
        </span>
      );
    case 'NOT_STARTED':
      return (
        <span className="status-pill bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <Clock className="w-3 h-3" />
          Not Started
        </span>
      );
    default:
      return (
        <span className="status-pill bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <Clock className="w-3 h-3" />
          No Plan
        </span>
      );
  }
};

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { groups } = useGroups();
  const router = useRouter();
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ day: Date; top: number; left: number } | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const dayCardRef = useRef<HTMLDivElement | null>(null);
  const [attendanceSession, setAttendanceSession] = useState<any | null>(null);
  const { toast, showToast, hideToast } = useToast();
  // View switching for enhanced dashboard (moved before early returns)
  const [currentView, setCurrentView] = useState<'dashboard' | 'kanban' | 'timeline' | 'collaboration' | 'analytics'>('dashboard');

  // SWR hooks for real-time data
  const { stats: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { summary: dashboardLite, isLoading: liteLoading } = useDashboardLite(); // New lightweight API
  const { activities: recentActivities, isLoading: activitiesLoading } = useRecentActivity();
  const { schedule: todaysSchedule, isLoading: scheduleLoading } = useDashboardSchedule();

  // Use lightweight API data for faster loading - fallback to old API if needed
  // CRITICAL: Ensure only primitives are passed, never objects
  const totalStudents = (() => {
    if (typeof dashboardLite?.totalStudents === 'number') return dashboardLite.totalStudents;
    if (typeof dashboardStats?.totalStudents?.value === 'number') return dashboardStats.totalStudents.value;
    if (typeof dashboardStats?.totalStudents === 'number') return dashboardStats.totalStudents;
    return 0;
  })();
  
  const totalGroups = (() => {
    if (typeof dashboardLite?.totalGroups === 'number') return dashboardLite.totalGroups;
    if (typeof dashboardStats?.totalGroups?.value === 'number') return dashboardStats.totalGroups.value;
    if (typeof dashboardStats?.totalGroups === 'number') return dashboardStats.totalGroups;
    return 0;
  })();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

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


  // Memoize group IDs to avoid infinite loops
  const groupIds = useMemo(() =>
    groups?.map((g: any) => g.id).join(',') || '',
    [groups]
  );

  useEffect(() => {
    if (groups && groups.length > 0) {
      // Logic for refreshing dashboard statistics when groups change can go here
    }
  }, [groupIds]);


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

  const { data: alertsData } = useSWR(
    shouldLoad ? '/api/dashboard/alerts' : null,
    fetcher,
    {
      refreshInterval: 30000, // Auto-refresh every 30 seconds
      revalidateOnFocus: true // Refresh when user returns to tab
    }
  );
  
  // Safely extract alerts array and ensure primitives
  const alerts = useMemo(() => {
    try {
      const rawAlerts = alertsData?.data?.alerts || [];
      // Ensure all alerts have proper string properties
      return Array.isArray(rawAlerts) ? rawAlerts.filter((alert: any) => 
        alert && typeof alert === 'object' && 'id' in alert
      ) : [];
    } catch (error) {
      console.error('Error processing alerts:', error);
      return [];
    }
  }, [alertsData]);

  const { data: attendanceData } = useSWR(
    shouldLoad && selectedDay ? `/api/attendance?date=${format(selectedDay, 'yyyy-MM-dd')}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Auto-refresh every 30 seconds
      revalidateOnFocus: true // Refresh when user returns to tab
    }
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

  const selectedDayTotalStudents = selectedSessions.reduce((sum: number, session: any) => {
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

  // Render different views based on selection
  const renderMainContent = () => {
    switch (currentView) {
      case 'kanban':
        return <KanbanView />;
      case 'timeline':
        return <TimelineView />;
      case 'collaboration':
        return <CollaborationView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'dashboard':
      default:
        return (
          <div className="flex-1 space-y-6">
            {/* Stats Row */}
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="dashboard-card p-5 animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3"></div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard
                  title="Total Students"
                  value={totalStudents}
                  icon={Users}
                  onClick={() => router.push('/students')}
                />
                <StatCard
                  title="Groups & Companies"
                  value={totalGroups}
                  icon={Building2}
                />
                <StatCard
                  title="Attendance Rate"
                  value={getStat(dashboardStats, 'attendanceRate')}
                  icon={Calendar}
                  suffix="%"
                  onClick={() => router.push('/attendance')}
                />
                <StatCard
                  title="Active Courses"
                  value={getStat(dashboardStats, 'activeCourses')}
                  icon={BookOpen}
                />
                <StatCard
                  title="Completion Rate"
                  value={getStat(dashboardStats, 'completionRate')}
                  icon={CheckCircle}
                  suffix="%"
                />
                <StatCard
                  title="Pending Assessments"
                  value={getStat(dashboardStats, 'pendingAssessments')}
                  icon={AlertCircle}
                  onClick={() => router.push('/assessments?status=PENDING')}
                />
              </div>
            )}

            {/* Facilitator Teaching Assistant */}
            <div className="mb-6">
              <TeachingNotifications />
            </div>

            {/* Quick Actions */}
            <QuickActions />

            {/* Data Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DataHealthWidget />
            </div>

            {/* PROGRAMME HEALTH TABLE - Pulls from Groups context (same source as Groups page) */}
            <div className="dashboard-card p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Programme Health</h3>
              {isLoading || !groups ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  ))}
                </div>
              ) : !groups || groups.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Programme Data"
                  description="Create groups and assign rollout plans to track programme health"
                  action={{
                    label: "Go to Groups",
                    onClick: () => router.push('/groups')
                  }}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-3 px-3">
                          Group Name
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-3 px-3">
                          Learners
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-3 px-3">
                          Attendance
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-3 px-3">
                          Current Module
                        </th>
                        <th className="text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-3 px-3">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {groups.filter(g => g.status === 'ACTIVE' || g.status === 'PLANNING').length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 px-3 text-center text-sm text-slate-500">
                            No active groups
                          </td>
                        </tr>
                      ) : (
                        groups.filter(g => g.status === 'ACTIVE' || g.status === 'PLANNING').map((group, index) => {
                          // Helper: Parse group.notes to extract rollout plan structure
                          const parseGroupRolloutPlan = (notes: string | null | undefined) => {
                            if (!notes) return null;
                            try {
                              const parsed = JSON.parse(notes);
                              return parsed?.rolloutPlan || null;
                            } catch (error) {
                              console.warn(`Failed to parse notes for group ${group.id}:`, error);
                              return null;
                            }
                          };

                          // DEFENSIVE: Ensure all values are primitives
                          const learnerCount = typeof group._count?.students === 'number' ? group._count.students : typeof group.students?.length === 'number' ? group.students.length : 0;
                          const rawAttendance = group.attendanceRate ?? group.attendanceRate ?? 0;
                          const attendance = typeof rawAttendance === 'number' ? rawAttendance : 0;
                          const totalRecorded = typeof group.totalRecorded === 'number' ? group.totalRecorded : 0;

                          const hasPlan = Boolean(group.unitStandardRollouts?.length);

                          // Use the refined module label logic
                          const moduleLabel = String(getModuleLabel(group) || 'No Plan');

                          return (
                            <tr
                              key={group.id}
                              className={`transition-colors ${index % 2 === 0
                                ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                : 'bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                              <td className="py-4 px-3">
                                <Link
                                  href={`/groups/${group.id}`}
                                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors text-sm"
                                >
                                  {formatGroupNameDisplay(group.name || '')}
                                </Link>
                              </td>
                              <td className="py-4 px-3">
                                <div className="flex flex-col">
                                  <span className="text-sm text-slate-700 dark:text-slate-300">
                                    {typeof learnerCount === 'number' ? learnerCount : 0} Learners
                                  </span>
                                  {group.actualProgress && typeof group.actualProgress.atRiskCount === 'number' && group.actualProgress.atRiskCount > 0 && (
                                    <span className="text-[10px] text-red-500 font-medium flex items-center gap-0.5">
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                      {group.actualProgress.atRiskCount} At Risk
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-3">
                                {typeof attendance === 'number' && attendance === 0 && (typeof totalRecorded === 'number' && totalRecorded === 0 || !totalRecorded) ? (
                                  <span className="text-sm text-slate-400">—</span>
                                ) : typeof attendance === 'number' && attendance === 0 ? (
                                  <span className="text-sm font-semibold text-rose-500">0%</span>
                                ) : typeof attendance === 'number' ? (
                                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{attendance.toFixed(0)}%</span>
                                ) : (
                                  <span className="text-sm text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-4 px-3">
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                  {typeof moduleLabel === 'string' ? moduleLabel : 'No Plan'}
                                </span>
                              </td>
                              <td className="py-4 px-3">
                                {typeof attendance === 'number' && Boolean(hasPlan) ? renderProgrammeStatus(attendance, hasPlan, group) : renderProgrammeStatus(0, false, group)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Charts */}
            <Suspense fallback={<div className="dashboard-card h-64 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl" />}>
              <DashboardCharts />
            </Suspense>

            {/* Activity + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activitiesLoading ? (
                <div className="dashboard-card h-48 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl" />
              ) : (
                <Suspense fallback={<div className="dashboard-card h-48 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl" />}>
                  <RecentActivity />
                </Suspense>
              )}
              <Suspense fallback={<div className="dashboard-card h-48 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl" />}>
                <DashboardAlerts />
              </Suspense>
            </div>

            {/* Schedule */}
            {scheduleLoading ? (
              <div className="dashboard-card h-96 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ) : (
              <Suspense fallback={<div className="dashboard-card h-96 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl" />}>
                <TodaysSchedule />
              </Suspense>
            )}
          </div>
        );
    }
  };

  return (
    <ErrorCatcher>
      <DashboardLayout
        currentView={currentView}
        onViewChange={setCurrentView}
        alertSidebar={<AlertZone />}
      >
        {renderMainContent()}

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
                `Attendance saved for ${formatGroupNameDisplay(attendanceSession.group?.name || 'group')} — ${summary.present} present, ${summary.absent} absent`,
                'success'
              );
              setAttendanceSession(null);
            }}
          />
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </DashboardLayout>
    </ErrorCatcher>
  );
}
