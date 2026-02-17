'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Focus trap hook - traps focus within a modal or drawer
 * Prevents tab focus from escaping the modal
 */
export const useFocusTrap = (isActive = true) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !ref.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = ref.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    ref.current?.addEventListener('keydown', handleKeyDown);
    return () => ref.current?.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return ref;
};

/**
 * Accessible Modal Wrapper
 * Implements focus trap and ARIA live regions
 */
export const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const modalRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full mx-4 p-6',
          className
        )}
      >
        <h2 id="modal-title" className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
};

/**
 * Responsive Table Wrapper
 * Handles horizontal scrolling on mobile with scroll hint
 */
export const ResponsiveTable = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const [isScrollable, setIsScrollable] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const checkScroll = () => {
      if (containerRef.current) {
        const hasScroll = containerRef.current.scrollWidth > containerRef.current.clientWidth;
        setIsScrollable(hasScroll);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  return (
    <div className={cn('overflow-x-auto relative', className)}>
      <div ref={containerRef} className="inline-block min-w-full">
        {children}
      </div>

      {/* Scroll hint for mobile */}
      {isScrollable && (
        <div className="md:hidden absolute bottom-0 right-0 bg-gradient-to-l from-slate-100 dark:from-slate-800 to-transparent px-4 py-2 text-xs text-slate-500 dark:text-slate-400 pointer-events-none">
          ← Scroll →
        </div>
      )}
    </div>
  );
};

/**
 * Form Validation with Debounce
 * Prevents validation messages from appearing too eagerly
 */
export const useFormValidation = () => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const validateField = React.useCallback((fieldName: string, value: string, validator: (val: string) => string | null) => {
    // Clear existing timeout for this field
    if (debounceTimeouts.current[fieldName]) {
      clearTimeout(debounceTimeouts.current[fieldName]);
    }

    // Set new timeout - validate after user stops typing for 500ms
    debounceTimeouts.current[fieldName] = setTimeout(() => {
      const error = validator(value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error || '',
      }));
    }, 500);
  }, []);

  const handleBlur = React.useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  const clearError = React.useCallback((fieldName: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
  }, []);

  React.useEffect(() => {
    return () => {
      Object.values(debounceTimeouts.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return { errors, touched, validateField, handleBlur, clearError, setTouched };
};

/**
 * Form Draft Persistence
 * Saves form data to localStorage and restores on component mount
 */
export const useFormDraft = (formId: string, initialData: Record<string, any> = {}) => {
  const [formData, setFormData] = React.useState(() => {
    if (typeof window === 'undefined') return initialData;
    const draft = localStorage.getItem(`draft-${formId}`);
    return draft ? { ...initialData, ...JSON.parse(draft) } : initialData;
  });

  // Auto-save to localStorage
  React.useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(`draft-${formId}`, JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, formId]);

  const clearDraft = React.useCallback(() => {
    localStorage.removeItem(`draft-${formId}`);
  }, [formId]);

  return { formData, setFormData, clearDraft };
};

/**
 * Loading State Management for Forms
 * Handles loading state, error states, and success states
 */
export const useFormSubmit = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = React.useCallback(
    async (onSubmit: () => Promise<any>, onSuccess?: () => void, onError?: (error: any) => void) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await onSubmit();
        if (onSuccess) onSuccess();
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        if (onError) onError(err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { isLoading, error, setError, handleSubmit };
};

/**
 * ARIA Live Region for Toast Notifications
 * Announces status updates to screen readers
 */
export const AriaLiveRegion = ({
  message,
  type = 'polite',
}: {
  message: string;
  type?: 'polite' | 'assertive';
}) => (
  <div
    aria-live={type}
    aria-atomic="true"
    className="sr-only"
    role={type === 'assertive' ? 'alert' : undefined}
  >
    {message}
  </div>
);

/**
 * Floating Action Button (FAB) for Mobile
 */
export const FloatingActionButton = ({
  onClick,
  icon: Icon,
  label,
  className = '',
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  className?: string;
}) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-emerald-500 text-white shadow-lg hover:shadow-xl hover:bg-emerald-600 active:bg-emerald-700 flex items-center justify-center transition-all duration-200 md:hidden',
        className
      )}
    >
      <Icon className="w-6 h-6" aria-hidden="true" />
    </button>
  );
};
