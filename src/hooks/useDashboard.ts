import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Optimized configuration for better performance
const optimizedConfig = {
  revalidateOnFocus: false, // Don't refetch on window focus
  revalidateOnReconnect: false, // Don't refetch on reconnect
  dedupingInterval: 5000, // Dedupe requests within 5 seconds
};

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR('/api/dashboard/stats', fetcher, {
    ...optimizedConfig,
    refreshInterval: 120000, // Reduced to every 2 minutes
  });

  return {
    stats: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useRecentActivity() {
  const { data, error, isLoading } = useSWR('/api/dashboard/recent-activity', fetcher, {
    ...optimizedConfig,
    refreshInterval: 0, // Disable auto-refresh for activity feed
  });

  return {
    activities: data?.data?.activities || [],
    isLoading,
    isError: error,
  };
}

export function useDashboardAlerts() {
  const { data, error, isLoading, mutate } = useSWR('/api/dashboard/alerts', fetcher, {
    ...optimizedConfig,
    refreshInterval: 0, // Disable auto-refresh for alerts
  });

  return {
    alerts: data?.data?.alerts || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useDashboardSchedule() {
  const { data, error, isLoading } = useSWR('/api/dashboard/schedule', fetcher, {
    ...optimizedConfig,
    refreshInterval: 0, // Disable auto-refresh for schedule
  });

  return {
    schedule: data?.data?.schedule || [],
    isLoading,
    isError: error,
  };
}

export function useDashboardCharts(timeRange: string = '30') {
  const { data, error, isLoading } = useSWR(
    `/api/dashboard/charts?range=${timeRange}`,
    fetcher,
    {
      ...optimizedConfig,
      refreshInterval: 0, // Disable auto-refresh for charts
    }
  );

  return {
    attendanceTrend: data?.data?.attendanceTrend || [],
    groupDistribution: data?.data?.groupDistribution || [],
    courseProgress: data?.data?.courseProgress || [],
    isLoading,
    isError: error,
  };
}

export function useGlobalSearch(query: string, filter: string = 'all') {
  const shouldFetch = query && query.length > 0;
  
  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/search?q=${encodeURIComponent(query)}&filter=${filter}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 500,
    }
  );

  return {
    results: data?.data?.results || [],
    total: data?.data?.total || 0,
    isLoading: shouldFetch ? isLoading : false,
    isError: error,
  };
}
