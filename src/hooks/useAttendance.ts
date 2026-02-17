'use client';

import useSWR from 'swr';
import { swrConfig, fetcher } from '@/lib/swr-config';

export interface Attendance {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
  };
  session: {
    id: string;
    title: string;
    module: string;
    site: {
      id: string;
      name: string;
    };
  };
}

export function useAttendance(sessionId?: string, studentId?: string, date?: string) {
  const params = new URLSearchParams();
  if (sessionId) params.append('sessionId', sessionId);
  if (studentId) params.append('studentId', studentId);
  if (date) params.append('date', date);
  
  const url = `/api/attendance${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<{ data: Attendance[] }>(
    url,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000,
    }
  );

  return {
    attendance: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
