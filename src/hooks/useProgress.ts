'use client';

import useSWR from 'swr';
import { swrConfig, fetcher } from '@/lib/swr-config';

export interface ModuleProgress {
  id: string;
  studentId: string;
  moduleId: string;
  status: string;
  progress: number;
  startDate: string | null;
  completionDate: string | null;
  module: {
    id: string;
    code: string;
    name: string;
    credits: number;
    order: number;
    unitStandards: Array<{
      id: string;
      code: string;
      title: string;
      credits: number;
    }>;
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    group: {
      id: string;
      name: string;
    } | null;
  };
}

export interface UnitStandardProgress {
  id: string;
  studentId: string;
  unitStandardId: string;
  status: string;
  startDate: string | null;
  completionDate: string | null;
  formativesPassed: number;
  summativePassed: boolean;
  unitStandard: {
    id: string;
    code: string;
    title: string;
    credits: number;
    module: {
      id: string;
      name: string;
    };
  };
}

export function useProgress(options?: { studentId?: string; groupId?: string }) {
  const params = new URLSearchParams();
  if (options?.studentId) params.append('studentId', options.studentId);
  if (options?.groupId) params.append('groupId', options.groupId);
  
  const url = `/api/progress${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<{
    data: {
      moduleProgress: ModuleProgress[];
      unitStandardProgress: UnitStandardProgress[];
    };
  }>(url, fetcher);

  return {
    moduleProgress: data?.data?.moduleProgress || [],
    unitStandardProgress: data?.data?.unitStandardProgress || [],
    isLoading,
    isError: error,
    mutate,
  };
}
