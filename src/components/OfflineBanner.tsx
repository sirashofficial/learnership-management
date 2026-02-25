/**
 * Offline Mode Banner
 * Displays when the application detects offline status
 */

'use client';

import { useIsOnline } from '@/lib/offline/useOfflineStatus';
import { AlertCircle, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const isOnline = useIsOnline();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show banner when going offline, hide a few seconds after coming back online
    if (!isOnline) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!show) {
    return null;
  }

  if (isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-50 border-b border-green-200 px-4 py-2 sm:px-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-green-600" />
            <p className="text-sm font-medium text-green-700">
              ✓ Connection restored. Syncing pending changes...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              ⚠ You are offline
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Changes are saved locally. They'll sync when you're back online.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
