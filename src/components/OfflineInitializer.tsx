/**
 * Service Worker Initializer Component
 * Registers service worker and initializes offline support
 */

'use client';

import { useEffect, useState } from 'react';
import {
  registerServiceWorker,
  initializeOfflineDataCache,
  setupServiceWorkerMessageListener,
} from '@/lib/offline/swRegistration';
import { setupOnlineStatusListener } from '@/lib/offline/syncManager';

export function OfflineInitializer() {
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    // Register service worker
    const initSW = async () => {
      const registration = await registerServiceWorker();
      if (registration) {
        setSwReady(true);
        
        // Initialize offline data caching
        await initializeOfflineDataCache();
        
        // Setup message listener for service worker events
        setupServiceWorkerMessageListener((data) => {
          console.log('[App] Service worker event:', data);
          
          if (data.type === 'SYNC_START') {
            console.log('[App] Sync started');
          } else if (data.type === 'SYNC_COMPLETE') {
            console.log('[App] Sync completed');
            // Reload data if needed
          }
        });
      }
    };

    initSW();

    // Setup online status listener
    const cleanup = setupOnlineStatusListener((isOnline) => {
      if (isOnline) {
        console.log('[App] Online - ready to sync');
      } else {
        console.log('[App] Offline mode');
      }
    });

    return cleanup;
  }, []);

  // This component doesn't render anything
  return null;
}
