import { prisma } from '../lib/prisma';

async function check() {
  console.log('🔍 Checking push subscriptions...\n');

  const subs = await prisma.pushSubscription.findMany({
    select: {
      id: true,
      userId: true,
      endpoint: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${subs.length} push subscriptions\n`);

  if (subs.length === 0) {
    console.log('❌ NO PUSH SUBSCRIPTIONS FOUND!');
    console.log('\n⚠️  This is why push notifications are not working.');
    console.log('\n📝 Solution:');
    console.log('   1. Open https://app.rbac.shop on mobile');
    console.log('   2. Login');
    console.log('   3. Go to Settings (⚙️)');
    console.log('   4. Toggle "התראות דחיפה" (Push Notifications) ON');
    console.log('   5. Allow when browser prompts');
    console.log('\n   After enabling, this script should show 1+ subscriptions.');
  } else {
    console.log('✅ Push subscriptions found:\n');
    subs.forEach((sub, i) => {
      const daysSince = Math.floor((Date.now() - sub.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`${i + 1}. User ID: ${sub.userId}`);
      console.log(`   Created: ${sub.createdAt.toISOString()} (${daysSince} days ago)`);
      console.log(`   Last used: ${sub.lastUsedAt?.toISOString() || 'Never'}`);
      console.log(`   Endpoint: ${sub.endpoint.substring(0, 60)}...`);
      console.log();
    });
  }

  await prisma.$disconnect();
}

check().catch(console.error);
