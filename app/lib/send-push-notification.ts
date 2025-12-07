/**
 * Server-side Push Notification Sending
 *
 * Functions to send push notifications to users via Web Push API.
 * Uses web-push library with VAPID authentication.
 */

import webpush from 'web-push';
import { prisma } from './prisma';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@hierarchy-platform.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

/**
 * Send push notification to a single user
 *
 * @param userId - User ID to send notification to
 * @param payload - Notification payload
 * @returns Number of notifications sent successfully
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<number> {
  try {
    // Get all active push subscriptions for this user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId,
        // Only send to subscriptions used in last 30 days (inactive ones likely expired)
        lastUsedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    if (subscriptions.length === 0) {
      console.log(`[Push Send] No active subscriptions for user ${userId}`);
      return 0;
    }

    console.log(`[Push Send] Sending to ${subscriptions.length} device(s) for user ${userId}`);

    // Send notification to all user's devices
    let successCount = 0;
    const failedSubscriptions: bigint[] = [];

    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload),
          {
            TTL: 86400, // 24 hours
          }
        );

        // Update last used timestamp
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { lastUsedAt: new Date() },
        });

        successCount++;
      } catch (error: any) {
        console.error(`[Push Send] Failed to send to subscription ${subscription.id}:`, error);

        // If subscription expired (410 Gone), remove it from database
        if (error.statusCode === 410) {
          console.log(`[Push Send] Subscription expired, removing: ${subscription.id}`);
          failedSubscriptions.push(subscription.id);
        }
      }
    }

    // Remove expired subscriptions
    if (failedSubscriptions.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: {
          id: {
            in: failedSubscriptions,
          },
        },
      });
    }

    console.log(`[Push Send] Sent ${successCount}/${subscriptions.length} notifications to user ${userId}`);

    return successCount;
  } catch (error) {
    console.error(`[Push Send] Error sending push notification to user ${userId}:`, error);
    return 0;
  }
}

/**
 * Send push notification to multiple users
 *
 * @param userIds - Array of user IDs to send notification to
 * @param payload - Notification payload
 * @returns Total number of notifications sent successfully
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<number> {
  console.log(`[Push Send] Sending to ${userIds.length} user(s)`);

  let totalSent = 0;

  // Send to each user (in batches to avoid overwhelming the server)
  const batchSize = 10;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);

    const results = await Promise.all(
      batch.map((userId) => sendPushNotificationToUser(userId, payload))
    );

    totalSent += results.reduce((sum, count) => sum + count, 0);
  }

  console.log(`[Push Send] Total notifications sent: ${totalSent}`);

  return totalSent;
}

/**
 * Send task notification to recipients
 *
 * Helper function to send task notifications with Hebrew text
 */
export async function sendTaskNotification(
  recipientUserIds: string[],
  taskData: {
    taskId: bigint;
    body: string;
    senderName: string;
    executionDate: Date;
  }
): Promise<number> {
  const { taskId, body, senderName, executionDate } = taskData;

  // Format execution date in Hebrew
  const executionDateStr = new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(executionDate);

  // Create notification payload (Hebrew)
  const payload: PushNotificationPayload = {
    title: 'משימה חדשה',
    body: `מאת: ${senderName} | תאריך: ${executionDateStr}\n${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: `task-${taskId}`,
    data: {
      taskId: taskId.toString(),
      url: '/tasks/inbox',
      type: 'task',
    },
  };

  return sendPushNotificationToUsers(recipientUserIds, payload);
}

/**
 * Check if VAPID keys are configured
 */
export function areVapidKeysConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
  );
}
