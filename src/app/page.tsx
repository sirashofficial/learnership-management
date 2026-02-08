'use client';

import { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import DashboardStats from '@/components/DashboardStats';
import QuickActions from '@/components/QuickActions';
import { useDashboardStats } from '@/hooks/useDashboard';

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

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { stats } = useDashboardStats();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

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
      {/* Header */}
      <Header />

      {/* Welcome Section - Immersive Premium Banner */}
      <div className="relative overflow-hidden bg-slate-950 rounded-[2.5rem] p-10 text-white shadow-2xl border border-white/5 noise-texture">
        {/* Abstract background accent */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />


        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400/80 mb-2">
              <span className="w-8 h-px bg-emerald-500/50"></span>
              Operational Synthesis
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter font-display leading-[1.1]">
              Welcome back, <span className="italic text-emerald-400">{user.name}</span>
            </h1>
            <p className="text-lg text-slate-400 font-medium max-w-xl font-main tracking-tight leading-relaxed">
              Your academic ecosystem is synchronized. Here's a strategic overview of your learnership modules and cohort performance.
            </p>
          </div>

          <div className="hidden xl:flex items-center gap-4">
            <div className="px-6 py-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Active Batches</p>
              <p className="text-2xl font-black font-display text-emerald-400">
                {stats?.totalGroups?.value || 0}
              </p>
            </div>
            <div className="px-6 py-4 rounded-3xl bg-emerald-500 shadow-xl shadow-emerald-500/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-1">Avg Attendance</p>
              <p className="text-2xl font-black font-display text-white">{stats?.attendanceRate?.value || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section - Load First (Priority) */}
      <DashboardStats />

      {/* Quick Actions - Static, no loading needed */}
      <QuickActions />

      {/* Charts Section - Lazy Loaded */}
      <Suspense fallback={<ComponentSkeleton height="h-64" />}>
        <DashboardCharts />
      </Suspense>

      {/* Two Column Layout - Lazy Loaded */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <Suspense fallback={<ComponentSkeleton />}>
          <RecentActivity />
        </Suspense>

        {/* Right Column */}
        <Suspense fallback={<ComponentSkeleton />}>
          <DashboardAlerts />
        </Suspense>
      </div>

      {/* Schedule Section - Lazy Loaded */}
      <Suspense fallback={<ComponentSkeleton height="h-96" />}>
        <TodaysSchedule />
      </Suspense>
    </div >
  );
}
