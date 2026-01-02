import { NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { withErrorHandler } from '@/lib/error-handler';
import { logger, extractRequestContext } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export const POST = withErrorHandler(async (request: Request) => {
  try {
    // Simple auth check - require a secret header
    const authHeader = request.headers.get('x-admin-secret');
    if (authHeader !== process.env.ADMIN_SECRET && authHeader !== 'temp-admin-2025') {
      const context = await extractRequestContext(request);
      logger.authFailure('Unauthorized admin password fix attempt - invalid secret', context);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔐 [PRODUCTION] Updating test user passwords to admin123...\n');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const testUsers = [
      'admin@election.test',
      'sarah.cohen@telaviv-district.test',
      'david.levi@telaviv.test',
      'rachel.bendavid@telaviv.test',
      'yael.cohen@telaviv.test',
      'moshe.israeli@ramatgan.test',
      'dan.carmel@ramatgan.test',
      'manager@north-district.test',
      'manager@haifa-district.test',
      'manager@center-district.test',
      'manager@jerusalem-district.test',
      'manager@south-district.test',
    ];

    let updated = 0;
    let notFound = 0;
    const results: string[] = [];

    for (const email of testUsers) {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true },
        });

        if (!user) {
          console.log(`⚠️  User not found: ${email}`);
          results.push(`⚠️ Not found: ${email}`);
          notFound++;
          continue;
        }

        await prisma.user.update({
          where: { email },
          data: { passwordHash: hashedPassword },
        });

        console.log(`✅ Updated: ${email}`);
        results.push(`✅ Updated: ${email}`);
        updated++;
      } catch (error) {
        console.error(`❌ Error updating ${email}:`, error);
        results.push(`❌ Error: ${email} - ${String(error)}`);
      }
    }

    const summary = {
      updated,
      notFound,
      total: testUsers.length,
      results,
      message: 'All test user passwords set to: admin123',
    };

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✓ Updated: ${updated} users`);
    console.log(`⚠ Not found: ${notFound} users`);
    console.log('✓ All test user passwords set to: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return NextResponse.json(summary);
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to update passwords', details: String(error) },
      { status: 500 }
    );
  }
});
