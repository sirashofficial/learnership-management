'use client';

import useSWR from 'swr';
import { swrConfig, fetcher } from '@/lib/swr-config';

export interface AssessmentStats {
  total: number;
  pending: number;
  completed: number;
  competent: number;
  notYetCompetent: number;
  overdue: number;
  pendingModeration: number;
  byType: {
    formative: number;
    summative: number;
  };
  byMethod: Record<string, number>;
}

export function useAssessmentStats(studentId?: string, groupId?: string) {
  const params = new URLSearchParams();
  if (studentId) params.append('studentId', studentId);
  if (groupId) params.append('groupId', groupId);
  
  const url = `/api/assessments/stats${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<{ data: AssessmentStats }>(
    url,
    fetcher,
    swrConfig.assessments
  );

  return {
    stats: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}
