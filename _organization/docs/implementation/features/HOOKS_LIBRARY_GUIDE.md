# Custom Hooks Library Guide

## Overview

This project uses a comprehensive collection of custom React hooks that reduce code duplication and provide consistent patterns across the application. All hooks are located in `/src/hooks/` and can be imported from the index file.

```typescript
import { 
  useApi, 
  useFormState, 
  useDebounce,
  useLocalStorage,
  // ... more hooks
} from '@/hooks';
```

---

## API & Data Fetching

### `useApi<T>(options?)`

Handles GET requests with built-in caching and retry logic.

```typescript
// Simple usage
const { data, loading, error, request } = useApi<User[]>();

useEffect(() => {
  request('/api/users');
}, []);

// With caching options
const { data } = useApi<Product>({
  cache: true,           // Enable caching (default: true)
  cacheTime: 30000,      // Cache duration in ms (default: 30s)
  retries: 2,            // Number of retries (default: 1)
});
```

**When to use:**
- GET requests
- Data that can be cached
- Automatic retry on failure

---

### `useApiMutation<T>()`

Handles POST, PUT, DELETE requests - ideal for forms and data mutations.

```typescript
const { submit, loading, error } = useApiMutation<User>();

const handleSubmit = async (data) => {
  const result = await submit('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (result) {
    // Success - result is the response data
  }
};
```

**When to use:**
- Form submissions
- Creating/updating/deleting resources
- Non-GET operations

---

### `useAsync<T>(asyncFn, immediate?, options?)`

Generic async operation handler for any Promise-based operation.

```typescript
const { data, status, error, execute } = useAsync(
  async () => {
    const res = await fetch('/api/data');
    return res.json();
  },
  true  // immediate: run on mount
);

// Statuses: 'idle' | 'pending' | 'success' | 'error'
if (status === 'success') {
  console.log(data);
}

// Manually trigger
await execute();
```

**When to use:**
- Non-HTTP async operations
- Complex async logic
- Manual trigger requirements

---

### `usePaginatedAsync<T>(asyncFn, pageSize?, options?)`

Handles paginated data efficiently.

```typescript
const { data, page, hasMore, goToPage, nextPage } = usePaginatedAsync(
  async (page, pageSize) => {
    const res = await fetch(`/api/users?page=${page}&limit=${pageSize}`);
    return res.json();
  },
  20  // Page size
);

// Navigate pages
goToPage(5);      // Go to page 5
nextPage();       // Go to next page
```

---

## Form Management

### `useFormState<T>(options)`

Complete form state management with validation.

```typescript
const form = useFormState({
  initialValues: {
    email: '',
    password: '',
    remember: false,
  },
  
  // Validation rules
  validate: {
    email: (value) => 
      !value.includes('@') ? 'Invalid email' : true,
    password: (value) => 
      value.length < 8 ? 'Min 8 characters' : true,
  },
  
  // Handle submission
  onSubmit: async (values) => {
    await api.submitForm(values);
  },
  
  onSuccess: () => {
    notify({ type: 'success', title: 'Form submitted!' });
  },
});

// Use in JSX
<form onSubmit={form.handleSubmit}>
  <input {...form.getFieldProps('email')} />
  
  {/* Error message only shown after blur */}
  {form.touched.has('email') && form.errors.get('email') && (
    <span>{form.errors.get('email')}</span>
  )}
  
  <button disabled={!form.isValid || form.isSubmitting}>
    {form.isSubmitting ? 'Saving...' : 'Save'}
  </button>
</form>
```

**Key features:**
- Multi-field validation
- Touch tracking (show errors only after interaction)
- Dirty state detection
- Field-level error management

---

## Performance Optimization

### `useDebounce<T>(value, delay?)`

Debounces a value - waits for user to stop before triggering.

```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedTerm = useDebounce(searchTerm, 500);

useEffect(() => {
  // Only runs 500ms after user stops typing
  apiSearch(debouncedTerm);
}, [debouncedTerm]);
```

**Use for:**
- Search inputs
- Auto-save
- Real-time filtering

---

### `useDebouncedCallback<T>(callback, delay?)`

Debounces a callback function.

```typescript
const debouncedSearch = useDebouncedCallback(
  (term) => api.search(term),
  500
);

<input onChange={(e) => debouncedSearch(e.target.value)} />
```

---

### `useThrottle<T>(callback, delay?)`

Throttles function calls - ensures max frequency of execution.

```typescript
const throttledResize = useThrottle(() => {
  updateLayout();
}, 300);

useEffect(() => {
  window.addEventListener('resize', throttledResize);
  return () => window.removeEventListener('resize', throttledResize);
}, [throttledResize]);
```

