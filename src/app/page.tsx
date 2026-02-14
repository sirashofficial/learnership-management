'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import QuickActions from '@/components/QuickActions';
import { Users, Building2, Calendar, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';

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
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

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

  return (
    <div className="space-y-6">
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
  );
}
