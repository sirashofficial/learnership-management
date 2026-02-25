/**
 * Service Worker Registration Utility
 * Handles registration and lifecycle of the offline service worker
 */

/**
 * Initialize and register service worker
 * Call this once during app initialization
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') {
    // Running on server, can't register
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service Workers not supported');
    return null;
  }

  try {
    console.log('[SW] Registering service worker...');
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      type: 'module',
    });

    console.log('[SW] Service worker registered successfully:', registration);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60000); // Check every minute

    return registration;
  } catch (err) {
    console.error('[SW] Service worker registration failed:', err);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log('[SW] Service workers unregistered');
    return true;
  } catch (err) {
    console.error('[SW] Failed to unregister service worker:', err);
    return false;
  }
}

/**
 * Check if service worker is active
 */
export async function isServiceWorkerActive(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration.active !== null;
  } catch {
    return false;
  }
}

/**
 * Send message to service worker
 */
export async function postMessageToServiceWorker(
  message: any
): Promise<void> {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    console.warn('[SW] No active service worker to message');
    return;
  }

  navigator.serviceWorker.controller.postMessage(message);
}

/**
 * Listen for messages from service worker
 */
export function setupServiceWorkerMessageListener(
  handler: (data: any) => void
): () => void {
  if (!('serviceWorker' in navigator)) {
    return () => {};
  }

  const messageHandler = (event: MessageEvent) => {
    console.log('[SW] Message from service worker:', event.data);
    handler(event.data);
  };

  navigator.serviceWorker.addEventListener('message', messageHandler);

  // Return cleanup function
  return () => {
    navigator.serviceWorker.removeEventListener('message', messageHandler);
  };
}

/**
 * Check for service worker updates
 */
export async function checkForServiceWorkerUpdate(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.update();
    console.log('[SW] Checked for updates');
    return registration.waiting !== null; // true if update available
  } catch (err) {
    console.error('[SW] Update check failed:', err);
    return false;
  }
}

/**
 * Activate waiting service worker (new version)
 */
export async function skipWaiting(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      console.log('[SW] Skipped to waiting service worker');
    }
  } catch (err) {
    console.error('[SW] Failed to skip waiting:', err);
  }
}

/**
 * Initialize offline data caching
 * Prefetch and cache important assets for offline use
 */
export async function initializeOfflineDataCache(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Offline] Service Worker not available for data cache');
    return;
  }

  try {
    // These are routes that should be cached for offline access
    const assetsToCache = [
      '/api/students',
      '/api/groups',
      '/api/curriculum',
      '/api/sessions',
    ];

    await postMessageToServiceWorker({
      type: 'CACHE_ASSETS',
      payload: assetsToCache,
    });

    console.log('[Offline] Data cache initialization sent to service worker');
  } catch (err) {
    console.error('[Offline] Failed to initialize data cache:', err);
  }
}

/**
 * Clear all service worker caches
 */
export async function clearServiceWorkerCache(): Promise<void> {
  try {
    // Message service worker to clear caches
    await postMessageToServiceWorker({ type: 'CLEAR_CACHE' });

    // Also try browser cache API directly
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }

    console.log('[Offline] All caches cleared');
  } catch (err) {
    console.error('[Offline] Failed to clear cache:', err);
  }
}
