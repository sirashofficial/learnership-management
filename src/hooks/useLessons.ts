'use client';

import useSWR from 'swr';
import { swrConfig, fetcher } from '@/lib/swr-config';

export interface LessonPlan {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  venue: string | null;
  objectives: string | null;
  materials: string | null;
  activities: string | null;
  notes: string | null;
  aiGenerated: boolean;
  module: {
    id: string;
    code: string;
    name: string;
  };
  facilitator: {
    id: string;
    name: string;
  };
  site: {
    id: string;
    name: string;
  } | null;
}

export function useLessons(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  
  const url = `/api/lessons${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<{ data: LessonPlan[] }>(
    url,
    fetcher,
    swrConfig.lessons
  );

  return {
    lessons: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
