'use client';

import { useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
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
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${height}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 dark:from-emerald-800 dark:to-emerald-900 rounded-lg p-6 text-white shadow-lg">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user.name}!
              </h1>
              <p className="text-emerald-100">
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
        </main>
      </div>
    </div>
  );
}
