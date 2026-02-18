/**
 * Custom Hook: usePrevious
 * Tracks previous values and comparisons
 */

import { useRef, useEffect } from 'react';

/**
 * Hook for tracking previous value
 * 
 * Usage:
 * ```typescript
 * const count = useState(0)[0];
 * const prevCount = usePrevious(count);
 * 
 * return <div>{count} was {prevCount}</div>;
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook for detecting value changes
 * 
 * Usage:
 * ```typescript
 * const { changed, previous, current } = useValueChange(count);
 * 
 * if (changed) console.log('Value changed from', previous, 'to', current);
 * ```
 */
export function useValueChange<T>(
  value: T,
  isEqual: (a: T, b: T) => boolean = (a, b) => a === b
) {
  const prevRef = useRef<T>();
  const changedRef = useRef(false);

  useEffect(() => {
    if (!isEqual(value, prevRef.current as T)) {
      changedRef.current = true;
      prevRef.current = value;
    }
  }, [value, isEqual]);

  return {
    changed: changedRef.current,
    previous: prevRef.current,
    current: value,
  };
}

/**
 * Hook for detecting when value changes to a specific value
 */
export function useOnValueChange<T>(
  value: T,
  callback: (prev: T | undefined, curr: T) => void,
  deps: any[] = []
) {
  const prevRef = useRef<T>();

  useEffect(() => {
    if (prevRef.current !== value) {
      callback(prevRef.current, value);
      prevRef.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ...deps]);
}

/**
 * Hook for comparing two values and getting their difference
 */
export interface ValueDiff<T> {
  changed: boolean;
  added: Partial<T>;
  removed: Partial<T>;
  updated: Partial<T>;
}

export function useValueDiff<T extends Record<string, any>>(
  value: T
): ValueDiff<T> {
  const prevRef = useRef<T>();

  const diff: ValueDiff<T> = {
    changed: false,
    added: {},
    removed: {},
    updated: {},
  };

  if (!prevRef.current) {
    prevRef.current = value;
    return diff;
  }

  const prev = prevRef.current;
  prevRef.current = value;

  // Check for removed or updated fields
  Object.keys(prev).forEach((key) => {
    if (!(key in value)) {
      (diff.removed as any)[key] = (prev as any)[key];
      diff.changed = true;
    } else if ((prev as any)[key] !== (value as any)[key]) {
      (diff.updated as any)[key] = (value as any)[key];
      diff.changed = true;
    }
  });

  // Check for added fields
  Object.keys(value).forEach((key) => {
    if (!(key in prev)) {
      (diff.added as any)[key] = (value as any)[key];
      diff.changed = true;
    }
  });

  return diff;
}

/**
 * Hook for tracking value history
 * 
 * Usage:
 * ```typescript
 * const { history, current, undo, redo, clear } = useHistory(initialValue);
 * 
 * const handleChange = (newValue) => {
 *   history.push(newValue);
 * };
 * ```
 */
export interface UseHistoryOptions {
  maxSize?: number;
}

export function useHistory<T>(
  initialValue: T,
  options: UseHistoryOptions = {}
) {
  const { maxSize = 100 } = options;

  const historyRef = useRef<T[]>([initialValue]);
  const currentIndexRef = useRef(0);

  const push = (value: T) => {
    // Remove any redo history
    historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);

    // Add new value
    historyRef.current.push(value);

    // Limit history size
    if (historyRef.current.length > maxSize) {
      historyRef.current.shift();
    } else {
      currentIndexRef.current++;
    }
  };

  const undo = (steps: number = 1) => {
    const newIndex = Math.max(0, currentIndexRef.current - steps);
    currentIndexRef.current = newIndex;
    return historyRef.current[newIndex];
  };

  const redo = (steps: number = 1) => {
    const newIndex = Math.min(
      historyRef.current.length - 1,
      currentIndexRef.current + steps
    );
    currentIndexRef.current = newIndex;
    return historyRef.current[newIndex];
  };

  const go = (index: number) => {
    const newIndex = Math.max(0, Math.min(historyRef.current.length - 1, index));
    currentIndexRef.current = newIndex;
    return historyRef.current[newIndex];
  };

  const clear = () => {
    historyRef.current = [initialValue];
    currentIndexRef.current = 0;
  };

  return {
    history: historyRef.current,
    current: historyRef.current[currentIndexRef.current],
    currentIndex: currentIndexRef.current,
    push,
    undo,
    redo,
    go,
    clear,
    canUndo: currentIndexRef.current > 0,
    canRedo: currentIndexRef.current < historyRef.current.length - 1,
  };
}

/**
 * Hook for tracking when a value first becomes true
 */
export function useWhenFirstTrue(value: boolean, callback: () => void) {
  const hasCalledRef = useRef(false);

  useEffect(() => {
    if (value && !hasCalledRef.current) {
      hasCalledRef.current = true;
      callback();
    }
  }, [value, callback]);

  useEffect(() => {
    if (!value) {
      hasCalledRef.current = false;
    }
  }, [value]);
}
