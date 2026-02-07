'use client';

import { useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import DashboardStats from '@/components/DashboardStats';
import QuickActions from '@/components/QuickActions';

// Lazy load heavy components
const DashboardCharts = lazy(() => import('@/components/DashboardCharts'));
const RecentActivity = lazy(() => import('@/components/RecentActivity'));
const DashboardAlerts = lazy(() => import('@/components/DashboardAlerts'));
const TodaysSchedule = lazy(() => import('@/components/TodaysSchedule'));

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

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user.name}!
        </h1>
        <p className="text-slate-300">
          Here's what's happening with your learnership programs today.
        </p>
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
    </div>
  );
}
