/**
 * Generate VAPID Keys for Web Push Notifications
 * Run once: node scripts/generate-vapid-keys.ts
 * Copy output to .env.local
 */

import * as webpush from 'web-push';

function generateVapidKeys() {
  console.log('🔐 Generating VAPID keys for web push notifications...\n');

  const vapidKeys = webpush.generateVAPIDKeys();

  console.log('✅ VAPID keys generated successfully!\n');
  console.log('Copy these to your .env.local file:\n');
  console.log('# Web Push Notifications (VAPID Keys)');
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
  console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
  console.log(`VAPID_SUBJECT="mailto:admin@hierarchy-platform.com"`);
  console.log('\n⚠️  IMPORTANT: Keep VAPID_PRIVATE_KEY secret! Never commit to git.\n');

  return vapidKeys;
}

// Run if executed directly
if (require.main === module) {
  generateVapidKeys();
}

export default generateVapidKeys;
