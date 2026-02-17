// API Response Caching Utility
// Provides consistent cache headers for API routes

export const CacheControl = {
  // No caching - for write operations and sensitive data
  noCache: {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },

  // Short cache (30 seconds) - for frequently changing data
  short: {
    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
  },

  // Medium cache (5 minutes) - for moderately changing data
  medium: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  },

  // Long cache (1 hour) - for slowly changing data
  long: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
  },

  // Very long cache (1 day) - for static/rarely changing data
  veryLong: {
    'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
  },
} as const;

/**
 * Apply cache headers to a NextResponse
 * @param response - The NextResponse object
 * @param policy - Cache policy to apply
 * @returns The response with cache headers applied
 */
export function withCache(
  response: Response,
  policy: keyof typeof CacheControl = 'noCache'
): Response {
  const headers = new Headers(response.headers);
  
  const cacheHeaders = CacheControl[policy];
  Object.entries(cacheHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Cache policy recommendations by endpoint type
 */
export const CachePolicies = {
  // Write operations (POST, PUT, DELETE, PATCH)
  write: 'noCache',
  
  // Authentication/user data
  auth: 'noCache',
  
  // Real-time data (attendance, live stats)
  realtime: 'short',
  
  // Dashboard stats
  dashboard: 'short',
  
  // Student/group lists
  lists: 'medium',
  
  // Individual records
  records: 'medium',
  
  // Reports/exports
  reports: 'medium',
  
  // Curriculum/module data
  curriculum: 'long',
  
  // Static configuration
  config: 'veryLong',
} as const;
