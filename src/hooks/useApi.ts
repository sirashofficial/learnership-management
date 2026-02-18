/**
 * Custom Hook: useApi
 * Provides standardized API request handling, error management, and caching
 * Reduces code duplication across components
 * 
 * IMPORTANT: Uses global caching and request deduplication to prevent:
 * - Duplicate requests from multiple components
 * - Cache loss on re-renders
 * - Wasted bandwidth on identical concurrent requests
 */

import { useState, useCallback, useEffect } from 'react';
import { getApiError } from '@/lib/apiResponseHandler';

interface UseApiOptions {
  cache?: boolean;
  cacheTime?: number;
  retries?: number;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// GLOBAL cache - persists across component re-renders and unmounts
const globalCache = new Map<string, { data: any; timestamp: number }>();

// GLOBAL pending requests - prevents simultaneous duplicate requests
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Hook for handling API requests with minimal boilerplate
 * 
 * Features:
 * - Global caching (survives component unmounts)
 * - Request deduplication (prevents duplicate simultaneous requests)
 * - Automatic retries with exponential backoff
 * - Configurable cache duration
 * 
 * Usage:
 * ```typescript
 * const { data, loading, error, request } = useApi<Group[]>();
 * 
 * useEffect(() => {
 *   request('/api/groups');
 * }, []);
 * ```
 */
export function useApi<T = any>(options: UseApiOptions = {}) {
  const { cache = true, cacheTime = 30000, retries = 1 } = options;
  
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const request = useCallback(
    async (
      url: string,
      fetchOptions?: RequestInit
    ): Promise<T | null> => {
      // Check global cache first
      if (cache) {
        const cached = globalCache.get(url);
        if (cached && Date.now() - cached.timestamp < cacheTime) {
          setState({ data: cached.data, loading: false, error: null });
          return cached.data;
        }
      }

      // Check if this exact request is already pending
      if (pendingRequests.has(url)) {
        try {
          const result = await pendingRequests.get(url);
          setState({ data: result, loading: false, error: null });
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setState({ data: null, loading: false, error: errorMessage });
          return null;
        }
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Create the promise once and store it
      const requestPromise = (async () => {
        let lastError: Error | null = null;
        
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            const response = await fetch(url, {
              credentials: 'include',
              ...fetchOptions,
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const responseData = await response.json();
            const data = responseData.data ?? responseData;

            // Cache the result globally
            if (cache) {
              globalCache.set(url, { data, timestamp: Date.now() });
            }

            return data;
          } catch (error) {
            lastError = error as Error;
            // Continue to next retry
            if (attempt < retries) {
              // Add exponential backoff
              await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, attempt) * 100)
              );
            }
          }
        }

        // All retries failed
        throw lastError || new Error('Unknown error');
      })();

      // Store the pending request to deduplicate
      pendingRequests.set(url, requestPromise);

      try {
        const data = await requestPromise;
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState({ data: null, loading: false, error: errorMessage });
        return null;
      } finally {
        // Clean up pending request after small delay to allow other components to grab it
        setTimeout(() => {
          pendingRequests.delete(url);
        }, 100);
      }
    },
    [cache, cacheTime, retries]
  );

  const clearCache = useCallback((url?: string) => {
    if (url) {
      globalCache.delete(url);
    } else {
      globalCache.clear();
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    request,
    clearCache,
    reset,
  };
}

/**
 * Static method to clear global cache (useful in tests/logout)
 */
export function clearApiCache(url?: string) {
  if (url) {
    globalCache.delete(url);
  } else {
    globalCache.clear();
  }
}

/**
 * Hook for handling POST/PUT requests with form submission
 * 
 * Prevents double-submission and handles errors properly
 * 
 * Usage:
 * ```typescript
 * const { submit, loading, error } = useApiMutation<Group>();
 * 
 * const handleSubmit = async (data) => {
 *   const result = await submit('/api/groups', { method: 'POST', body: JSON.stringify(data) });
 *   if (result) { // success }
 * };
 * ```
 */
export function useApiMutation<T = any>() {
  const [state, setState] = useState<Omit<UseApiState<T>, 'data'>>({
    loading: false,
    error: null,
  });

  const isSubmittingRef = { current: false };

  const submit = useCallback(
    async (url: string, options: RequestInit = {}): Promise<T | null> => {
      // Prevent double-submission
      if (isSubmittingRef.current) {
        return null;
      }

      isSubmittingRef.current = true;
      setState({ loading: true, error: null });

      try {
        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(getApiError(errorData));
        }

        const data = await response.json();
        const result = data.data ?? data;

        setState({ loading: false, error: null });
        
        // Clear relevant cache entries on mutation
        const parsedUrl = new URL(url, window.location.origin);
        globalCache.forEach((value, key) => {
          if (key.startsWith(parsedUrl.pathname)) {
            globalCache.delete(key);
          }
        });
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState({ loading: false, error: errorMessage });
        return null;
      } finally {
        isSubmittingRef.current = false;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null });
    isSubmittingRef.current = false;
  }, []);

  return {
    ...state,
    submit,
    reset,
  };
}
