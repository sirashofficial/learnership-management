/**
 * Pending Sync Indicator Component
 * Shows visual feedback when data is pending sync
 */

'use client';

import { Clock, RefreshCw } from 'lucide-react';

interface PendingSyncIndicatorProps {
  pending: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showToast?: boolean;
}

export function PendingSyncIndicator({
  pending,
  size = 'md',
  showLabel = true,
  showToast = false,
}: PendingSyncIndicatorProps) {
  if (!pending) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (showToast) {
    return (
      <div className="fixed bottom-4 right-4 bg-amber-50 border border-amber-200 border-l-4 border-l-amber-400 rounded-lg p-4 shadow-sm z-40">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
          <div>
            <p className="text-sm font-medium text-amber-900">Pending Sync</p>
            <p className="text-xs text-amber-700">
              Changes will sync when connection restored.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Clock className={`${sizeClasses[size]} text-amber-500`} />
      {showLabel && (
        <span className={`${textSize[size]} text-amber-600 font-medium`}>
          Pending Sync
        </span>
      )}
    </div>
  );
}

/**
 * Inline pending sync badge for tables/lists
 */
export function PendingSyncBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
      <Clock className="w-3 h-3 animate-pulse" />
      Pending Sync
    </span>
  );
}

/**
 * Toast notification for successful sync
 */
export function SyncSuccessToast() {
  return (
    <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 border-l-4 border-l-green-400 rounded-lg p-4 shadow-sm z-40">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-900">Synced Successfully</p>
          <p className="text-xs text-green-700">
            Your changes have been uploaded.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Toast notification for sync error
 */
export function SyncErrorToast({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 border-l-4 border-l-red-400 rounded-lg p-4 shadow-sm z-40">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-900">Sync Failed</p>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
        <button
          onClick={onRetry}
          className="text-xs font-medium text-red-600 hover:text-red-800"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
