'use client';

import useSWR from 'swr';
import { swrConfig, fetcher } from '@/lib/swr-config';

export interface Site {
  id: string;
  name: string;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
  status: string;
  _count?: {
    students: number;
    sessions: number;
  };
}

export function useSites(status?: string) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  
  const url = `/api/sites${params.toString() ? `?${params.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<{ data: Site[] }>(
    url,
    fetcher,
    swrConfig.sites
  );

  return {
    sites: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}
