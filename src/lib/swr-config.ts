import { SWRConfiguration } from 'swr';

// Global SWR configuration with optimized caching
export const globalSWRConfig: SWRConfiguration = {
  // Stale-while-revalidate: Show cached data while fetching fresh data
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  
  // Error handling
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // Performance optimizations
  dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
  focusThrottleInterval: 5000, // Throttle revalidation on focus
  
  // Keep previous data while revalidating
  keepPreviousData: true,
};

export const swrConfig = {
  // Dashboard stats - 30 seconds for real-time updates
  dashboardStats: {
    ...globalSWRConfig,
    refreshInterval: 30000,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  } as SWRConfiguration,

  // Students list - 30 seconds for progress updates
  students: {
    ...globalSWRConfig,
    refreshInterval: 30000,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  } as SWRConfiguration,

  // Attendance - 15 seconds for live marking
  attendance: {
    ...globalSWRConfig,
    refreshInterval: 15000,
    revalidateOnFocus: true,
    dedupingInterval: 3000,
  } as SWRConfiguration,

  // Assessments - 30 seconds
  assessments: {
    ...globalSWRConfig,
    refreshInterval: 30000,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  } as SWRConfiguration,

  // Curriculum library - 5 minutes (mostly static)
  curriculum: {
    ...globalSWRConfig,
    refreshInterval: 300000,
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  } as SWRConfiguration,

  // Lesson planner - 60 seconds
  lessons: {
    ...globalSWRConfig,
    refreshInterval: 60000,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  } as SWRConfiguration,

  // Sites - 2 minutes (relatively static)
  sites: {
    ...globalSWRConfig,
    refreshInterval: 120000,
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  } as SWRConfiguration,
};

// Default fetcher for SWR with authentication
export const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const res = await fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  
  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  
  return res.json();
};
