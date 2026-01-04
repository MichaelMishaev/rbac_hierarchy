import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSessionEvents() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  console.log('📊 SESSION EVENTS REPORT (Last Hour)');
  console.log('='.repeat(80));
  console.log(`Time Range: ${oneHourAgo.toISOString()} to ${new Date().toISOString()}`);
  console.log('='.repeat(80));
  console.log();

  // Check if table exists
  try {
    const events = await prisma.sessionEvent.findMany({
      where: {
        createdAt: {
          gte: oneHourAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    console.log(`📋 RECENT SESSION EVENTS (${events.length} total):`);
    console.log('='.repeat(80));

    events.forEach((event, index) => {
      console.log(`\n[${index + 1}] ${event.eventType}`);
      console.log(`    Time: ${event.createdAt.toISOString()}`);
      console.log(`    Session: ${event.sessionId}`);
      if (event.userId) console.log(`    User: ${event.userId}`);
      if (event.metadata) {
        const meta = event.metadata as any;
        console.log(`    Metadata:`, JSON.stringify(meta, null, 2).substring(0, 200));
      }
    });

    console.log('\n' + '='.repeat(80));
  } catch (e: any) {
    console.log('⚠️  SessionEvent table might not exist yet');
    console.log(`Error: ${e.message}`);
  }

  // Check audit logs
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      createdAt: {
        gte: oneHourAgo,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });

  console.log('\n\n📋 AUDIT LOG EVENTS (Last Hour):');
  console.log('='.repeat(80));
  console.log(`Total: ${auditLogs.length}`);

  auditLogs.forEach((log, index) => {
    console.log(`\n[${index + 1}] ${log.action} ${log.entity}`);
    console.log(`    Time: ${log.createdAt.toISOString()}`);
    console.log(`    Entity ID: ${log.entityId}`);
    if (log.userEmail) console.log(`    User: ${log.userEmail}`);
    if (log.cityId) console.log(`    City: ${log.cityId}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ Report complete');

  await prisma.$disconnect();
}

checkSessionEvents().catch((e) => {
  console.error('❌ Error generating report:', e);
  process.exit(1);
});
