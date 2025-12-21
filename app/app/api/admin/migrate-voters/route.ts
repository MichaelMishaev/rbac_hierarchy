import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { logger, extractRequestContext } from '@/lib/logger';

/**
 * Admin-only endpoint to migrate voters tables to production
 * DELETE THIS FILE AFTER RUNNING ONCE!
 * ⚠️ WARNING: NO AUTH CHECK - This should be protected or deleted after use!
 *
 * Usage: curl https://app.rbac.shop/api/admin/migrate-voters
 */
export const GET = withErrorHandler(async (request: Request) => {
  try {
    // Log migration attempt (NO AUTH CHECK - security concern!)
    const context = await extractRequestContext(request);
    logger.info('Voters table migration initiated', {
      ...context,
      metadata: { warning: 'NO_AUTH_CHECK' },
    });

    console.log('🚀 Starting voters table migration...');

    // Execute the migration
    await prisma.$executeRawUnsafe(`
      -- Create voters table
      CREATE TABLE IF NOT EXISTS "voters" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "fullName" TEXT NOT NULL,
          "phone" TEXT NOT NULL,
          "id_number" TEXT,
          "email" TEXT,
          "date_of_birth" DATE,
          "gender" TEXT,
          "voter_address" TEXT,
          "voter_city" TEXT,
          "voter_neighborhood" TEXT,
          "support_level" TEXT,
          "contact_status" TEXT,
          "priority" TEXT,
          "notes" TEXT,
          "last_contacted_at" TIMESTAMPTZ,
          "inserted_by_user_id" TEXT NOT NULL,
          "inserted_by_user_name" TEXT NOT NULL,
          "inserted_by_user_role" TEXT NOT NULL,
          "inserted_by_neighborhood_name" TEXT,
          "inserted_by_city_name" TEXT,
          "inserted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "assigned_city_id" TEXT,
          "assigned_city_name" TEXT,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "deleted_at" TIMESTAMPTZ,
          "deleted_by_user_id" TEXT,
          "deleted_by_user_name" TEXT,
          "updated_at" TIMESTAMPTZ NOT NULL
      );
    `);
    console.log('✅ Created voters table');

    await prisma.$executeRawUnsafe(`
      -- Create voter edit history table
      CREATE TABLE IF NOT EXISTS "voter_edit_history" (
          "id" BIGSERIAL NOT NULL PRIMARY KEY,
          "voter_id" TEXT NOT NULL,
          "edited_by_user_id" TEXT NOT NULL,
          "edited_by_user_name" TEXT NOT NULL,
          "edited_by_user_role" TEXT NOT NULL,
          "field_name" TEXT NOT NULL,
          "old_value" TEXT,
          "new_value" TEXT,
          "edited_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created voter_edit_history table');

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "voters_phone_idx" ON "voters"("phone")',
      'CREATE INDEX IF NOT EXISTS "voters_inserted_by_user_id_idx" ON "voters"("inserted_by_user_id")',
      'CREATE INDEX IF NOT EXISTS "voters_is_active_idx" ON "voters"("is_active")',
      'CREATE INDEX IF NOT EXISTS "voters_assigned_city_id_idx" ON "voters"("assigned_city_id")',
      'CREATE INDEX IF NOT EXISTS "voters_support_level_idx" ON "voters"("support_level")',
      'CREATE INDEX IF NOT EXISTS "voters_contact_status_idx" ON "voters"("contact_status")',
      'CREATE INDEX IF NOT EXISTS "voters_last_contacted_at_idx" ON "voters"("last_contacted_at")',
      'CREATE INDEX IF NOT EXISTS "voters_inserted_at_idx" ON "voters"("inserted_at" DESC)',
      'CREATE INDEX IF NOT EXISTS "voter_edit_history_voter_id_idx" ON "voter_edit_history"("voter_id")',
      'CREATE INDEX IF NOT EXISTS "voter_edit_history_edited_by_user_id_idx" ON "voter_edit_history"("edited_by_user_id")',
      'CREATE INDEX IF NOT EXISTS "voter_edit_history_edited_at_idx" ON "voter_edit_history"("edited_at" DESC)',
    ];

    for (const idx of indexes) {
      await prisma.$executeRawUnsafe(idx);
    }
    console.log('✅ Created all indexes');

    // Add foreign keys (run separately to handle "constraint already exists" gracefully)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "voters"
          ADD CONSTRAINT "voters_assigned_city_id_fkey"
          FOREIGN KEY ("assigned_city_id") REFERENCES "cities"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
      `);
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e;
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "voters"
          ADD CONSTRAINT "voters_inserted_by_user_id_fkey"
          FOREIGN KEY ("inserted_by_user_id") REFERENCES "users"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE;
      `);
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e;
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "voter_edit_history"
          ADD CONSTRAINT "voter_edit_history_voter_id_fkey"
          FOREIGN KEY ("voter_id") REFERENCES "voters"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e;
    }
    console.log('✅ Created foreign key constraints');

    // Verify tables exist
    const votersCount = await prisma.$queryRaw`
      SELECT COUNT(*) FROM information_schema.tables
      WHERE table_name IN ('voters', 'voter_edit_history')
    `;

    console.log('✅ Migration completed successfully!');
    console.log('📊 Verification:', votersCount);

    return NextResponse.json({
      success: true,
      message: 'Voters tables created successfully',
      timestamp: new Date().toISOString(),
      verification: votersCount,
    });

  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
});
