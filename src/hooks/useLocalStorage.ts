/**
 * Custom Hook: useLocalStorage
 * Manages state with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseLocalStorageOptions {
  serializer?: (value: any) => string;
  deserializer?: (value: string) => any;
  initializeFromStorage?: boolean;
}

/**
 * Hook for managing state that persists to localStorage
 * 
 * Usage:
 * ```typescript
 * const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false);
 * const [user, setUser] = useLocalStorage('user', null);
 * ```
 */
export function useLocalStorage<T = any>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    initializeFromStorage = true,
  } = options;

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!initializeFromStorage) {
      return initialValue;
    }

    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }

      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }

      return deserializer(item);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to local storage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serializer(valueToStore));
        }

        // Listen for changes in other tabs/windows
        window.dispatchEvent(
          new StorageEvent('storage', {
            key,
            newValue: serializer(valueToStore),
            oldValue: serializer(storedValue),
            storageArea: window.localStorage,
          })
        );
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serializer]
  );

  // Listen for changes across tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(deserializer(e.newValue));
        } catch (error) {
          console.error(`Error deserializing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserializer]);

  // Function to remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for managing state with sessionStorage (cleared on tab close)
 * Same API as useLocalStorage
 */
export function useSessionStorage<T = any>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    initializeFromStorage = true,
  } = options;

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!initializeFromStorage) {
      return initialValue;
    }

    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }

      const item = window.sessionStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }

      return deserializer(item);
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, serializer(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serializer]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
