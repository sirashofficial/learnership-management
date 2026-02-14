'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-emerald-600 border-emerald-500',
    error: 'bg-red-600 border-red-500',
    warning: 'bg-amber-500 border-amber-400',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl border text-white shadow-2xl animate-slide-up max-w-sm ${styles[type]}`}
    >
      <span className="text-lg font-bold flex-shrink-0">{icons[type]}</span>
      <p className="text-sm font-medium leading-snug">{message}</p>
      <button
        onClick={onClose}
        className="ml-2 text-white/70 hover:text-white text-lg leading-none flex-shrink-0"
      >
        ×
      </button>
    </div>
  );
}

// Hook for easy toast management
import { useState, useCallback } from 'react';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warning';
  id: number;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}
