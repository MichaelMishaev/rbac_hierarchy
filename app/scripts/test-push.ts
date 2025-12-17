/**
 * Test Push Notification Script
 *
 * Usage: npx tsx scripts/test-push.ts <user-email>
 *
 * Sends a test push notification to the specified user.
 */

import { prisma } from '../lib/prisma';
import { sendPushNotificationToUser } from '../lib/send-push-notification';

async function main() {
  const userEmail = process.argv[2];

  if (!userEmail) {
    console.error('Usage: npx tsx scripts/test-push.ts <user-email>');
    process.exit(1);
  }

  console.log(`[Test Push] Looking up user: ${userEmail}`);

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.error(`[Test Push] User not found: ${userEmail}`);
    process.exit(1);
  }

  console.log(`[Test Push] Found user: ${user.fullName} (${user.id})`);

  // Send test notification
  const count = await sendPushNotificationToUser(user.id, {
    title: '🧪 בדיקת התראות',
    body: 'זוהי הודעת בדיקה. אם אתה רואה את זה, ההתראות עובדות!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'test-notification',
    data: {
      type: 'test',
      timestamp: new Date().toISOString(),
    },
  });

  console.log(`[Test Push] Sent ${count} notification(s)`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('[Test Push] Error:', error);
  process.exit(1);
});