**Use for:**
- Scroll events
- Resize events
- Any high-frequency events

---

## Storage

### `useLocalStorage<T>(key, initialValue, options?)`

Persists state to localStorage across browser sessions.

```typescript
// Simple usage
const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false);

// Complex objects
const [user, setUser, clearUser] = useLocalStorage('user', null);

// Custom serialization
const [config, setConfig] = useLocalStorage(
  'config',
  defaultConfig,
  {
    serializer: (v) => JSON.stringify(v),
    deserializer: (v) => JSON.parse(v),
  }
);
```

**Returns:** `[value, setter, remover]`

---

### `useSessionStorage<T>(key, initialValue, options?)`

Like localStorage but cleared when tab closes.

```typescript
const [draftText, setDraftText] = useSessionStorage('draft', '');
```

---

## UI State Management

### `useNotification()`

Toast notification management.

```typescript
const { notify, notifications, dismiss } = useNotification();

// Show notification
const id = notify({
  type: 'success',        // 'success' | 'error' | 'warning' | 'info'
  title: 'Success!',
  message: 'Operation completed',
  duration: 4000,         // Auto-dismiss after 4s
  dismissible: true,      // Allow manual close
});

// Manually dismiss
dismiss(id);

// Dismiss all
dismissAll();
```

---

### `useModal(initialState?)`

Simple modal/dialog state.

```typescript
const { isOpen, open, close, toggle } = useModal(false);

return (
  <>
    <button onClick={open}>Open Dialog</button>
    {isOpen && <Dialog onClose={close} />}
  </>
);
```

---

### `useDisclosure(initialState?, options?)`

Enhanced modal with callbacks.

```typescript
const { isOpen, onOpen, onClose, onToggle } = useDisclosure(false, {
  onOpen: () => console.log('Opened'),
  onClose: () => console.log('Closed'),
});
```

---

### `useLoading(initialState?)`

Loading state with helper.

```typescript
const { isLoading, startLoading, stopLoading, withLoading } = useLoading();

// Manual control
startLoading();
// ... do work
stopLoading();

// Or use helper
await withLoading(async () => {
  await api.submit(data);
});
```

---

### `useSubmit(onSubmit, options?)`

Form submission with error handling.

```typescript
const { submit, isSubmitting, error, clearError } = useSubmit(
  async () => {
    await api.submitForm(values);
  },
  {
    onSuccess: () => notify({ type: 'success', title: 'Saved!' }),
    onError: (err) => console.error(err),
  }
);

<form onSubmit={submit}>
  {error && <ErrorAlert>{error.message}</ErrorAlert>}
  <button disabled={isSubmitting}>Save</button>
</form>
```

---

## Value Tracking

### `usePrevious<T>(value)`

Tracks the previous value of a variable.

```typescript
const count = 5;
const prevCount = usePrevious(count);

// On render: prevCount might be 4, count is 5
```

---

### `useValueChange<T>(value, isEqual?)`

Detects when value changes.

```typescript
const { changed, previous, current } = useValueChange(userId);

if (changed) {
  console.log(`User changed from ${previous} to ${current}`);
}
```

---

### `useHistory<T>(initialValue, options?)`

Undo/redo functionality.

```typescript
const history = useHistory('initial text', { maxSize: 50 });

history.push('new text');   // Add to history
history.undo();              // Go back
history.redo();              // Go forward
history.go(5);               // Jump to index 5
history.clear();             // Clear history

// Check if possible
if (history.canUndo) { /* ... */ }
if (history.canRedo) { /* ... */ }
```

---

## Window & Viewport

### `useWindowSize()`

Track window dimensions.

```typescript
const { width, height } = useWindowSize();

return <div>{width > 768 ? 'Desktop' : 'Mobile'}</div>;
```

---

### `useMediaQuery(query)`

Detect media query matches.

```typescript
const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
const isLandscape = useMediaQuery('(orientation: landscape)');
```

---

### `useBreakpoint()`

Predefined Tailwind breakpoint detection.

```typescript
const { isMobile, isTablet, isDesktop, isMd, isLg } = useBreakpoint();

// Returns true/false for each breakpoint
```

---

### `useScroll()`

Track scroll position and direction.

```typescript
const { x, y, direction } = useScroll();

// direction: 'up' | 'down' | 'left' | 'right' | null
```

---

### `useIntersection(ref, options?)`

Detect when element enters viewport.

```typescript
const ref = useRef<HTMLDivElement>(null);
const entry = useIntersection(ref);

return (
  <div ref={ref}>
    {entry?.isIntersecting && <LazyComponent />}
  </div>
);
```

