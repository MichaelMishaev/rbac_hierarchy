import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyProduction() {
  try {
    console.log('\n📊 Production Database Verification\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // 1. Count users
    const [totalUsers, superAdmins, areaManagers, cityCoordinators, activistCoordinators] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isSuperAdmin: true } }),
      prisma.areaManager.count(),
      prisma.cityCoordinator.count(),
      prisma.activistCoordinator.count(),
    ]);

    console.log('👥 **USERS**');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   SuperAdmin: ${superAdmins}`);
    console.log(`   Area Managers: ${areaManagers}`);
    console.log(`   City Coordinators: ${cityCoordinators}`);
    console.log(`   Activist Coordinators: ${activistCoordinators}`);
    console.log('');

    // 2. List all users
    const users = await prisma.user.findMany({
      orderBy: [
        { isSuperAdmin: 'desc' },
        { email: 'asc' },
      ],
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isSuperAdmin: true,
        isActive: true,
      },
    });

    console.log('📋 **USER LIST**');
    users.forEach((user, index) => {
      const badge = user.isSuperAdmin ? '🔐 SUPER' : user.role === 'AREA_MANAGER' ? '🗺️  AREA' : '👤';
      console.log(`   ${index + 1}. ${badge} ${user.fullName} (${user.email})`);
      console.log(`      Role: ${user.role}, Active: ${user.isActive}`);
    });
    console.log('');

    // 3. Count cities
    const totalCities = await prisma.city.count();
    console.log(`🏙️  **CITIES**: ${totalCities} cities`);
    console.log('');

    // 4. Count neighborhoods
    const totalNeighborhoods = await prisma.neighborhood.count();
    console.log(`📍 **NEIGHBORHOODS**: ${totalNeighborhoods} neighborhoods`);
    console.log('');

    // 5. Count activists
    const totalActivists = await prisma.activist.count();
    console.log(`🎯 **ACTIVISTS**: ${totalActivists} activists`);
    console.log('');

    // 6. Count tasks
    const totalTasks = await prisma.task.count();
    console.log(`📋 **TASKS**: ${totalTasks} tasks`);
    console.log('');

    // 7. Count attendance records
    const totalAttendance = await prisma.attendanceRecord.count();
    console.log(`📅 **ATTENDANCE**: ${totalAttendance} records`);
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Production verification completed!');
    console.log('');

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyProduction()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
