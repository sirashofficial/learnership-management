/**
 * Sync Status Widget
 * Displays pending sync items and last sync time
 */

'use client';

import { useEffect, useState } from 'react';
import {
  getSyncStats,
  SyncMetadata,
  updateSyncMetadata as updateSyncMetadataDB,
} from '@/lib/offline/db';
import { syncPendingRecords } from '@/lib/offline/syncManager';
import { useIsOnline } from '@/lib/offline/useOfflineStatus';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';

interface SyncStatus {
  pendingAttendanceCount: number;
  pendingAssessmentCount: number;
  totalPendingCount: number;
  lastSyncTime?: number;
  lastSyncStatus?: 'success' | 'error' | 'pending';
  syncing: boolean;
  syncError?: string;
}

export function SyncStatusWidget() {
  const isOnline = useIsOnline();
  const [status, setStatus] = useState<SyncStatus>({
    pendingAttendanceCount: 0,
    pendingAssessmentCount: 0,
    totalPendingCount: 0,
    syncing: false,
  });
  const [showDetails, setShowDetails] = useState(false);

  // Fetch sync status on mount and when online status changes
  useEffect(() => {
    const refreshStatus = async () => {
      const stats = await getSyncStats();
      setStatus((prev) => ({
        ...prev,
        ...stats,
      }));
    };

    refreshStatus();
    const interval = setInterval(refreshStatus, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && status.totalPendingCount > 0 && !status.syncing) {
      const autoSync = async () => {
        setStatus((prev) => ({ ...prev, syncing: true }));
        try {
          const result = await syncPendingRecords();
          if (result.success) {
            setStatus((prev) => ({
              ...prev,
              pendingAttendanceCount: 0,
              pendingAssessmentCount: 0,
              totalPendingCount: 0,
              lastSyncStatus: 'success',
              lastSyncTime: Date.now(),
              syncError: undefined,
              syncing: false,
            }));
          } else {
            setStatus((prev) => ({
              ...prev,
              lastSyncStatus: 'error',
              syncError: result.errors.join('; '),
              syncing: false,
            }));
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          setStatus((prev) => ({
            ...prev,
            lastSyncStatus: 'error',
            syncError: errorMsg,
            syncing: false,
          }));
        }
      };

      // Add a small delay to ensure connection is stable
      const timer = setTimeout(autoSync, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, status.totalPendingCount, status.syncing]);

  const handleManualSync = async () => {
    setStatus((prev) => ({ ...prev, syncing: true }));
    try {
      const result = await syncPendingRecords();
      if (result.success) {
        const stats = await getSyncStats();
        setStatus((prev) => ({
          ...prev,
          ...stats,
          lastSyncStatus: 'success',
          lastSyncTime: Date.now(),
          syncError: undefined,
          syncing: false,
        }));
      } else {
        setStatus((prev) => ({
          ...prev,
          lastSyncStatus: 'error',
          syncError: result.errors.join('; '),
          syncing: false,
        }));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setStatus((prev) => ({
        ...prev,
        lastSyncStatus: 'error',
        syncError: errorMsg,
        syncing: false,
      }));
    }
  };

  // Only show if there are pending items or recent sync activity
  if (
    status.totalPendingCount === 0 &&
    !status.lastSyncTime &&
    status.lastSyncStatus !== 'error'
  ) {
    return null;
  }

  return (
    <div className="relative">
      {/* Compact indicator button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          status.totalPendingCount > 0
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            : status.lastSyncStatus === 'error'
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
        }`}
      >
        {status.syncing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Syncing...</span>
          </>
        ) : isOnline ? (
          <>
            <Cloud className="w-4 h-4" />
            {status.totalPendingCount > 0 ? (
              <span>
                <span className="font-bold">{status.totalPendingCount}</span> pending
              </span>
            ) : (
              <span>Synced</span>
            )}
          </>
        ) : (
          <>
            <CloudOff className="w-4 h-4" />
            <span>Offline</span>
          </>
        )}
      </button>

      {/* Detailed panel */}
      {showDetails && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="space-y-3">
            {/* Status indicators */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Connection:</span>
                <span
                  className={`font-medium ${
                    isOnline ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {isOnline ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Pending attendance:</span>
                <span className="font-medium text-amber-600">
                  {status.pendingAttendanceCount}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Pending assessments:</span>
                <span className="font-medium text-amber-600">
                  {status.pendingAssessmentCount}
                </span>
              </div>
            </div>

            {/* Last sync info */}
            {status.lastSyncTime && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Last sync: {new Date(status.lastSyncTime).toLocaleTimeString()}
              </div>
            )}

            {/* Error message */}
            {status.syncError && (
              <div className="text-xs bg-red-50 text-red-700 p-2 rounded border border-red-200">
                Sync error: {status.syncError}
              </div>
            )}

            {/* Manual sync button */}
            <button
              onClick={handleManualSync}
              disabled={status.syncing || !isOnline}
              className="w-full mt-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status.syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
