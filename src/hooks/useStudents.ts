'use client';

import useSWR from 'swr';
import { swrConfig, fetcher } from '@/lib/swr-config';

export interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  idNumber: string | null;
  progress: number;
  totalCreditsEarned: number | null;
  currentModuleId: string | null;
  status: string;
  createdAt: string;
  group: {
    id: string;
    name: string;
  } | null;
  facilitator: {
    id: string;
    name: string;
  };
}

export interface StudentsResponse {
  data: Student[];
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
  summary?: {
    total: number;
    active: number;
    averageProgress: number;
  };
}

export function useStudents(groupId?: string, status?: string) {
  const params = new URLSearchParams();
  if (groupId && groupId !== 'all') params.append('groupId', groupId);
  if (status && status !== 'all') params.append('status', status);

  const url = `/api/students${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<StudentsResponse>(
    url,
    fetcher,
    swrConfig.students
  );

  return {
    students: data?.data || [],
    totalCount: data?.pagination?.total || 0,
    summary: data?.summary || { total: 0, active: 0, averageProgress: 0 },
    isLoading,
    isError: error,
    mutate,
  };
}
