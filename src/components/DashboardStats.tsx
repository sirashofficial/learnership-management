'use client';

import { useState } from 'react';
import { Users, Building2, Calendar, TrendingUp, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import StatCard from './StatCard';
import { useDashboardStats } from '@/hooks/useDashboard';
import StatDetailsModal from './StatDetailsModal';

export default function DashboardStats() {
  const { stats, isLoading } = useDashboardStats();
  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  const statCards = [
    {
      id: 'students',
      title: 'Total Students',
      value: stats?.totalStudents?.value || 0,
      trend: stats?.totalStudents?.trend,
      icon: Users,
      onClick: () => setSelectedStat('students'),
    },
    {
      id: 'groups',
      title: 'Groups & Companies',
      value: stats?.totalGroups?.value || 0,
      trend: stats?.totalGroups?.trend,
      icon: Building2,
      onClick: () => setSelectedStat('groups'),
    },
    {
      id: 'attendance',
      title: 'Attendance Rate',
      value: stats?.attendanceRate?.value || 0,
      trend: stats?.attendanceRate?.trend,
      icon: Calendar,
      suffix: '%',
      onClick: () => setSelectedStat('attendance'),
    },
    {
      id: 'courses',
      title: 'Active Courses',
      value: stats?.activeCourses?.value || 0,
      trend: stats?.activeCourses?.trend,
      icon: BookOpen,
      onClick: () => setSelectedStat('courses'),
    },
    {
      id: 'completion',
      title: 'Completion Rate',
      value: stats?.completionRate?.value || 0,
      trend: stats?.completionRate?.trend,
      icon: CheckCircle,
      suffix: '%',
      onClick: () => setSelectedStat('completion'),
    },
    {
      id: 'assessments',
      title: 'Pending Assessments',
      value: stats?.pendingAssessments?.value || 0,
      trend: stats?.pendingAssessments?.trend,
      icon: AlertCircle,
      onClick: () => setSelectedStat('assessments'),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map((card) => (
          <StatCard
            key={card.id}
            title={card.title}
            value={card.value}
            trend={card.trend}
            icon={card.icon}
            suffix={card.suffix}
            onClick={card.onClick}
            loading={isLoading}
          />
        ))}
      </div>

      {selectedStat && (
        <StatDetailsModal
          statType={selectedStat}
          isOpen={!!selectedStat}
          onClose={() => setSelectedStat(null)}
        />
      )}
    </>
  );
}
