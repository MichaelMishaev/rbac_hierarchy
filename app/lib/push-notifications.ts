/**
 * Push Notifications Helper Functions
 *
 * Client-side functions for managing push notification subscriptions
 * and service worker registration.
 *
 * IMPORTANT: These functions run in the browser only.
 */

import { env } from './env';

/**
 * Check if browser supports push notifications
 */
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isPushNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('Notification permission was previously denied. Please enable it in browser settings.');
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    throw new Error('Failed to request notification permission');
  }
}

/**
 * Register service worker
 * Returns registration object or null if already registered
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  try {
    // Check if already registered
    const existingRegistration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existingRegistration) {
      console.log('[Push] Service worker already registered');
      return existingRegistration;
    }

    // Register new service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none', // Don't cache the service worker file itself
    });

    console.log('[Push] Service worker registered successfully:', registration);

    // Wait for service worker to activate
    if (registration.installing) {
      await new Promise<void>((resolve) => {
        registration.installing!.addEventListener('statechange', (event) => {
          const sw = event.target as ServiceWorker;
          if (sw.state === 'activated') {
            resolve();
          }
        });
      });
    }

    return registration;
  } catch (error) {
    console.error('[Push] Service worker registration failed:', error);
    throw new Error('Failed to register service worker');
  }
}

/**
 * Subscribe to push notifications
 * Returns subscription object
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  // Step 1: Request permission
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission not granted');
  }

  // Step 2: Register service worker
  const registration = await registerServiceWorker();
  if (!registration) {
    throw new Error('Service worker registration failed');
  }

  // Step 3: Check if already subscribed
  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    console.log('[Push] Already subscribed to push notifications');
    return existingSubscription;
  }

  // Step 4: Get VAPID public key from environment
  const vapidPublicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  console.log('[Push] Environment check:', {
    hasKey: !!vapidPublicKey,
    keyLength: vapidPublicKey?.length || 0,
    keyPreview: vapidPublicKey?.substring(0, 10) || 'undefined'
  });

  if (!vapidPublicKey) {
    console.error('[Push] VAPID public key not found in env config');
    throw new Error('VAPID public key not configured. Please check that NEXT_PUBLIC_VAPID_PUBLIC_KEY is set in .env file and restart dev server.');
  }

  // Step 5: Subscribe to push manager
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // Show notification to user (required by browsers)
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    console.log('[Push] Subscribed to push notifications:', subscription);

    // Step 6: Send subscription to backend
    await saveSubscriptionToBackend(subscription);

    return subscription;
  } catch (error) {
    console.error('[Push] Failed to subscribe to push notifications:', error);
    throw new Error('Failed to subscribe to push notifications');
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) {
      console.warn('[Push] No service worker registration found');
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      console.warn('[Push] No push subscription found');
      return false;
    }

    // Unsubscribe from push manager
    const success = await subscription.unsubscribe();

    if (success) {
      console.log('[Push] Unsubscribed from push notifications');

      // Remove subscription from backend
      await removeSubscriptionFromBackend(subscription);
    }

    return success;
  } catch (error) {
    console.error('[Push] Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) {
      return null;
    }

    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('[Push] Failed to get push subscription:', error);
    return null;
  }
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isPushSubscribed(): Promise<boolean> {
  const subscription = await getPushSubscription();
  return subscription !== null;
}

// ============================================================================
// Backend API Helpers
// ============================================================================

/**
 * Save push subscription to backend
 */
async function saveSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        action: 'subscribe',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save subscription');
    }

    console.log('[Push] Subscription saved to backend');
  } catch (error) {
    console.error('[Push] Failed to save subscription to backend:', error);
    throw error;
  }
}

/**
 * Remove push subscription from backend
 */
async function removeSubscriptionFromBackend(subscription: PushSubscription): Promise<void> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        action: 'unsubscribe',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove subscription');
    }

    console.log('[Push] Subscription removed from backend');
  } catch (error) {
    console.error('[Push] Failed to remove subscription from backend:', error);
    throw error;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert VAPID public key from base64 to Uint8Array
 * Required by PushManager.subscribe()
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Test push notification (for debugging)
 */
export function testPushNotification(): void {
  if (!isPushNotificationSupported()) {
    console.error('[Push] Push notifications not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.error('[Push] Notification permission not granted');
    return;
  }

  new Notification('🧪 Test Notification', {
    body: 'זהו מבחן התראות דחיפה',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    dir: 'rtl',
    lang: 'he',
  });

  console.log('[Push] Test notification sent');
}
