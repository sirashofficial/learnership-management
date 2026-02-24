import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook for lightweight dashboard summary API
 * Returns 10 key metrics instead of loading all assessments
 * Revalidates every 30 seconds for near real-time updates
 */
export function useDashboardLite() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/dashboard/summary/lite',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    summary: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for groups summary API
 * Returns progress stats for each group
 */
export function useGroupsSummary() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/groups/summary',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 60000, // Refresh every 60 seconds
    }
  );

  return {
    groups: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for students summary API with optional groupId filter and pagination
 * Returns paginated student summaries
 */
export function useStudentsSummary(groupId?: string, page: number = 1, limit: number = 25) {
  const params = new URLSearchParams();
  if (groupId && groupId !== 'all') params.append('groupId', groupId);
  params.append('page', String(page));
  params.append('limit', String(limit));
  
  const url = `/api/students/summary?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      refreshInterval: 60000, // Refresh every 60 seconds
    }
  );

  return {
    students: data?.data || [],
    pagination: data?.pagination || { page: 1, limit, total: 0, totalPages: 0, hasMore: false },
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook for paginated assessment details
 * Only load when user clicks "View Details"
 */
export function useAssessmentDetails(
  studentId?: string,
  groupId?: string,
  page: number = 1,
  pageSize: number = 50
) {
  let url = '/api/assessments/detail?';
  const params = [];
  
  if (studentId) params.push(`studentId=${studentId}`);
  if (groupId) params.push(`groupId=${groupId}`);
  params.push(`page=${page}&pageSize=${pageSize}`);
  
  url += params.join('&');

  const { data, error, isLoading, mutate } = useSWR(
    studentId || groupId ? url : null, // Only fetch if we have a filter
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    assessments: data?.assessments || [],
    pagination: data?.pagination || { page: 1, pageSize, total: 0, totalPages: 0, hasMore: false },
    isLoading,
    isError: error,
    mutate,
  };
}
