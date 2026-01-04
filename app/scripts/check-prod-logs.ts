import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLogs() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  console.log('📊 PRODUCTION ERROR LOG REPORT (Last Hour)');
  console.log('='.repeat(80));
  console.log(`Time Range: ${oneHourAgo.toISOString()} to ${new Date().toISOString()}`);
  console.log('='.repeat(80));
  console.log();

  // Get error summary
  const errorSummary = await prisma.$queryRaw`
    SELECT
      level,
      error_type as "errorType",
      COUNT(*)::int as count
    FROM error_logs
    WHERE created_at >= ${oneHourAgo}
    GROUP BY level, error_type
    ORDER BY count DESC
  `;

  console.log('🔴 ERROR SUMMARY:');
  console.table(errorSummary);
  console.log();

  // Get recent errors
  const recentErrors = await prisma.errorLog.findMany({
    where: {
      createdAt: {
        gte: oneHourAgo,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
    select: {
      id: true,
      level: true,
      errorType: true,
      message: true,
      code: true,
      url: true,
      ipAddress: true,
      userId: true,
      createdAt: true,
    },
  });

  console.log(`📋 RECENT ERRORS (${recentErrors.length} total):`);
  console.log('='.repeat(80));

  recentErrors.forEach((error, index) => {
    console.log(`\n[${index + 1}] ${error.level} - ${error.errorType}`);
    console.log(`    Time: ${error.createdAt.toISOString()}`);
    console.log(`    Message: ${error.message.substring(0, 200)}${error.message.length > 200 ? '...' : ''}`);
    if (error.code) console.log(`    Code: ${error.code}`);
    if (error.url) console.log(`    URL: ${error.url}`);
    if (error.ipAddress) console.log(`    IP: ${error.ipAddress}`);
    if (error.userId) console.log(`    User: ${error.userId}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ Report complete');

  await prisma.$disconnect();
}

checkLogs().catch((e) => {
  console.error('❌ Error generating report:', e);
  process.exit(1);
});
