/**
 * Push Notifications React Hook
 *
 * Handles service worker registration and push notification subscription
 * for the current user.
 *
 * Usage:
 * ```tsx
 * const { isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isPushNotificationSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushSubscribed,
  registerServiceWorker,
  getNotificationPermission,
} from '@/lib/push-notifications';

export interface UsePushNotificationsReturn {
  /** Whether user is subscribed to push notifications */
  isSubscribed: boolean;
  /** Whether checking subscription status */
  isLoading: boolean;
  /** Whether browser supports push notifications */
  isSupported: boolean;
  /** Current notification permission status */
  permission: NotificationPermission;
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;
  /** Refresh subscription status */
  refresh: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    setIsLoading(true);
    try {
      const subscribed = await isPushSubscribed();
      setIsSubscribed(subscribed);

      const perm = getNotificationPermission();
      setPermission(perm);
    } catch (error) {
      console.error('[usePushNotifications] Failed to check subscription:', error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      await subscribeToPushNotifications();
      setIsSubscribed(true);
      setPermission('granted');
      return true;
    } catch (error) {
      console.error('[usePushNotifications] Subscription failed:', error);
      setIsSubscribed(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPushNotifications();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } catch (error) {
      console.error('[usePushNotifications] Unsubscribe failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      // Check if browser supports push notifications
      const supported = isPushNotificationSupported();
      setIsSupported(supported);

      if (!supported) {
        setIsLoading(false);
        return;
      }

      // Register service worker (idempotent)
      try {
        await registerServiceWorker();
      } catch (error) {
        console.error('[usePushNotifications] Service worker registration failed:', error);
      }

      // Check subscription status
      await checkSubscription();
    };

    initialize();
  }, [checkSubscription]);

  return {
    isSubscribed,
    isLoading,
    isSupported,
    permission,
    subscribe,
    unsubscribe,
    refresh: checkSubscription,
  };
}