---

### `useClickOutside(ref, callback)`

Detect clicks outside element.

```typescript
const ref = useRef(null);

useClickOutside(ref, () => {
  closeMenu();
});

<div ref={ref}>{/* Menu content */}</div>
```

---

### `useFocusTrap(ref, enabled?)`

Keep focus within element (useful for modals).

```typescript
const ref = useRef(null);
useFocusTrap(ref, isOpen);

<div ref={ref} role="dialog">
  {/* Tab cycles through focusable elements */}
</div>
```

---

### `useKeyboardShortcut(shortcut, callback, enabled?)`

Register keyboard shortcuts.

```typescript
useKeyboardShortcut(
  { key: 's', ctrl: true },  // Ctrl+S
  (e) => {
    e.preventDefault();
    handleSave();
  }
);
```

---

## Domain-Specific Hooks

These hooks handle business logic for specific features:

- **`useStudents()`** - Student data and operations
- **`useGroups()`** - Group management
- **`useLessons()`** - Lesson content
- **`useAssessments()`** - Assessment handling
- **`useAttendance()`** - Attendance tracking
- **`useCurriculum()`** - Curriculum data
- **`useDashboard()`** - Dashboard data
- **`useAI()`** - AI features

These typically provide:
- Data fetching
- CRUD operations
- Business logic
- State management

---

## Real-World Examples

### Example 1: Search Component

```typescript
function SearchUsers() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  
  const { data: results, loading } = useApi<User[]>();
  
  useEffect(() => {
    if (debouncedQuery) {
      results(`/api/users/search?q=${debouncedQuery}`);
    }
  }, [debouncedQuery]);
  
  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {loading && <Spinner />}
      {results?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### Example 2: Add User Form

```typescript
function AddUserForm() {
  const { notify } = useNotification();
  const { submit, isSubmitting, error } = useApiMutation<User>();
  
  const form = useFormState({
    initialValues: { email: '', role: '' },
    validate: {
      email: (v) => !v.includes('@') ? 'Invalid email' : true,
      role: (v) => !v ? 'Select a role' : true,
    },
    onSubmit: async (values) => {
      const result = await submit('/api/users', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      
      if (result) {
        form.resetForm();
        notify({ type: 'success', title: 'User created!' });
      }
    },
  });
  
  return (
    <form onSubmit={form.handleSubmit}>
      <div>
        <input {...form.getFieldProps('email')} />
        {form.touched.has('email') && form.errors.get('email') && (
          <span role="alert">{form.errors.get('email')}</span>
        )}
      </div>
      
      <select {...form.getFieldProps('role')}>
        <option value="">Select role</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>
      
      {error && <ErrorAlert>{error}</ErrorAlert>}
      
      <button type="submit" disabled={isSubmitting || !form.isValid}>
        {isSubmitting ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

---

## Best Practices

1. **Always import from `/src/hooks/index.ts`** for consistency
2. **Use TypeScript generics** for better type safety
3. **Combine hooks** to solve complex problems
4. **Remember cleanup** - hooks handle cleanup automatically
5. **Test custom hooks** using `@testing-library/react-hooks`

---

## Performance Tips

- Use `useDebounce` or `useThrottle` for high-frequency events
- Leverage `useApi` caching to avoid redundant requests
- Use `useMemo` and `useCallback` sparingly with custom hooks
- Consider `useSessionStorage` instead of `useLocalStorage` for temporary state
- Use `useBreakpoint` instead of `window.matchMedia` directly

---

## Common Patterns

### Loading State
```typescript
const { data, loading, error } = useApi();
if (loading) return <Spinner />;
if (error) return <Error message={error} />;
return <Content data={data} />;
```

### Form with API Call
```typescript
const { submit, isSubmitting } = useApiMutation();
const form = useFormState({
  onSubmit: (values) => submit('/api/endpoint', { body: JSON.stringify(values) }),
});
```

### Debounced Search
```typescript
const [term, setTerm] = useState('');
const debounced = useDebounce(term, 500);
const { data } = useApi();
useEffect(() => { data(`/api/search?q=${debounced}`); }, [debounced]);
```

---

## Troubleshooting

**Hook rendered more calls than during previous render**
- Ensure dependencies are correct in useEffect
- Check that callback dependencies are stable

**useState value not updating**
- Make sure you're using setState, not mutating state
- Check useLocalStorage/useSessionStorage options

**API calls happening multiple times**
- Enable caching in useApi options
- Check useEffect dependencies
- Wrap callbacks with useCallback

