/**
 * Service Worker for Election Campaign Management System
 *
 * Features:
 * - Push Notifications (for task assignments and updates)
 * - Intelligent Caching (for offline-first functionality)
 * - Background Sync (for offline action queuing)
 *
 * Caching Strategy:
 * - App Shell: Cache First (HTML, CSS, JS)
 * - API Data (lists): Stale-While-Revalidate (show cached, update in background)
 * - API Data (details): Network First (must-be-fresh content)
 * - Critical Actions: Queue writes offline with Background Sync API
 *
 * Version: 2.0.0 - PWA with Offline Support
 */

const SW_VERSION = '2.1.6'; // Fixed SW update deadlock (Bug #36: bypass cache for /sw.js itself)
const CACHE_NAME = `campaign-v${SW_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// App shell resources to cache on install
const APP_SHELL = [
  '/',
  '/offline.html',
  '/manifest.json',
];

/**
 * Install Event - Cache app shell resources
 */
self.addEventListener('install', (event) => {
  console.log(`[Service Worker ${SW_VERSION}] Installing...`);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('[Service Worker] App shell cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('[Service Worker] Failed to cache app shell:', error);
      })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log(`[Service Worker ${SW_VERSION}] Activating...`);

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Old caches cleaned up');
        return self.clients.claim(); // Take control immediately
      })
  );
});

/**
 * Fetch Event - Intelligent caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API requests: Network First (fresh data priority)
  // Only cache static/reference data, not dynamic voter/attendance data
  if (url.pathname.startsWith('/api/')) {
    const isStaticApi =
      url.pathname.includes('/api/neighborhoods') ||
      url.pathname.includes('/api/cities') ||
      url.pathname.includes('/api/areas');

    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache static APIs only
          if (isStaticApi && response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Fallback to cache only for static APIs when offline
          if (isStaticApi) {
            const cached = await caches.match(request);
            if (cached) {
              return cached;
            }
          }
          // Return offline error for dynamic data
          return new Response(
            JSON.stringify({ error: 'Offline - נא להתחבר לאינטרנט', offline: true }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Navigation requests (HTML pages): Network First, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(OFFLINE_PAGE);
        })
    );
    return;
  }

  // Next.js internal files: NEVER cache (they're versioned with hashes)
  // Caching these causes chunk mismatch errors on navigation
  // (fixes Bug #35: "Cannot read properties of undefined (reading 'call')")
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Service Worker and Manifest: NEVER cache (prevents update deadlock)
  // SW must always fetch fresh to detect updates
  // (fixes Bug #36: "Failed to update ServiceWorker - unknown error fetching script")
  if (url.pathname === '/sw.js' || url.pathname === '/manifest.json') {
    event.respondWith(
      fetch(request, {
        cache: 'no-cache', // Force revalidation
      })
    );
    return;
  }

  // Static assets (JS, CSS, images): Cache First
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) {
          return cached;
        }

        return fetch(request).then(response => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
      .catch(() => {
        // Fallback for images
        if (request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ddd" width="100" height="100"/></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      })
  );
});

/**
 * Background Sync - Queue offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);

  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

/**
 * Sync queued offline actions when back online
 */
async function syncOfflineActions() {
  console.log('[Service Worker] Syncing offline actions...');

  try {
    // Get queued actions from IndexedDB (to be implemented)
    // For now, just log
    console.log('[Service Worker] No offline actions to sync');
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Failed to sync offline actions:', error);
    throw error;
  }
}

/**
 * Push Notification Events
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received', event);

  if (!event.data) {
    console.warn('[Service Worker] Push event has no data');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (error) {
    console.error('[Service Worker] Failed to parse push data:', error);
    return;
  }

  const {
    title = 'משימה חדשה',
    body = 'קיבלת משימה חדשה',
    icon = '/icon-192x192.png',
    badge = '/icon-192x192.png',
    tag = 'task-notification',
    data = {},
  } = notificationData;

  const options = {
    body,
    icon,
    badge,
    tag,
    data,
    dir: 'rtl',
    lang: 'he',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'פתח',
        icon: '/icon-192x192.png',
      },
      {
        action: 'close',
        title: 'סגור',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification Click Events
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open the app (or focus if already open)
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('/tasks') && 'focus' in client) {
          return client.focus();
        }
      }

      // Otherwise, open tasks page
      if (clients.openWindow) {
        return clients.openWindow('/tasks');
      }
    })
  );
});

/**
 * Push Subscription Changes
 */
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[Service Worker] Push subscription changed', event);

  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then((subscription) => {
        console.log('[Service Worker] Subscription renewed successfully');

        // Send new subscription to server
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            action: 'renew',
          }),
        });
      })
      .catch((error) => {
        console.error('[Service Worker] Failed to renew subscription:', error);
      })
  );
});

/**
 * Message Event - Handle messages from clients
 * Used for version update coordination
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] SKIP_WAITING requested - activating new version');
    self.skipWaiting();
  }
});

console.log(`[Service Worker ${SW_VERSION}] Loaded successfully`);
console.log('[Service Worker] Features: Push Notifications + Offline Caching + Background Sync');
