'use client';

import { useDashboardStats } from '@/hooks/useDashboardStats';
import { 
  Users, 
  Building2, 
  ClipboardCheck, 
  TrendingUp,
} from 'lucide-react';

interface DashboardStatsProps {
  initialData?: any;
}

export default function DashboardStats({ initialData }: DashboardStatsProps) {
  const { stats, isLoading, isError } = useDashboardStats(initialData);

  if (isError) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Error loading dashboard stats. Please refresh the page.
      </div>
    );
  }

  const totalStudents = stats?.totalStudents || 0;
  const totalSites = stats?.totalSites || 0;
  const pendingAssessments = stats?.pendingAssessments || 0;
  const avgProgress = stats?.avgProgress || 0;
  const presentToday = stats?.recentAttendance?.filter((a: any) => 
    a.date === new Date().toISOString().split('T')[0] && a.status === 'PRESENT'
  ).length || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Users}
        label="Total Students"
        value={String(totalStudents)}
        change={`${totalStudents} Active`}
        changeType="positive"
        bgColor="bg-primary/10"
        iconColor="text-primary"
        isLoading={isLoading}
      />
      <StatCard
        icon={Building2}
        label="Training Groups"
        value={String(totalSites)}
        bgColor="bg-secondary/10"
        iconColor="text-secondary"
        isLoading={isLoading}
      />
      <StatCard
        icon={ClipboardCheck}
        label="Pending Assessments"
        value={String(pendingAssessments)}
        bgColor="bg-blue-50"
        iconColor="text-blue-600"
        isLoading={isLoading}
      />
      <StatCard
        icon={TrendingUp}
        label="Avg. Progress"
        value={`${Math.round(avgProgress)}%`}
        change={`${presentToday} Present Today`}
        changeType="positive"
        bgColor="bg-primary/10"
        iconColor="text-primary"
        isLoading={isLoading}
      />
    </div>
  );
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  changeType, 
  bgColor, 
  iconColor,
  isLoading 
}: {
  icon: any;
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative';
  bgColor: string;
  iconColor: string;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-background-border">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${bgColor} ${iconColor} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-sm text-text-light mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        {isLoading ? (
          <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <>
            <span className="text-2xl font-bold text-text">{value}</span>
            {change && (
              <span className={`text-xs ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                {change}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
