/**
 * Custom Hook: useWindowSize
 * Tracks window and viewport information
 */

import { useState, useEffect, useCallback } from 'react';
import { useThrottle } from './useDebounce';

export interface WindowSize {
  width: number;
  height: number;
}

/**
 * Hook for tracking window size
 * 
 * Usage:
 * ```typescript
 * const { width, height } = useWindowSize();
 * 
 * return <div>{width > 768 ? 'Desktop' : 'Mobile'}</div>;
 * ```
 */
export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const throttledUpdate = useThrottle(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, 150);

  useEffect(() => {
    window.addEventListener('resize', throttledUpdate);
    return () => window.removeEventListener('resize', throttledUpdate);
  }, [throttledUpdate]);

  return size;
}

/**
 * Hook for detecting viewport width breakpoint
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoints for responsive design
 */
export const breakpoints = {
  xs: '(max-width: 320px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
};

/**
 * Hook for common breakpoint queries
 * 
 * Usage:
 * ```typescript
 * const { isMobile, isTablet, isDesktop } = useBreakpoint();
 * ```
 */
export function useBreakpoint() {
  return {
    isXs: useMediaQuery(breakpoints.xs),
    isSm: useMediaQuery(breakpoints.sm),
    isMd: useMediaQuery(breakpoints.md),
    isLg: useMediaQuery(breakpoints.lg),
    isXl: useMediaQuery(breakpoints.xl),
    is2xl: useMediaQuery(breakpoints['2xl']),
    isMobile: useMediaQuery('(max-width: 767px)'),
    isTablet: useMediaQuery('(min-width: 768px) and (max-width: 1023px)'),
    isDesktop: useMediaQuery('(min-width: 1024px)'),
  };
}

/**
 * Hook for detecting scroll position and direction
 */
export interface ScrollPosition {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right' | null;
}

export function useScroll(): ScrollPosition {
  const [scroll, setScroll] = useState<ScrollPosition>({
    x: 0,
    y: 0,
    direction: null,
  });

  const throttledScroll = useThrottle(() => {
    setScroll((prev) => {
      const x = window.scrollX;
      const y = window.scrollY;

      let direction: 'up' | 'down' | 'left' | 'right' | null = null;
      if (y > prev.y) direction = 'down';
      if (y < prev.y) direction = 'up';
      if (x > prev.x) direction = 'right';
      if (x < prev.x) direction = 'left';

      return { x, y, direction };
    });
  }, 100);

  useEffect(() => {
    window.addEventListener('scroll', throttledScroll);
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [throttledScroll]);

  return scroll;
}

/**
 * Hook for detecting when element becomes visible in viewport
 */
export interface UseIntersectionOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
}

export function useIntersection(
  ref: React.RefObject<HTMLElement>,
  options: UseIntersectionOptions = {}
): IntersectionObserverEntry | null {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setEntry(entry);
    }, {
      threshold: 0.1,
      ...options,
    });

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return entry;
}

/**
 * Hook for detecting visibility of multiple elements
 */
export function useIntersectionMany(
  refs: React.RefObject<HTMLElement>[],
  options: UseIntersectionOptions = {}
): Map<HTMLElement, IntersectionObserverEntry> {
  const [entries, setEntries] = useState<Map<HTMLElement, IntersectionObserverEntry>>(
    new Map()
  );

  useEffect(() => {
    const elementsToObserve = refs.filter((ref) => ref.current).map((ref) => ref.current);

    if (elementsToObserve.length === 0) return;

    const observer = new IntersectionObserver((intersectionEntries) => {
      setEntries((prev) => {
        const newEntries = new Map(prev);
        intersectionEntries.forEach((entry) => {
          newEntries.set(entry.target as HTMLElement, entry);
        });
        return newEntries;
      });
    }, {
      threshold: 0.1,
      ...options,
    });

    elementsToObserve.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [refs, options]);

  return entries;
}

/**
 * Hook for detecting element focus outside
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  callback: (event: MouseEvent) => void
) {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback(event);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, callback]);
}

/**
 * Hook for focus trap (keeping focus within an element)
 */
export function useFocusTrap(
  ref: React.RefObject<HTMLElement>,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || !ref.current) return;

    const element = ref.current;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, enabled]);
}

/**
 * Hook for keyboard shortcuts
 */
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

export function useKeyboardShortcut(
  shortcut: KeyboardShortcut,
  callback: (e: KeyboardEvent) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const matches =
        e.key.toLowerCase() === shortcut.key.toLowerCase() &&
        e.ctrlKey === (shortcut.ctrl ?? false) &&
        e.shiftKey === (shortcut.shift ?? false) &&
        e.altKey === (shortcut.alt ?? false) &&
        e.metaKey === (shortcut.meta ?? false);

      if (matches) {
        e.preventDefault();
        callback(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut, callback, enabled]);
}
