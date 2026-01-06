/**
 * SAFE Super Admin Creation Script
 *
 * ✅ COMPLIES WITH: INV-SEC-004 (No hardcoded credentials)
 * ✅ Uses environment variables for all sensitive data
 * ✅ Works with both local and production databases
 * ✅ Audit trail logged
 *
 * Purpose: Create or update a user to SuperAdmin role
 * Use case: Bootstrap production SuperAdmin, recover access
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// ✅ NO hardcoded credentials - uses environment variables
const prisma = new PrismaClient();

interface SuperAdminConfig {
  email: string;
  password: string;
  fullName: string;
}

/**
 * Create or update a user to SuperAdmin role
 * SAFE: Uses environment variables for all credentials
 */
async function createOrUpdateSuperAdmin(config: SuperAdminConfig) {
  const { email, password, fullName } = config;

  console.log('\n🔧 Safe SuperAdmin Creation Script\n');
  console.log(`📧 Email: ${email}`);
  console.log(`👤 Full Name: ${fullName}`);
  console.log(`🔗 Database: ${process.env.NODE_ENV || 'development'}\n`);

  try {
    // Step 1: Check if user already exists
    console.log('1️⃣  Checking if user already exists...');
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isSuperAdmin: true,
        isActive: true,
      },
    });

    if (existingUser) {
      console.log('   ℹ️  User found!');
      console.table({
        ID: existingUser.id,
        Email: existingUser.email,
        Role: existingUser.role,
        'Is SuperAdmin': existingUser.isSuperAdmin,
        'Is Active': existingUser.isActive,
      });

      // Step 2: Update to SuperAdmin if not already
      if (!existingUser.isSuperAdmin || existingUser.role !== 'SUPERADMIN') {
        console.log('\n2️⃣  Promoting user to SUPERADMIN...');

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);

        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'SUPERADMIN',
            isSuperAdmin: true,
            passwordHash: hashedPassword, // Update password
            isActive: true, // Ensure active
            fullName, // Update full name if provided
          },
        });

        console.log('   ✅ User promoted to SUPERADMIN successfully!\n');

        // Audit log
        console.log('3️⃣  Logging audit trail...');
        await prisma.auditLog.create({
          data: {
            userId: updated.id,
            action: 'USER_PROMOTED_TO_SUPERADMIN',
            entity: 'User',
            entityId: updated.id,
            before: {
              role: existingUser.role,
              isSuperAdmin: existingUser.isSuperAdmin,
            },
            after: {
              role: 'SUPERADMIN',
              isSuperAdmin: true,
            },
            userEmail: updated.email,
            userRole: updated.role,
          },
        });

        console.log('   ✅ Audit log created\n');

        return updated;
      } else {
        console.log('   ℹ️  User is already a SUPERADMIN (no changes needed)\n');
        return existingUser;
      }
    }

    // Step 3: Create new SuperAdmin user
    console.log('\n2️⃣  User not found, creating new SUPERADMIN...');

    const hashedPassword = await bcrypt.hash(password, 12);

    const superAdmin = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        role: 'SUPERADMIN',
        isSuperAdmin: true,
        isActive: true,
      },
    });

    console.log('   ✅ SuperAdmin created successfully!\n');

    // Audit log
    console.log('3️⃣  Logging audit trail...');
    await prisma.auditLog.create({
      data: {
        userId: superAdmin.id,
        action: 'SUPERADMIN_CREATED',
        entity: 'User',
        entityId: superAdmin.id,
        after: {
          role: 'SUPERADMIN',
          isSuperAdmin: true,
          email,
        },
        userEmail: superAdmin.email,
        userRole: superAdmin.role,
      },
    });

    console.log('   ✅ Audit log created\n');

    // Display result
    console.log('═══════════════════════════════════');
    console.log('✅ SUPERADMIN CREATED/UPDATED');
    console.log('═══════════════════════════════════');
    console.table({
      'User ID': superAdmin.id,
      Email: superAdmin.email,
      'Full Name': superAdmin.fullName,
      Role: superAdmin.role,
      'Is SuperAdmin': superAdmin.isSuperAdmin,
    });
    console.log('═══════════════════════════════════');
    console.log('🎉 You can now login with the provided credentials!\n');

    return superAdmin;
  } catch (error) {
    console.error('\n❌ Error creating/updating SuperAdmin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// CLI Execution with Environment Variables
// ============================================================================

async function main() {
  // ✅ Read from environment variables (NO hardcoded values)
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  const fullName = process.env.SUPERADMIN_FULLNAME || 'Super Admin';

  // Validation
  if (!email || !password) {
    console.error('\n❌ ERROR: Missing required environment variables!\n');
    console.log('Required:');
    console.log('  SUPERADMIN_EMAIL        - Email address for SuperAdmin');
    console.log('  SUPERADMIN_PASSWORD     - Password for SuperAdmin');
    console.log('  SUPERADMIN_FULLNAME     - Full name (optional, defaults to "Super Admin")\n');
    console.log('Example usage:');
    console.log('  SUPERADMIN_EMAIL=admin@example.com \\');
    console.log('  SUPERADMIN_PASSWORD=SecurePass123! \\');
    console.log('  SUPERADMIN_FULLNAME="System Administrator" \\');
    console.log('  npx tsx scripts/safe-add-superadmin.ts\n');
    console.log('Or add to .env.local:');
    console.log('  SUPERADMIN_EMAIL=admin@example.com');
    console.log('  SUPERADMIN_PASSWORD=SecurePass123!');
    console.log('  SUPERADMIN_FULLNAME=System Administrator\n');
    process.exit(1);
  }

  // Password strength validation
  if (password.length < 8) {
    console.error('❌ ERROR: Password must be at least 8 characters long');
    process.exit(1);
  }

  await createOrUpdateSuperAdmin({
    email,
    password,
    fullName,
  });
}

// Run the script
main()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

/**
 * USAGE EXAMPLES:
 *
 * 1. Using environment variables (RECOMMENDED):
 *    SUPERADMIN_EMAIL=admin@example.com \
 *    SUPERADMIN_PASSWORD=SecurePass123! \
 *    SUPERADMIN_FULLNAME="System Admin" \
 *    npx tsx scripts/safe-add-superadmin.ts
 *
 * 2. Using .env.local file:
 *    # Add to app/.env.local:
 *    SUPERADMIN_EMAIL=admin@example.com
 *    SUPERADMIN_PASSWORD=SecurePass123!
 *    SUPERADMIN_FULLNAME=System Admin
 *
 *    # Then run:
 *    npx tsx scripts/safe-add-superadmin.ts
 *
 * 3. Production (Railway):
 *    # Set environment variables in Railway dashboard:
 *    SUPERADMIN_EMAIL=admin@election.com
 *    SUPERADMIN_PASSWORD=StrongProductionPassword!
 *    SUPERADMIN_FULLNAME=Production Admin
 *
 *    # Run via Railway CLI:
 *    railway run npx tsx scripts/safe-add-superadmin.ts
 *
 * SECURITY NOTES:
 * - NEVER commit credentials to git
 * - Use strong passwords (8+ chars, mixed case, numbers, symbols)
 * - Rotate credentials regularly
 * - Use different passwords for local vs production
 * - All operations are logged to audit_logs table
 */
