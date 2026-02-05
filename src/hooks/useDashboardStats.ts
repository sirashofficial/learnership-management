'use client';

import useSWR from 'swr';
import { swrConfig, fetcher } from '@/lib/swr-config';

export interface DashboardStats {
  totalStudents: number;
  totalSites: number;
  totalGroups: number;
  pendingAssessments: number;
  avgProgress: number;
  recentAttendance: Array<{
    id: string;
    date: string;
    status: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
    };
    session: {
      id: string;
      title: string;
      site: {
        id: string;
        name: string;
      };
    };
  }>;
  atRiskStudents: Array<{
    id: string;
    firstName: string;
    lastName: string;
    progress: number;
    site: {
      id: string;
      name: string;
    };
  }>;
}

export function useDashboardStats(initialData?: DashboardStats) {
  const { data, error, isLoading, mutate } = useSWR<{ data: DashboardStats }>(
    '/api/dashboard/stats',
    fetcher,
    {
      fallbackData: initialData ? { data: initialData } : undefined,
      ...swrConfig.dashboardStats,
    }
  );

  return {
    stats: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}
