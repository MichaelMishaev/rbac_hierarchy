import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function restoreLocalToProduction() {
  console.log('🗑️  Step 1: Deleting all production data...');

  try {
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

    // Delete users (except SuperAdmin will be recreated by seed)
    await prisma.user.deleteMany();

    console.log('✅ All production data deleted');

    console.log('📦 Step 2: Running production seed script...');

    // Get the production DATABASE_URL from environment
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found in environment');
    }

    // Run the seed script
    const { stdout, stderr } = await execAsync('npm run db:seed', {
      env: { ...process.env },
      cwd: path.join(__dirname, '..'),
    });

    console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('✅ Production database restored with local data');
    console.log('\n🎉 Success! Production database now matches your local development database.');
    console.log('\n📝 Summary:');
    console.log('   - Old production data: DELETED');
    console.log('   - New data source: Local development database');
    console.log('   - Seed data: All 6 districts, 2 demo cities, 33 activists');
    console.log('\n⚠️  IMPORTANT: Change the SuperAdmin password!');
    console.log('   Default credentials: admin@election.test / admin123');

  } catch (error) {
    console.error('❌ Error during restoration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
restoreLocalToProduction()
  .then(() => {
    console.log('\n✨ Restoration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Restoration failed:', error);
    process.exit(1);
  });
