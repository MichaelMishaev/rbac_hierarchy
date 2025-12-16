import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// This endpoint should ONLY be accessible in production with proper authentication
// Consider adding an admin-only auth check or secret token

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env['ADMIN_API_TOKEN'] || 'change-this-in-production';

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🗑️  Step 1: Deleting all production data...');

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

    console.log('📦 Step 2: Running production seed...');

    // Run the seed logic directly (copy from seed.ts)
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@election.test' },
      update: {},
      create: {
        email: 'admin@election.test',
        fullName: 'מנהל מערכת',
        passwordHash: hashedPassword,
        role: 'SUPERADMIN',
        phone: '+972-50-000-0000',
        isActive: true,
        isSuperAdmin: true,
      },
    });

    console.log('✅ SuperAdmin created');

    // Create all 6 Area Managers
    const areaManagers = [
      { email: 'sarah.cohen@telaviv-district.test', name: 'שרה כהן', region: 'מחוז תל אביב', code: 'TA-DISTRICT' },
      { email: 'manager@north-district.test', name: 'יעל גולן', region: 'מחוז הצפון', code: 'NORTH' },
      { email: 'manager@haifa-district.test', name: 'מיכאל כרמל', region: 'מחוז חיפה', code: 'HAIFA' },
      { email: 'manager@center-district.test', name: 'רונית שרון', region: 'מחוז המרכז', code: 'CENTER' },
      { email: 'manager@jerusalem-district.test', name: 'אבי הר-טוב', region: 'מחוז ירושלים', code: 'JERUSALEM' },
      { email: 'manager@south-district.test', name: 'תמר נגב', region: 'מחוז הדרום', code: 'SOUTH' },
    ];

    const createdAreaManagers = [];
    for (const am of areaManagers) {
      const user = await prisma.user.upsert({
        where: { email: am.email },
        update: {},
        create: {
          email: am.email,
          fullName: am.name,
          passwordHash: await bcrypt.hash('area123', 10),
          role: 'AREA_MANAGER',
          phone: `+972-54-200-000${areaManagers.indexOf(am) + 1}`,
          isActive: true,
        },
      });

      const areaManager = await prisma.areaManager.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          regionName: am.region,
          regionCode: am.code,
          isActive: true,
        },
      });

      createdAreaManagers.push(areaManager);
    }

    console.log('✅ All 6 Area Managers created');

    // Create Tel Aviv city with data (simplified - you can expand this)
    const telAvivYafo = await prisma.city.upsert({
      where: { code: 'TLV-YAFO' },
      update: {},
      create: {
        name: 'תל אביב-יפו',
        code: 'TLV-YAFO',
        description: 'קמפיין בחירות תל אביב-יפו',
        isActive: true,
        areaManagerId: createdAreaManagers[0].id, // Tel Aviv district
      },
    });

    console.log('✅ Tel Aviv city created');

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Production database restored successfully',
      summary: {
        superAdmin: 1,
        areaManagers: 6,
        cities: 1,
      },
    });

  } catch (error) {
    console.error('❌ Error during restoration:', error);
    await prisma.$disconnect();

    return NextResponse.json(
      {
        error: 'Failed to restore database',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
