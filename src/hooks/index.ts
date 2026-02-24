/**
 * Custom Hooks Catalog
 * 
 * This file documents all available custom hooks in the project.
 * Import hooks from this file for consistency and discoverability.
 */

// API and Data Fetching
export { useApi, useApiMutation } from './useApi';
export type { UseApiOptions } from './useApi';

export { useAsync, useAsyncMany, usePaginatedAsync } from './useAsync';
export type {
  UseAsyncState,
  UsePaginatedAsyncOptions,
  UsePaginatedAsyncState,
} from './useAsync';

// Form Management
export { useFormState } from './useFormState';
export type { FormError, ValidationRule, ValidationRules } from './useFormState';

// Performance Optimization
export {
  useDebounce,
  useDebouncedCallback,
  useDebouncedCallbackAdvanced,
  useThrottle,
} from './useDebounce';
export type { DebouncedCallbackOptions } from './useDebounce';

// Storage
export { useLocalStorage, useSessionStorage } from './useLocalStorage';
export type { UseLocalStorageOptions } from './useLocalStorage';

// UI State Management
export {
  useNotification,
  useModal,
  useDisclosure,
  useLoading,
  useSubmit,
} from './useUI';
export type { NotificationType, Notification, UseDisclosureOptions, UseSubmitOptions } from './useUI';

// Value Tracking
export {
  usePrevious,
  useValueChange,
  useOnValueChange,
  useValueDiff,
  useHistory,
  useWhenFirstTrue,
} from './usePrevious';
export type { ValueDiff } from './usePrevious';

// Window & Viewport
export {
  useWindowSize,
  useMediaQuery,
  useBreakpoint,
  useScroll,
  useIntersection,
  useIntersectionMany,
  useClickOutside,
  useFocusTrap,
  useKeyboardShortcut,
  breakpoints,
} from './useWindowSize';
export type { WindowSize, ScrollPosition, UseIntersectionOptions, KeyboardShortcut } from './useWindowSize';

// Domain-Specific Hooks
export { useAI } from './useAI';
export { useAssessments } from './useAssessments';
export { useAssessmentStats } from './useAssessmentStats';
export { useAttendance } from './useAttendance';
export { useCurriculum } from './useCurriculum';
export { useDashboardStats, useRecentActivity, useDashboardAlerts, useDashboardSchedule, useDashboardCharts } from './useDashboard';
export { useLessons } from './useLessons';
export { useProgress } from './useProgress';
export { useSites } from './useSites';
export { useStudents } from './useStudents';

/**
 * HOOKS USAGE GUIDE
 * 
 * DATA FETCHING & API:
 * ====================
 * 
 * useApi<T>()
 * - Standard API requests with caching and retries
 * - Best for: GET requests, cached data
 * - Example: const { data, loading, error } = useApi<User[]>();
 * 
 * useApiMutation<T>()
 * - POST/PUT/DELETE requests
 * - Best for: Form submissions, updates
 * - Example: const { submit, loading } = useApiMutation<User>();
 * 
 * useAsync<T>(fn, immediate)
 * - Generic async operations with lifecycle
 * - Best for: Complex async logic, non-HTTP operations
 * - Example: const { data, status } = useAsync(() => fetchData());
 * 
 * FORM HANDLING:
 * ==============
 * 
 * useFormState<T>(options)
 * - Complete form management with validation
 * - Best for: Multi-field forms with validation rules
 * - Example: const form = useFormState({ initialValues, validate, onSubmit });
 * 
 * PERFORMANCE:
 * ============
 * 
 * useDebounce<T>(value, delay)
 * - Debounce a value (useful for search inputs)
 * - Best for: Search, autocomplete
 * - Example: const debounced = useDebounce(searchTerm, 500);
 * 
 * useDebouncedCallback<T>(fn, delay)
 * - Debounce a function
 * - Best for: Handler functions
 * - Example: const search = useDebouncedCallback(handleSearch, 500);
 * 
 * useThrottle<T>(fn, delay)
 * - Throttle a function
 * - Best for: Scroll/resize events
 * - Example: const resize = useThrottle(handleResize, 300);
 * 
 * STORAGE:
 * ========
 * 
 * useLocalStorage<T>(key, initialValue)
 * - Persistent state with localStorage
 * - Best for: User preferences, theme, auth tokens
 * - Example: const [isDark, setIsDark] = useLocalStorage('darkMode', false);
 * 
 * useSessionStorage<T>(key, initialValue)
 * - Temporary state cleared on tab close
 * - Best for: Temporary form state, session data
 * - Example: const [draft, setDraft] = useSessionStorage('draft', '');
 * 
 * BUSINESS LOGIC:
 * ===============
 * 
 * Domain-specific hooks handle data for each feature:
 * 
 * - useStudents() - Student management
 * - useGroups() - Group management
 * - useLessons() - Lesson content
 * - useAssessments() - Assessment handling
 * - useAttendance() - Attendance tracking
 * - useCurriculum() - Curriculum data
 * - useDashboard() - Dashboard data
 * - useAI() - AI features
 * 
 * COMPOSITION EXAMPLE:
 * ====================
 * 
 * ```typescript
 * import {
 *   useFormState,
 *   useApiMutation,
 *   useDebounce,
 *   useLocalStorage,
 * } from '@/hooks';
 * 
 * export function UserForm() {
 *   const [lastSaved] = useLocalStorage('lastSaved', null);
 *   const { submit, loading, error } = useApiMutation<User>();
 *   
 *   const form = useFormState({
 *     initialValues: { name: '', email: '' },
 *     validate: { email: (v) => v.includes('@') ? true : 'Invalid' },
 *     onSubmit: async (values) => {
 *       await submit('/api/users', {
 *         method: 'POST',
 *         body: JSON.stringify(values),
 *       });
 *     },
 *   });
 *   
 *   const debouncedName = useDebounce(form.values.name, 300);
 *   
 *   return (
 *     <form onSubmit={form.handleSubmit}>
 *       <input {...form.getFieldProps('name')} />
 *       {error && <div>{error}</div>}
 *       <button disabled={loading}>Save</button>
 *     </form>
 *   );
 * }
 * ```
 */
