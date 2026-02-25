/**
 * Service Worker for PWA Offline Support
 * Caches static assets and API responses for offline availability
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// API routes to cache responses
const CACHEABLE_API_ROUTES = [
  '/api/students',
  '/api/groups',
  '/api/curriculum',
  '/api/sessions',
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Install event triggered');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some assets failed to cache:', err);
        // Continue even if some assets fail
        return Promise.resolve();
      });
    })
  );
  // Immediately activate the new service worker
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activate event triggered');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE &&
            cacheName !== API_CACHE
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
  // Claim all clients
  self.clients.claim();
});

/**
 * Fetch event - implement cache strategy
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const { method, url } = request;

  // Skip non-GET requests
  if (method !== 'GET') {
    return;
  }

  // Parse URL to determine cache strategy
  const urlObj = new URL(url);
  const isAPI = urlObj.pathname.startsWith('/api');
  const isNavigation = request.mode === 'navigate';

  if (isAPI) {
    // API: Network first, fall back to cache
    event.respondWith(networkFirstStrategy(request));
  } else if (isNavigation) {
    // Navigation: Network first, fall back to offline page
    event.respondWith(navigationStrategy(request));
  } else {
    // Static assets: Cache first, fall back to network
    event.respondWith(cacheFirstStrategy(request));
  }
});

/**
 * Cache first strategy: check cache first, then network
 */
async function cacheFirstStrategy(request: Request): Promise<Response> {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);

    if (cached) {
      console.log('[SW] Cache hit:', request.url);
      return cached;
    }

    const response = await fetch(request);

    // Cache successful responses
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (err) {
    console.error('[SW] Cache first failed:', err);
    // Return offline page for navigation requests
    const offlineResponse = await caches.match('/offline.html');
    return offlineResponse || new Response('Offline - No data available');
  }
}

/**
 * Network first strategy: try network, fall back to cache
 */
async function networkFirstStrategy(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);

    // Cache successful API responses
    if (response && response.status === 200) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (err) {
    console.warn('[SW] Network failed, checking cache:', request.url);

    // Try to get from cache
    const cache = await caches.open(API_CACHE);
    const cached = await cache.match(request);

    if (cached) {
      console.log('[SW] Serving from API cache:', request.url);
      return cached;
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        error: 'Offline - Unable to fetch data',
        cached: false,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Navigation strategy: special handling for page navigations
 */
async function navigationStrategy(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    return response;
  } catch (err) {
    console.warn('[SW] Navigation failed, checking cache:', request.url);

    // Try to get from cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Return offline page
    return caches.match('/offline.html') ||
      new Response(
        '<h1>Offline</h1><p>You are offline. Please check your connection.</p>',
        {
          status: 503,
          headers: { 'Content-Type': 'text/html' },
        }
      );
  }
}

/**
 * Background sync for pending records
 * Fires when connection is restored
 */
self.addEventListener('sync', (event: any) => {
  console.log('[SW] Sync event triggered:', event.tag);

  if (event.tag === 'sync-pending-records') {
    event.waitUntil(syncPendingRecords());
  }
});

/**
 * Sync pending records when connection restored
 */
async function syncPendingRecords(): Promise<void> {
  try {
    // Notify all clients that sync has started
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_START' });
    });

    // In a real implementation, this would access IndexedDB
    // and sync pending records. The actual sync logic is in syncManager.ts
    console.log('[SW] Sync pending records initiated');

    // Notify clients of sync completion
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_COMPLETE' });
    });
  } catch (err) {
    console.error('[SW] Sync failed:', err);
  }
}

/**
 * Message handler from clients
 */
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { type, payload } = event.data;

  console.log('[SW] Message received:', type);

  if (type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  } else if (type === 'CACHE_ASSETS') {
    event.waitUntil(cacheAssets(payload));
  }
});

/**
 * Clear all caches
 */
async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

/**
 * Cache specific assets
 */
async function cacheAssets(assets: string[]): Promise<void> {
  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.addAll(assets);
  console.log('[SW] Assets cached:', assets);
}

export {};
