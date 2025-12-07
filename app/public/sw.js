/**
 * Service Worker for Push Notifications ONLY
 *
 * ⚠️ CRITICAL: NO CACHING LOGIC
 * This service worker ONLY handles push notifications.
 * It does NOT cache any resources to avoid stale data issues.
 *
 * Version: 1.0.0
 */

const SW_VERSION = '1.0.0';

// ⚠️ NO INSTALL EVENT - No caching
// ⚠️ NO ACTIVATE EVENT - No cache cleanup needed
// ⚠️ NO FETCH EVENT - Let browser handle all network requests normally

/**
 * Handle push notification events
 * Shows notification when task is received
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
 * Handle notification click events
 * Opens the app when notification is clicked
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
        if (client.url.includes('/tasks/inbox') && 'focus' in client) {
          return client.focus();
        }
      }

      // Otherwise, open inbox page
      if (clients.openWindow) {
        return clients.openWindow('/tasks/inbox');
      }
    })
  );
});

/**
 * Handle push subscription changes
 * Updates subscription when it expires
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

console.log(`[Service Worker] Push-only service worker loaded (v${SW_VERSION})`);
console.log('[Service Worker] ⚠️ NO CACHING - All network requests bypass service worker');
