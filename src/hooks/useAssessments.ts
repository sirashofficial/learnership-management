'use client';

import useSWR from 'swr';
import { swrConfig, fetcher } from '@/lib/swr-config';
import { Assessment } from '@/types';

interface UseAssessmentsOptions {
  studentId?: string;
  groupId?: string;
  result?: string;
  type?: string;
  method?: string;
  moderationStatus?: string;
}

export function useAssessments(options: UseAssessmentsOptions = {}) {
  const params = new URLSearchParams();
  if (options.studentId) params.append('studentId', options.studentId);
  if (options.result) params.append('result', options.result);
  if (options.type) params.append('type', options.type);
  if (options.method) params.append('method', options.method);
  if (options.moderationStatus) params.append('moderationStatus', options.moderationStatus);

  const url = `/api/assessments${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<{ data: Assessment[] }>(
    url,
    fetcher,
    swrConfig.assessments
  );

  return {
    assessments: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
