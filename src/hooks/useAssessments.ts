'use client';

import useSWR from 'swr';
import { swrConfig, fetcher } from '@/lib/swr-config';

export interface Assessment {
  id: string;
  unitStandard: string;
  module: string;
  type: string; // FORMATIVE | SUMMATIVE | INTEGRATED
  method: string; // KNOWLEDGE | PRACTICAL | OBSERVATION | PORTFOLIO
  result: string | null;
  score: number | null;
  assessedDate: string | null;
  dueDate: string;
  notes: string | null;
  feedback: string | null;
  moderationStatus: string;
  moderatedBy: string | null;
  moderatedDate: string | null;
  moderationNotes: string | null;
  attemptNumber: number;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentId: string;
    group: {
      id: string;
      name: string;
    } | null;
  };
  unitStandardRef: {
    id: string;
    code: string;
    title: string;
    credits: number;
  } | null;
}

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
  if (options.groupId) params.append('groupId', options.groupId);
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
