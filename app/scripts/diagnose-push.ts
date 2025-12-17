/**
 * Diagnostic script for push notifications
 *
 * Run with: npx tsx scripts/diagnose-push.ts
 */

import { prisma } from '../lib/prisma';
import { areVapidKeysConfigured } from '../lib/send-push-notification';

async function diagnosePush() {
  console.log('🔍 Push Notifications Diagnostic Tool\n');

  // Check 1: VAPID Keys
  console.log('1️⃣ VAPID Keys Configuration:');
  const vapidConfigured = areVapidKeysConfigured();
  console.log(`   ✅ VAPID Keys Configured: ${vapidConfigured ? 'YES' : 'NO'}`);

  if (vapidConfigured) {
    console.log(`   ✅ NEXT_PUBLIC_VAPID_PUBLIC_KEY: ${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.substring(0, 20)}...`);
    console.log(`   ✅ VAPID_PRIVATE_KEY: ${process.env.VAPID_PRIVATE_KEY?.substring(0, 20)}...`);
    console.log(`   ✅ VAPID_SUBJECT: ${process.env.VAPID_SUBJECT}`);
  } else {
    console.log('   ❌ Missing VAPID environment variables!');
    console.log(`   - NEXT_PUBLIC_VAPID_PUBLIC_KEY: ${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'Set' : 'NOT SET'}`);
    console.log(`   - VAPID_PRIVATE_KEY: ${process.env.VAPID_PRIVATE_KEY ? 'Set' : 'NOT SET'}`);
    console.log(`   - VAPID_SUBJECT: ${process.env.VAPID_SUBJECT ? 'Set' : 'NOT SET'}`);
  }

  console.log();

  // Check 2: Push Subscriptions
  console.log('2️⃣ Push Subscriptions in Database:');
  const subscriptions = await prisma.pushSubscription.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`   Total subscriptions: ${subscriptions.length}`);

  if (subscriptions.length === 0) {
    console.log('   ❌ No push subscriptions found!');
    console.log('   ⚠️  Users need to enable push notifications in Settings');
  } else {
    console.log('   ✅ Active subscriptions:\n');
    subscriptions.forEach((sub, idx) => {
      const daysSinceCreated = Math.floor((Date.now() - sub.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysSinceUsed = sub.lastUsedAt
        ? Math.floor((Date.now() - sub.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      console.log(`   ${idx + 1}. User: ${sub.user.email} (${sub.user.role})`);
      console.log(`      - Created: ${sub.createdAt.toISOString()} (${daysSinceCreated} days ago)`);
      console.log(`      - Last used: ${sub.lastUsedAt ? `${sub.lastUsedAt.toISOString()} (${daysSinceUsed} days ago)` : 'Never'}`);
      console.log(`      - Endpoint: ${sub.endpoint.substring(0, 50)}...`);
      console.log();
    });
  }

  // Check 3: Recent Tasks
  console.log('3️⃣ Recent Tasks (Last 5):');
  const tasks = await prisma.task.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      sender: {
        select: {
          email: true,
          name: true,
          role: true,
        },
      },
      assignments: {
        select: {
          targetUserId: true,
          status: true,
        },
      },
    },
  });

  if (tasks.length === 0) {
    console.log('   ℹ️  No tasks found');
  } else {
    tasks.forEach((task, idx) => {
      console.log(`   ${idx + 1}. Task ID: ${task.id}`);
      console.log(`      - Sender: ${task.sender.email} (${task.sender.role})`);
      console.log(`      - Body: ${task.body.substring(0, 50)}...`);
      console.log(`      - Recipients: ${task.recipientsCount} (${task.assignments.length} assignments)`);
      console.log(`      - Created: ${task.createdAt.toISOString()}`);
      console.log();
    });
  }

  // Check 4: Users with roles that can receive tasks
  console.log('4️⃣ Users (Potential Recipients):');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  console.log(`   Total active users: ${users.filter(u => u.isActive).length}`);
  console.log('   Recent users:\n');
  users.forEach((user, idx) => {
    const hasPushSub = subscriptions.some(s => s.userId === user.id);
    console.log(`   ${idx + 1}. ${user.email} (${user.role})`);
    console.log(`      - Active: ${user.isActive ? 'Yes' : 'No'}`);
    console.log(`      - Push subscription: ${hasPushSub ? '✅ YES' : '❌ NO'}`);
  });

  console.log();

  // Summary
  console.log('📊 SUMMARY:');
  console.log(`   - VAPID configured: ${vapidConfigured ? '✅' : '❌'}`);
  console.log(`   - Push subscriptions: ${subscriptions.length} ${subscriptions.length === 0 ? '❌' : '✅'}`);
  console.log(`   - Recent tasks: ${tasks.length}`);
  console.log(`   - Active users: ${users.filter(u => u.isActive).length}`);
  console.log();

  if (!vapidConfigured) {
    console.log('⚠️  ACTION REQUIRED: Configure VAPID environment variables');
  }

  if (subscriptions.length === 0) {
    console.log('⚠️  ACTION REQUIRED: Users need to enable push notifications in Settings');
    console.log('   1. Login to app');
    console.log('   2. Go to Settings');
    console.log('   3. Toggle "התראות דחיפה" ON');
    console.log('   4. Allow when browser prompts');
  }

  if (vapidConfigured && subscriptions.length > 0) {
    console.log('✅ Push notifications should be working!');
    console.log('   If still not receiving notifications:');
    console.log('   1. Check Railway logs for "[Push Send]" messages');
    console.log('   2. Verify browser notification permissions');
    console.log('   3. Check device Do Not Disturb / Focus mode');
  }
}

diagnosePush()
  .then(() => {
    console.log('\n✅ Diagnostic complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnostic failed:', error);
    process.exit(1);
  });
