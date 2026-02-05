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

export function useStudents(groupId?: string, status?: string) {
  const params = new URLSearchParams();
  if (groupId) params.append('groupId', groupId);
  if (status) params.append('status', status);
  
  const url = `/api/students${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<{ data: Student[] }>(
    url,
    fetcher,
    swrConfig.students
  );

  return {
    students: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
