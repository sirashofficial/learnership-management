/**
 * Custom Hook: useAsync
 * Manages async operations with loading, error, and success states
 */

import { useState, useEffect, useCallback } from 'react';

type UseAsyncStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseAsyncState<T> {
  status: UseAsyncStatus;
  data: T | null;
  error: Error | null;
}

interface UseAsyncOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

/**
 * Hook for managing async operations
 * 
 * Usage:
 * ```typescript
 * const { data, status, error } = useAsync(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     return response.json();
 *   },
 *   []
 * );
 * ```
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true,
  options: UseAsyncOptions = {}
): UseAsyncState<T> & { execute: () => Promise<void> } {
  const { onSuccess, onError, onSettled } = options;

  const [state, setState] = useState<UseAsyncState<T>>({
    status: 'idle',
    data: null,
    error: null,
  });

  // Use a ref to track if component is still mounted
  const isMountedRef = { current: true };

  const execute = useCallback(async () => {
    setState({ status: 'pending', data: null, error: null });

    try {
      const response = await asyncFunction();
      if (isMountedRef.current) {
        setState({ status: 'success', data: response, error: null });
        onSuccess?.(response);
      }
    } catch (error) {
      if (isMountedRef.current) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ status: 'error', data: null, error: err });
        onError?.(err);
      }
    } finally {
      if (isMountedRef.current) {
        onSettled?.();
      }
    }
  }, [asyncFunction, onSuccess, onError, onSettled]);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [execute, immediate]);

  return { ...state, execute };
}

/**
 * Hook for managing multiple async operations
 * 
 * Usage:
 * ```typescript
 * const results = useAsyncMany([
 *   () => fetchGroups(),
 *   () => fetchUsers(),
 *   () => fetchCourses(),
 * ]);
 * ```
 */
export function useAsyncMany<T extends readonly unknown[]>(
  asyncFunctions: { [K in keyof T]: () => Promise<T[K]> },
  immediate: boolean = true
): UseAsyncState<T[]> & { execute: () => Promise<void> } {
  const [state, setState] = useState<UseAsyncState<T[]>>({
    status: 'idle',
    data: null,
    error: null,
  });

  const isMountedRef = { current: true };

  const execute = useCallback(async () => {
    setState({ status: 'pending', data: null, error: null });

    try {
      const results = await Promise.all(
        asyncFunctions.map((fn) => fn())
      );

      if (isMountedRef.current) {
        setState({ status: 'success', data: results as unknown as T[], error: null });
      }
    } catch (error) {
      if (isMountedRef.current) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ status: 'error', data: null, error: err });
      }
    }
  }, [asyncFunctions]);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [execute, immediate]);

  return { ...state, execute };
}

/**
 * Hook for managing paginated async data
 */
export interface UsePaginatedAsyncOptions extends UseAsyncOptions {
  pageSize?: number;
}

export interface UsePaginatedAsyncState<T> extends UseAsyncState<T[]> {
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalCount?: number;
}

export function usePaginatedAsync<T>(
  asyncFunction: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
  pageSize: number = 20,
  options: UsePaginatedAsyncOptions = {}
): UsePaginatedAsyncState<T> & { goToPage: (page: number) => void; nextPage: () => void } {
  const { onSuccess, onError, onSettled, pageSize: initialPageSize = 20 } = options;

  const [page, setPage] = useState(1);
  const [state, setState] = useState<Omit<UsePaginatedAsyncState<T>, 'page' | 'pageSize' | 'hasMore' | 'totalCount'>>({
    status: 'idle',
    data: null,
    error: null,
  });
  const [totalCount, setTotalCount] = useState<number | undefined>();

  const isMountedRef = { current: true };

  const execute = useCallback(async (pageNum: number) => {
    setState((prev) => ({ ...prev, status: 'pending' }));

    try {
      const response = await asyncFunction(pageNum, pageSize);
      if (isMountedRef.current) {
        setState({ status: 'success', data: response.data, error: null });
        setTotalCount(response.total);
        onSuccess?.(response.data);
      }
    } catch (error) {
      if (isMountedRef.current) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ status: 'error', data: null, error: err });
        onError?.(err);
      }
    } finally {
      if (isMountedRef.current) {
        onSettled?.();
      }
    }
  }, [asyncFunction, pageSize, onSuccess, onError, onSettled]);

  useEffect(() => {
    execute(page);
  }, [page, execute]);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const hasMore = totalCount
    ? page * pageSize < totalCount
    : state.data?.length === pageSize;

  return {
    ...state,
    page,
    pageSize,
    hasMore,
    totalCount,
    goToPage,
    nextPage,
  };
}
