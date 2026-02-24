'use client';

import { useState, useEffect, useCallback } from 'react';
import { Undo2, X, Loader2, CheckCircle } from 'lucide-react';

interface UndoToastProps {
  undoId: string;
  message: string;
  onUndone?: () => void;
  onDismiss?: () => void;
  timeoutSeconds?: number;
}

export default function UndoToast({
  undoId,
  message,
  onUndone,
  onDismiss,
  timeoutSeconds = 30,
}: UndoToastProps) {
  const [secondsLeft, setSecondsLeft] = useState(timeoutSeconds);
  const [undoing, setUndoing] = useState(false);
  const [undone, setUndone] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0 || undone) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, undone]);

  useEffect(() => {
    if (secondsLeft <= 0 && !undone) {
      onDismiss?.();
    }
  }, [secondsLeft, undone, onDismiss]);

  const handleUndo = useCallback(async () => {
    setUndoing(true);
    try {
      const res = await fetch(`/api/undo/${undoId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Could not undo this action');
        return;
      }
      setUndone(true);
      onUndone?.();
      setTimeout(() => onDismiss?.(), 2000);
    } finally {
      setUndoing(false);
    }
  }, [undoId, onUndone, onDismiss]);

  const progressPct = ((secondsLeft / timeoutSeconds) * 100).toFixed(1);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 pointer-events-none">
      <div className="bg-gray-900 text-white rounded-xl shadow-xl px-5 py-3.5 flex items-center gap-4 pointer-events-auto min-w-72">
        {undone ? (
          <>
            <CheckCircle size={18} className="text-green-400" />
            <span className="text-sm font-medium">Undone successfully</span>
          </>
        ) : (
          <>
            <span className="text-sm font-medium flex-1">{message}</span>
            <button
              onClick={handleUndo}
              disabled={undoing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 rounded-lg text-xs font-bold transition disabled:opacity-50"
            >
              {undoing ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
              Undo ({secondsLeft}s)
            </button>
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </>
        )}
      </div>
      {/* Progress bar */}
      {!undone && (
        <div className="h-1 w-72 bg-gray-700 rounded-full overflow-hidden pointer-events-none">
          <div
            className="h-full bg-blue-400 rounded-full transition-all duration-1000"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Hook to manage undo toasts
export function useUndoToast() {
  const [toasts, setToasts] = useState<
    { id: string; undoId: string; message: string }[]
  >([]);

  const showUndoToast = useCallback((undoId: string, message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, undoId, message }]);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showUndoToast, dismissToast };
}
