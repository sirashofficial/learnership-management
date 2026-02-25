/**
 * Hook for detecting and responding to online/offline status
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

export interface OfflineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  justCameOnline: boolean;
}

/**
 * useOfflineStatus: Monitor and respond to online/offline status
 * @param onStatusChange - Callback when status changes
 * @returns Current offline status
 */
export function useOfflineStatus(
  onStatusChange?: (status: OfflineStatus) => void
): OfflineStatus {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    justCameOnline: false,
  });

  const handleStatusChange = useCallback((isOnline: boolean) => {
    setStatus((prevStatus) => {
      const newStatus: OfflineStatus = {
        isOnline,
        wasOffline: !isOnline,
        justCameOnline: !prevStatus.isOnline && isOnline,
      };

      if (onStatusChange) {
        onStatusChange(newStatus);
      }

      return newStatus;
    });
  }, [onStatusChange]);

  useEffect(() => {
    // Initial status
    const isOnline = navigator.onLine;
    handleStatusChange(isOnline);

    // Listen for online/offline events
    window.addEventListener('online', () => handleStatusChange(true));
    window.addEventListener('offline', () => handleStatusChange(false));

    return () => {
      window.removeEventListener('online', () => handleStatusChange(true));
      window.removeEventListener('offline', () => handleStatusChange(false));
    };
  }, [handleStatusChange]);

  return status;
}

/**
 * useIsOnline: Simple boolean hook for online status
 * @returns true if online, false if offline
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
