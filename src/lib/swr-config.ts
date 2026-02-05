import { SWRConfiguration } from 'swr';

export const swrConfig = {
  // Dashboard stats - 30 seconds for real-time updates
  dashboardStats: {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  } as SWRConfiguration,

  // Students list - 30 seconds for progress updates
  students: {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  } as SWRConfiguration,

  // Attendance - 15 seconds for live marking
  attendance: {
    refreshInterval: 15000,
    revalidateOnFocus: true,
    dedupingInterval: 3000,
  } as SWRConfiguration,

  // Assessments - 30 seconds
  assessments: {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  } as SWRConfiguration,

  // Curriculum library - 5 minutes (mostly static)
  curriculum: {
    refreshInterval: 300000,
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  } as SWRConfiguration,

  // Lesson planner - 60 seconds
  lessons: {
    refreshInterval: 60000,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  } as SWRConfiguration,

  // Sites - 2 minutes (relatively static)
  sites: {
    refreshInterval: 120000,
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  } as SWRConfiguration,
};

// Default fetcher for SWR
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  
  return res.json();
};
