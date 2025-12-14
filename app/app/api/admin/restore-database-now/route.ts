import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * POST /api/admin/restore-database-now
 *
 * Deletes all production data and reseeds the database.
 *
 * Security: Requires ADMIN_API_TOKEN in Authorization header
 *
 * curl -X POST https://app.rbac.shop/api/admin/restore-database-now \
 *   -H 'Authorization: Bearer YOUR_TOKEN'
 */
export async function POST(request: Request) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ADMIN_API_TOKEN || 'change-this-in-production';

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🗑️  Starting database restoration...');

    const prisma = new PrismaClient();

    try {
      console.log('Step 1: Deleting all production data...');

      // Delete all data in reverse dependency order
      await prisma.taskAssignment.deleteMany();
      await prisma.task.deleteMany();
      await prisma.attendanceRecord.deleteMany();
      await prisma.pushSubscription.deleteMany();
      await prisma.invitation.deleteMany();
      await prisma.userToken.deleteMany();
      await prisma.activist.deleteMany();
      await prisma.activistCoordinatorNeighborhood.deleteMany();
      await prisma.activistCoordinator.deleteMany();
      await prisma.cityCoordinator.deleteMany();
      await prisma.neighborhood.deleteMany();
      await prisma.city.deleteMany();
      await prisma.areaManager.deleteMany();
      await prisma.user.deleteMany();

      console.log('✅ All production data deleted');

      console.log('Step 2: Running seed script...');

      // Run the seed script
      const appDir = path.join(process.cwd());
      const { stdout, stderr } = await execAsync('npm run db:seed', {
        cwd: appDir,
        env: { ...process.env },
      });

      console.log('Seed output:', stdout);
      if (stderr) console.error('Seed errors:', stderr);

      console.log('✅ Database seeded successfully');

      // Get counts to verify
      const counts = {
        users: await prisma.user.count(),
        areaManagers: await prisma.areaManager.count(),
        cities: await prisma.city.count(),
        cityCoordinators: await prisma.cityCoordinator.count(),
        activistCoordinators: await prisma.activistCoordinator.count(),
        neighborhoods: await prisma.neighborhood.count(),
        activists: await prisma.activist.count(),
      };

      return NextResponse.json({
        success: true,
        message: 'Database restored successfully',
        counts,
        steps: [
          'Deleted all production data',
          'Ran seed script',
          'Verified data counts',
        ],
        warning: 'Default credentials active - change SuperAdmin password!',
        credentials: {
          superadmin: 'admin@election.test / admin123',
          areaManagers: 'All districts created with password: area123',
        },
      });

    } finally {
      await prisma.$disconnect();
    }

  } catch (error: any) {
    console.error('❌ Error during restoration:', error);

    return NextResponse.json(
      {
        error: 'Database restoration failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
