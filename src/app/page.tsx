'use client';

import { useEffect, useMemo, useRef, useState, useCallback, Suspense } from 'react';
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
import KanbanView from '@/components/views/KanbanView';
import TimelineView from '@/components/views/TimelineView';
import AnalyticsView from '@/components/views/AnalyticsView';
import CollaborationView from '@/components/views/CollaborationView';
import { calculatePerformanceStatus } from '@/lib/statusUtils';
import { PlanStatus } from '@/types/rollout';

// Dynamic load heavy components
const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), { ssr: false });
const RecentActivity = dynamic(() => import('@/components/RecentActivity'), { ssr: false });
const DashboardAlerts = dynamic(() => import('@/components/DashboardAlerts'), { ssr: false });
const TodaysSchedule = dynamic(() => import('@/components/TodaysSchedule'), { ssr: false });
const StatCard = dynamic(() => import('@/components/StatCard'), { ssr: false });
const TeachingNotifications = dynamic(() => import('@/components/TeachingNotifications'), { ssr: false });

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

// Skeleton card component for loading states
function SkeletonCard({ height = 'h-48' }: { height?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${height}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
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

function getStatusBadge(status: string, weeksAhead: number) {
  if (status === 'NO_PLAN') {
    return (
      <span className="status-pill bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
        <span className="text-sm">📋</span>
        No Plan
      </span>
    );
  } else if (status === 'AHEAD') {
    return (
      <span className="status-pill bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
        <span className="text-sm">🚀</span>
        Ahead {Math.abs(weeksAhead)}w
      </span>
    );
  } else if (status === 'BEHIND') {
    return (
      <span className="status-pill bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
        <span className="text-sm">⚠️</span>
        Behind {Math.abs(weeksAhead)}w
      </span>
    );
  } else if (status === 'AT_RISK') {
    return (
      <span className="status-at-risk">
        <span className="text-sm">🔴</span>
        At Risk
      </span>
    );
  } else {
    return (
      <span className="status-on-track">
        <span className="text-sm">✅</span>
        On Track
      </span>
    );
  }
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
  try {
    // DEFENSIVE: Ensure healthStatus is a string before using it
    const healthStatus = String(group?.healthStatus || '').trim();
    
    if (healthStatus && ['ON_TRACK', 'BEHIND', 'AT_RISK', 'OVERDUE', 'COMPLETE', 'NOT_STARTED'].includes(healthStatus)) {
      return renderStatusBadge(healthStatus as PlanStatus);
    }

    // Fallback to calculation if status is missing (legacy compatibility)
    const status = calculatePerformanceStatus(
      80,
      typeof attendanceRate === 'number' ? attendanceRate : 0,
      hasPlan === true,
      typeof attendanceRate === 'number' ? attendanceRate : 0,
      0,
      0,
      'ON_TRACK'
    );

    return renderStatusBadge(status);
  } catch (error) {
    console.error('Error in renderProgrammeStatus:', error);
    return renderStatusBadge('ON_TRACK');
  }
};

// Helper to render the actual badge UI
const renderStatusBadge = (status: PlanStatus | string) => {
  const safeStatus = String(status || 'ON_TRACK').toUpperCase();
  
  switch (safeStatus) {
    case 'ON_TRACK':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="w-3 h-3" />
          On Track
        </span>
      );
    case 'BEHIND':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700">
          <AlertTriangle className="w-3 h-3" />
          Behind
        </span>
      );
    case 'AT_RISK':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700">
          <AlertTriangle className="w-3 h-3" />
          At Risk
        </span>
      );
    case 'OVERDUE':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
          <Clock className="w-3 h-3" />
          Overdue
        </span>
      );
    case 'COMPLETE':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-teal-50 text-teal-700">
          <CheckCircle2 className="w-3 h-3" />
          Complete
        </span>
      );
    case 'NOT_STARTED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
          <Clock className="w-3 h-3" />
          Not Started
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
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
  const isFetchingRef = useRef(false);

  // View switching for enhanced dashboard (moved before early returns)
  const [currentView, setCurrentView] = useState<'dashboard' | 'kanban' | 'timeline' | 'collaboration' | 'analytics'>('dashboard');

  // SWR hooks for real-time data
  const { stats: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { summary: dashboardLite, isLoading: liteLoading } = useDashboardLite(); // New lightweight API
  const { activities: recentActivities, isLoading: activitiesLoading } = useRecentActivity();
  const { schedule: todaysSchedule, isLoading: scheduleLoading } = useDashboardSchedule();

  // Use lightweight API data for faster loading - fallback to old API if needed
  // CRITICAL: Ensure only primitives are passed, never objects
  const totalStudents = typeof dashboardLite?.totalStudents === 'number' 
    ? dashboardLite.totalStudents 
    : typeof dashboardStats?.totalStudents?.value === 'number'
      ? dashboardStats.totalStudents.value
      : 0;
  const totalGroups = typeof dashboardLite?.totalGroups === 'number'
    ? dashboardLite.totalGroups
    : typeof dashboardStats?.totalGroups?.value === 'number'
      ? dashboardStats.totalGroups.value
      : 0;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchDashboardData = useCallback(async () => {
    // Prevent duplicate calls
    if (isFetchingRef.current) {
      console.log('Already fetching, skipping...');
      return;
    }
    
    isFetchingRef.current = true;
    try {
      // Use unified endpoint (single source of truth)
      const response = await fetch('/api/data/groups', {
        credentials: 'include',
      });
      if (response.ok) {
        const unifiedData = await response.json();
        // Map unified response to dashboard format
        if (unifiedData.success && unifiedData.data) {
          const dashboardData = {
            stats: {
              totalStudents: unifiedData.data.summary.totalStudents,
              totalGroups: unifiedData.data.summary.totalGroups,
              attendanceRate: 0, // Fetched separately
              activeCourses: unifiedData.data.summary.totalGroups,
              completionRate: unifiedData.data.summary.averageProgress,
              pendingAssessments: 0,
            },
            programmeHealth: unifiedData.data.groups.map((group: any) => ({
              groupId: group.id,
              groupName: group.name,
              currentModule: 1,
              currentModuleName: 'Module 1',
              projectedCompletionDate: group.endDate || new Date().toISOString(),
              earnedCredits: group.metrics.avgCreditsPerStudent,
              totalCredits: group.totalCreditsRequired,
              weeksAhead: 0,
              status: group.metrics.healthStatus,
            })),
          };
          setDashboardData(dashboardData);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (user && !isFetchingRef.current) {
      // Data is now fetched via GroupsContext and custom hooks (useDashboardStats, etc.)
      // No need for manual fetchDashboardData call here
      // fetchDashboardData();
      setLoadingData(false);
    }
  }, [user, fetchDashboardData]);

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
  const alerts = alertsData?.data?.alerts || [];

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
            {statsLoading || loadingData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="dashboard-card p-5 animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3"></div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (dashboardStats || dashboardData) ? (
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
                  value={typeof dashboardStats?.attendanceRate?.value === 'number' ? dashboardStats.attendanceRate.value : typeof dashboardStats?.attendanceRate === 'number' ? dashboardStats.attendanceRate : typeof dashboardData?.stats.attendanceRate === 'number' ? dashboardData.stats.attendanceRate : 0}
                  icon={Calendar}
                  suffix="%"
                  onClick={() => router.push('/attendance')}
                />
                <StatCard
                  title="Active Courses"
                  value={typeof dashboardStats?.activeCourses?.value === 'number' ? dashboardStats.activeCourses.value : typeof dashboardStats?.activeCourses === 'number' ? dashboardStats.activeCourses : typeof dashboardData?.stats.activeCourses === 'number' ? dashboardData.stats.activeCourses : 0}
                  icon={BookOpen}
                />
                <StatCard
                  title="Completion Rate"
                  value={typeof dashboardStats?.completionRate?.value === 'number' ? dashboardStats.completionRate.value : typeof dashboardStats?.completionRate === 'number' ? dashboardStats.completionRate : typeof dashboardData?.stats.completionRate === 'number' ? dashboardData.stats.completionRate : 0}
                  icon={CheckCircle}
                  suffix="%"
                />
                <StatCard
                  title="Pending Assessments"
                  value={typeof dashboardStats?.pendingAssessments?.value === 'number' ? dashboardStats.pendingAssessments.value : typeof dashboardStats?.pendingAssessments === 'number' ? dashboardStats.pendingAssessments : typeof dashboardData?.stats.pendingAssessments === 'number' ? dashboardData.stats.pendingAssessments : 0}
                  icon={AlertCircle}
                  onClick={() => router.push('/assessments?status=PENDING')}
                />
              </div>
            ) : null}

            {/* Facilitator Teaching Assistant */}
            <div className="mb-6">
              <TeachingNotifications />
            </div>

            {/* Quick Actions */}
            <QuickActions />

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
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left font-semibold text-slate-700 dark:text-slate-300 pb-3 px-3">Group</th>
                        <th className="text-left font-semibold text-slate-700 dark:text-slate-300 pb-3 px-3">Learners</th>
                        <th className="text-left font-semibold text-slate-700 dark:text-slate-300 pb-3 px-3">Attendance</th>
                        <th className="text-left font-semibold text-slate-700 dark:text-slate-300 pb-3 px-3">Module</th>
                        <th className="text-left font-semibold text-slate-700 dark:text-slate-300 pb-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {!Array.isArray(groups) || groups.filter(g => g && g.status && ['ACTIVE', 'PLANNING'].includes(String(g.status))).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 px-3 text-center text-slate-500">No active groups</td>
                        </tr>
                      ) : (
                        groups
                          .filter(g => g && g.status && ['ACTIVE', 'PLANNING'].includes(String(g.status)))
                          .map((group, index) => {
                            if (!group || typeof group !== 'object')  return null;
                            try {
                              // DEFENSIVE: Everything converted to primitives before rendering
                              const gId = String(group.id || '');
                              const gName = String(group.name || 'Unnamed');
                              const  gCount = String((group._count?.students ?? group.students?.length ?? 0) || '0');
                              const gAttendance = String((typeof group.attendanceRate === 'number' ? group.attendanceRate : 0) || '0');
                              const gModule = String(getModuleLabel(group) || 'No Plan');
                              const gStatus = String(group.healthStatus || 'On Track');

                              return (
                                <tr key={gId} className={index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/30'}>
                                  <td className="py-3 px-3">
                                    <a href={`/groups/${gId}`} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                                      {gName}
                                    </a>
                                  </td>
                                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{gCount} Learners</td>
                                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{gAttendance}%</td>
                                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{gModule}</td>
                                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{gStatus}</td>
                                </tr>
                              );
                            } catch (e) {
                              console.error('Group row error:', e);
                              return (
                                <tr key={String(group?.id || 'err')}>
                                  <td colSpan={5} className="py-3 px-3 text-red-600">Error rendering group</td>
                                </tr>
                              );
                            }
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Charts */}
            <Suspense fallback={<ComponentSkeleton height="h-64" />}>
              <DashboardCharts />
            </Suspense>

            {/* Activity + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activitiesLoading ? (
                <SkeletonCard />
              ) : (
                <Suspense fallback={<ComponentSkeleton />}>
                  <RecentActivity />
                </Suspense>
              )}
              <Suspense fallback={<ComponentSkeleton />}>
                <DashboardAlerts />
              </Suspense>
            </div>

            {/* Schedule */}
            {scheduleLoading ? (
              <SkeletonCard height="h-96" />
            ) : (
              <Suspense fallback={<ComponentSkeleton height="h-96" />}>
                <TodaysSchedule />
              </Suspense>
            )}
          </div>
        );
    }
  };

  return (
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
  );
}
