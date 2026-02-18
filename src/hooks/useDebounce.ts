/**
 * Custom Hook: useDebounce
 * Debounces values and callbacks
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to debounce a value.
 * Useful for search inputs, avoiding rapid API calls
 * 
 * Usage:
 * ```typescript
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // This runs 500ms after user stops typing
 *   search(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to debounce a callback function
 * 
 * Usage:
 * ```typescript
 * const debouncedSearch = useDebouncedCallback(
 *   (term) => apiSearch(term),
 *   500
 * );
 * 
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Advanced debounce hook with cancel and immediate options
 */
export interface DebouncedCallbackOptions {
  immediate?: boolean;
  maxWait?: number;
}

export function useDebouncedCallbackAdvanced<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
  options: DebouncedCallbackOptions = {}
): [(...args: Parameters<T>) => void, () => void, () => void] {
  const { immediate = false, maxWait } = options;

  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCallRef = useRef<number>(0);

  const callFunctionRef = useCallback((...args: Parameters<T>) => {
    callback(...args);
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      // Clear existing timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
      }

      // Call immediately if specified and enough time has passed
      if (immediate && timeSinceLastCall >= delay) {
        callFunctionRef(...args);
        lastCallRef.current = now;
        return;
      }

      // Schedule the callback
      timeoutRef.current = setTimeout(() => {
        callFunctionRef(...args);
        lastCallRef.current = Date.now();
      }, delay);

      // Enforce maxWait if specified
      if (maxWait) {
        maxWaitTimeoutRef.current = setTimeout(() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          callFunctionRef(...args);
          lastCallRef.current = Date.now();
        }, maxWait);
      }
    },
    [delay, maxWait, immediate, callFunctionRef]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
    }
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
    }
    // Note: We'd need to track args to flush properly
    // This is a simplified version
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return [debouncedCallback, cancel, flush];
}

/**
 * Hook for throttling - executes callback at most once per delay
 * Useful for scroll/resize events
 * 
 * Usage:
 * ```typescript
 * const throttledResize = useThrottle(
 *   () => updateLayout(),
 *   500
 * );
 * 
 * useEffect(() => {
 *   window.addEventListener('resize', throttledResize);
 *   return () => window.removeEventListener('resize', throttledResize);
 * }, [throttledResize]);
 * ```
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCallRef.current >= delay) {
        callback(...args);
        lastCallRef.current = now;
      } else {
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Schedule callback for when delay has passed
        const remaining = delay - (now - lastCallRef.current);
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastCallRef.current = Date.now();
        }, remaining);
      }
    },
    [callback, delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}
