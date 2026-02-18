/**
 * Custom Hook: useNotification
 * Manages toast notifications and alerts
 */

import { useState, useCallback, useRef } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

/**
 * Hook for managing toast notifications
 * 
 * Usage:
 * ```typescript
 * const { notify, notifications, dismiss } = useNotification();
 * 
 * notify({
 *   type: 'success',
 *   title: 'User created',
 *   message: 'User has been created successfully',
 * });
 * ```
 */
export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const idCounterRef = useRef(0);
  const timeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const notify = useCallback(
    ({
      type,
      title,
      message,
      duration = 4000,
      dismissible = true,
    }: Omit<Notification, 'id'>) => {
      const id = String(++idCounterRef.current);

      const notification: Notification = {
        id,
        type,
        title,
        message,
        duration,
        dismissible,
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto-dismiss after duration if duration is set
      if (duration > 0) {
        const timeout = setTimeout(() => {
          dismiss(id);
        }, duration);

        timeoutRef.current.set(id, timeout);
      }

      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    // Clear timeout if exists
    const timeout = timeoutRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRef.current.delete(id);
    }

    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    // Clear all timeouts
    timeoutRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutRef.current.clear();

    setNotifications([]);
  }, []);

  return {
    notifications,
    notify,
    dismiss,
    dismissAll,
  };
}

/**
 * Hook for managing modal/dialog state
 * 
 * Usage:
 * ```typescript
 * const { isOpen, open, close, toggle } = useModal();
 * 
 * return (
 *   <>
 *     <button onClick={open}>Open Dialog</button>
 *     {isOpen && <Dialog onClose={close} />}
 *   </>
 * );
 * ```
 */
export function useModal(initialState: boolean = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * Hook for managing dropdown/menu state
 */
export interface UseDisclosureOptions {
  onOpen?: () => void;
  onClose?: () => void;
}

export function useDisclosure(
  initialState: boolean = false,
  options: UseDisclosureOptions = {}
) {
  const { onOpen, onClose } = options;
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const newState = !prev;
      if (newState) {
        onOpen?.();
      } else {
        onClose?.();
      }
      return newState;
    });
  }, [onOpen, onClose]);

  return {
    isOpen,
    onOpen: open,
    onClose: close,
    onToggle: toggle,
  };
}

/**
 * Hook for managing loading states
 */
export function useLoading(initialState: boolean = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  const withLoading = useCallback(
    async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
      try {
        startLoading();
        return await asyncFn();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
}

/**
 * Hook for managing form submission state with error handling
 */
export interface UseSubmitOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useSubmit(
  onSubmit: () => Promise<void>,
  options: UseSubmitOptions = {}
) {
  const { onSuccess, onError } = options;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      setIsSubmitting(true);
      setError(null);

      try {
        await onSubmit();
        onSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onSuccess, onError]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    isSubmitting,
    error,
    submit,
    clearError,
  };
}
