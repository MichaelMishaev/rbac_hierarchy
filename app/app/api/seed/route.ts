import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// IMPORTANT: Only allow in non-production or with secret key
const SEED_SECRET = process.env.SEED_SECRET || 'change-me-in-production';

export async function POST(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    const secret = authHeader?.replace('Bearer ', '');

    // Verify secret
    if (secret !== SEED_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid seed secret' },
        { status: 401 }
      );
    }

    console.log('🌱 Starting production seed with Hebrew demo data...');

    // Create SuperAdmin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@rbac.shop' },
      update: {
        fullName: 'Super Admin',
        passwordHash: hashedPassword,
      },
      create: {
        email: 'admin@rbac.shop',
        fullName: 'Super Admin',
        passwordHash: hashedPassword,
        role: 'SUPERADMIN',
        phone: '+972-50-000-0000',
      },
    });

    console.log('✅ SuperAdmin created:', superAdmin.email);

    // v1.4: Create Area Manager first (required for corporations)
    const areaManagerUser = await prisma.user.upsert({
      where: { email: 'areamanager@rbac.shop' },
      update: {},
      create: {
        email: 'areamanager@rbac.shop',
        fullName: 'מנהל מחוז מרכז',
        passwordHash: hashedPassword,
        role: 'AREA_MANAGER',
        phone: '+972-50-000-0001',
      },
    });

    const areaManager = await prisma.areaManager.upsert({
      where: { userId: areaManagerUser.id },
      update: {},
      create: {
        userId: areaManagerUser.id,
        regionCode: 'IL-CENTER',
        regionName: 'מרכז',
      },
    });

    console.log('✅ Area Manager created');

    // Create 3 corporations
    const corp1 = await prisma.city.upsert({
      where: { code: 'TECH' },
      update: {},
      create: {
        name: 'טכנולוגיות אלקטרה בע"מ',
        code: 'TECH',
        description: 'חברת טכנולוגיה מובילה בתחום האלקטרוניקה',
        isActive: true,
        areaManagerId: areaManager.id, // v1.4: Required
      },
    });

    const corp2 = await prisma.city.upsert({
      where: { code: 'BUILD' },
      update: {},
      create: {
        name: 'קבוצת בינוי ופיתוח בע"מ',
        code: 'BUILD',
        description: 'קבוצת בנייה ותשתיות מובילה',
        isActive: true,
        areaManagerId: areaManager.id, // v1.4: Required
      },
    });

    const corp3 = await prisma.city.upsert({
      where: { code: 'FOOD' },
      update: {},
      create: {
        name: 'רשת מזון טעים בע"מ',
        code: 'FOOD',
        description: 'רשת מסעדות וקייטרינג ארצית',
        isActive: true,
        areaManagerId: areaManager.id, // v1.4: Required
      },
    });

    console.log('✅ Corporations created');

    // Create managers
    const manager1 = await prisma.user.upsert({
      where: { email: 'david.cohen@electra-tech.co.il' },
      update: {},
      create: {
        email: 'david.cohen@electra-tech.co.il',
        fullName: 'דוד כהן',
        passwordHash: await bcrypt.hash('manager123', 10),
        role: 'CITY_COORDINATOR',
        phone: '+972-50-100-0001',
      },
    });

    // Create CorporationManager record for manager1
    await prisma.cityCoordinator.upsert({
      where: {
        cityId_userId: {
          cityId: corp1.id,
          userId: manager1.id,
        },
      },
      update: {},
      create: {
        cityId: corp1.id,
        userId: manager1.id,
        title: 'מנהל כללי',
        isActive: true,
      },
    });

    const manager2 = await prisma.user.upsert({
      where: { email: 'sarah.levi@binui.co.il' },
      update: {},
      create: {
        email: 'sarah.levi@binui.co.il',
        fullName: 'שרה לוי',
        passwordHash: await bcrypt.hash('manager123', 10),
        role: 'CITY_COORDINATOR',
        phone: '+972-50-200-0002',
      },
    });

    // Create CorporationManager record for manager2
    await prisma.cityCoordinator.upsert({
      where: {
        cityId_userId: {
          cityId: corp2.id,
          userId: manager2.id,
        },
      },
      update: {},
      create: {
        cityId: corp2.id,
        userId: manager2.id,
        title: 'מנהלת כללית',
        isActive: true,
      },
    });

    const manager3 = await prisma.user.upsert({
      where: { email: 'yossi.mizrahi@taim-food.co.il' },
      update: {},
      create: {
        email: 'yossi.mizrahi@taim-food.co.il',
        fullName: 'יוסי מזרחי',
        passwordHash: await bcrypt.hash('manager123', 10),
        role: 'CITY_COORDINATOR',
        phone: '+972-50-300-0003',
      },
    });

    // Create CorporationManager record for manager3
    await prisma.cityCoordinator.upsert({
      where: {
        cityId_userId: {
          cityId: corp3.id,
          userId: manager3.id,
        },
      },
      update: {},
      create: {
        cityId: corp3.id,
        userId: manager3.id,
        title: 'מנהל כללי',
        isActive: true,
      },
    });

    console.log('✅ Managers created');

    // Create sites
    const site1_1 = await prisma.neighborhood.create({
      data: {
        name: 'מפעל תל אביב',
        address: 'רחוב הברזל 1',
        city: 'תל אביב',
        country: 'ישראל',
        phone: '+972-3-500-1001',
        email: 'tlv@electra-tech.co.il',
        cityId: corp1.id,
        isActive: true,
      },
    });

    const site2_1 = await prisma.neighborhood.create({
      data: {
        name: 'אתר בנייה - פרויקט הרצליה',
        address: 'רחוב ויצמן 10',
        city: 'הרצליה',
        country: 'ישראל',
        phone: '+972-9-900-3001',
        email: 'herzliya@binui.co.il',
        cityId: corp2.id,
        isActive: true,
      },
    });

    const site3_1 = await prisma.neighborhood.create({
      data: {
        name: 'סניף דיזנגוף',
        address: 'רחוב דיזנגוף 100',
        city: 'תל אביב',
        country: 'ישראל',
        phone: '+972-3-700-5001',
        email: 'dizengoff@taim-food.co.il',
        cityId: corp3.id,
        isActive: true,
      },
    });

    console.log('✅ Sites created');

    // Create supervisors
    const supervisor1_1 = await prisma.user.upsert({
      where: { email: 'moshe.israeli@electra-tech.co.il' },
      update: {
        fullName: 'משה ישראלי',
        passwordHash: await bcrypt.hash('supervisor123', 10),
      },
      create: {
        email: 'moshe.israeli@electra-tech.co.il',
        fullName: 'משה ישראלי',
        passwordHash: await bcrypt.hash('supervisor123', 10),
        role: 'ACTIVIST_COORDINATOR',
        phone: '+972-50-400-1001',
      },
    });

    // Create Supervisor record for supervisor1_1
    const supervisorRecord1_1 = await prisma.activistCoordinator.upsert({
      where: {
        cityId_userId: {
          cityId: corp1.id,
          userId: supervisor1_1.id,
        },
      },
      update: {
        title: 'רכז שכונתי',
        isActive: true,
      },
      create: {
        cityId: corp1.id,
        userId: supervisor1_1.id,
        title: 'רכז שכונתי',
        isActive: true,
      },
    });

    const supervisor2_1 = await prisma.user.upsert({
      where: { email: 'avi.shapira@binui.co.il' },
      update: {
        fullName: 'אבי שפירא',
        passwordHash: await bcrypt.hash('supervisor123', 10),
      },
      create: {
        email: 'avi.shapira@binui.co.il',
        fullName: 'אבי שפירא',
        passwordHash: await bcrypt.hash('supervisor123', 10),
        role: 'ACTIVIST_COORDINATOR',
        phone: '+972-50-500-2001',
      },
    });

    // Create Supervisor record for supervisor2_1
    const supervisorRecord2_1 = await prisma.activistCoordinator.upsert({
      where: {
        cityId_userId: {
          cityId: corp2.id,
          userId: supervisor2_1.id,
        },
      },
      update: {
        title: 'רכז שכונתי',
        isActive: true,
      },
      create: {
        cityId: corp2.id,
        userId: supervisor2_1.id,
        title: 'רכז שכונתי',
        isActive: true,
      },
    });

    const supervisor3_1 = await prisma.user.upsert({
      where: { email: 'chen.amar@taim-food.co.il' },
      update: {
        fullName: 'חן עמר',
        passwordHash: await bcrypt.hash('supervisor123', 10),
      },
      create: {
        email: 'chen.amar@taim-food.co.il',
        fullName: 'חן עמר',
        passwordHash: await bcrypt.hash('supervisor123', 10),
        role: 'ACTIVIST_COORDINATOR',
        phone: '+972-50-600-3001',
      },
    });

    // Create Supervisor record for supervisor3_1
    const supervisorRecord3_1 = await prisma.activistCoordinator.upsert({
      where: {
        cityId_userId: {
          cityId: corp3.id,
          userId: supervisor3_1.id,
        },
      },
      update: {
        title: 'רכזת שכונתית',
        isActive: true,
      },
      create: {
        cityId: corp3.id,
        userId: supervisor3_1.id,
        title: 'רכזת שכונתית',
        isActive: true,
      },
    });

    console.log('✅ Supervisors created');

    // Assign supervisors to sites (v1.4 compliant with composite FKs)
    await prisma.activistCoordinatorNeighborhood.create({
      data: {
        cityId: corp1.id,
        activistCoordinatorId: supervisorRecord1_1.id,
        legacyActivistCoordinatorUserId: supervisor1_1.id,
        neighborhoodId: site1_1.id,
        assignedBy: manager1.id,
      },
    });

    await prisma.activistCoordinatorNeighborhood.create({
      data: {
        cityId: corp2.id,
        activistCoordinatorId: supervisorRecord2_1.id,
        legacyActivistCoordinatorUserId: supervisor2_1.id,
        neighborhoodId: site2_1.id,
        assignedBy: manager2.id,
      },
    });

    await prisma.activistCoordinatorNeighborhood.create({
      data: {
        cityId: corp3.id,
        activistCoordinatorId: supervisorRecord3_1.id,
        legacyActivistCoordinatorUserId: supervisor3_1.id,
        neighborhoodId: site3_1.id,
        assignedBy: manager3.id,
      },
    });

    console.log('✅ Supervisors assigned to sites');

    // Create workers
    await prisma.activist.create({
      data: {
        fullName: 'יוסי אבוחצירא',
        phone: '+972-50-700-0001',
        email: 'yossi.a@example.com',
        position: 'טכנאי אלקטרוניקה',
        cityId: corp1.id,
        neighborhoodId: site1_1.id,
        activistCoordinatorId: supervisorRecord1_1.id,
        startDate: new Date('2024-01-15'),
        isActive: true,
        tags: ['אלקטרוניקה', 'תעודת בטיחות'],
      },
    });

    await prisma.activist.create({
      data: {
        fullName: 'דני אברהם',
        phone: '+972-50-800-0001',
        email: 'danny.a@example.com',
        position: 'מנהל פרויקט',
        cityId: corp2.id,
        neighborhoodId: site2_1.id,
        activistCoordinatorId: supervisorRecord2_1.id,
        startDate: new Date('2023-12-01'),
        isActive: true,
        tags: ['ניהול פרויקטים', 'בנייה'],
      },
    });

    await prisma.activist.create({
      data: {
        fullName: 'יאיר כהן',
        phone: '+972-50-900-0001',
        email: 'yair.c@example.com',
        position: 'שף ראשי',
        cityId: corp3.id,
        neighborhoodId: site3_1.id,
        activistCoordinatorId: supervisorRecord3_1.id,
        startDate: new Date('2023-09-01'),
        isActive: true,
        tags: ['בישול', 'ניהול מטבח'],
      },
    });

    console.log('✅ Workers created');

    return NextResponse.json({
      success: true,
      message: '🎉 Production seed completed successfully!',
      data: {
        cities: 3,
        coordinators: 3,
        activistCoordinators: 3,
        neighborhoods: 3,
        activists: 3,
      },
      credentials: {
        superAdmin: 'admin@rbac.shop / admin123',
        coordinators: 'manager123',
        activistCoordinators: 'supervisor123',
      },
    });
  } catch (error: any) {
    console.error('❌ Seed failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
