'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users, Building2, Calendar, TrendingUp, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import StatCard from './StatCard';
import { useDashboardStats } from '@/hooks/useDashboard';
import StatDetailsModal from './StatDetailsModal';
import { useGroups } from '@/contexts/GroupsContext';

export default function DashboardStats() {
  const { stats, isLoading, mutate } = useDashboardStats();
  const { groups } = useGroups();
  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  const totalStudentsFromGroups = useMemo(() => {
    const groupList = groups || [];
    const studentKeys = new Set<string>();

    groupList.forEach((group: any) => {
      (group.students || []).forEach((student: any) => {
        const first = String(student?.firstName || '').trim().toLowerCase();
        const last = String(student?.lastName || '').trim().toLowerCase();
        if (first || last) {
          studentKeys.add(`name:${first} ${last}`.trim());
          return;
        }

        const id = student?.id || student?.studentId;
        if (id) studentKeys.add(`id:${id}`);
      });
    });

    if (studentKeys.size > 0) return studentKeys.size;

    return groupList.reduce((sum: number, group: any) => sum + (group._count?.students || 0), 0);
  }, [groups]);

  const totalGroupsFromGroups = useMemo(() => (groups || []).length, [groups]);

  const resolvedTotalStudents = totalGroupsFromGroups > 0
    ? totalStudentsFromGroups
    : stats?.totalStudents?.value || 0;

  const resolvedTotalGroups = totalGroupsFromGroups > 0
    ? totalGroupsFromGroups
    : stats?.totalGroups?.value || 0;

  useEffect(() => {
    const handleFocus = () => mutate();
    const handleVisibility = () => {
      if (!document.hidden) mutate();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [mutate]);

  const statCards = [
    {
      id: 'students',
      title: 'Total Students',
      value: resolvedTotalStudents,
      trend: stats?.totalStudents?.trend,
      icon: Users,
      onClick: () => setSelectedStat('students'),
    },
    {
      id: 'groups',
      title: 'Groups & Companies',
      value: resolvedTotalGroups,
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
