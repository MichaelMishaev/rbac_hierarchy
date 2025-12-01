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
        name: 'Super Admin',
        password: hashedPassword,
      },
      create: {
        email: 'admin@rbac.shop',
        name: 'Super Admin',
        password: hashedPassword,
        role: 'SUPERADMIN',
        phone: '+972-50-000-0000',
      },
    });

    console.log('✅ SuperAdmin created:', superAdmin.email);

    // Create 3 corporations
    const corp1 = await prisma.corporation.upsert({
      where: { code: 'TECH' },
      update: {},
      create: {
        name: 'טכנולוגיות אלקטרה בע"מ',
        code: 'TECH',
        description: 'חברת טכנולוגיה מובילה בתחום האלקטרוניקה',
        email: 'info@electra-tech.co.il',
        phone: '+972-3-500-0001',
        address: 'רחוב הברזל 1, תל אביב',
        isActive: true,
      },
    });

    const corp2 = await prisma.corporation.upsert({
      where: { code: 'BUILD' },
      update: {},
      create: {
        name: 'קבוצת בינוי ופיתוח בע"מ',
        code: 'BUILD',
        description: 'קבוצת בנייה ותשתיות מובילה',
        email: 'info@binui.co.il',
        phone: '+972-3-600-0002',
        address: 'שדרות רוטשילד 50, תל אביב',
        isActive: true,
      },
    });

    const corp3 = await prisma.corporation.upsert({
      where: { code: 'FOOD' },
      update: {},
      create: {
        name: 'רשת מזון טעים בע"מ',
        code: 'FOOD',
        description: 'רשת מסעדות וקייטרינג ארצית',
        email: 'info@taim-food.co.il',
        phone: '+972-9-700-0003',
        address: 'דרך בגין 100, רמת גן',
        isActive: true,
      },
    });

    console.log('✅ Corporations created');

    // Create managers
    const manager1 = await prisma.user.upsert({
      where: { email: 'david.cohen@electra-tech.co.il' },
      update: {},
      create: {
        email: 'david.cohen@electra-tech.co.il',
        name: 'דוד כהן',
        password: await bcrypt.hash('manager123', 10),
        role: 'MANAGER',
        phone: '+972-50-100-0001',
      },
    });

    // Create CorporationManager record for manager1
    await prisma.corporationManager.upsert({
      where: {
        corporationId_userId: {
          corporationId: corp1.id,
          userId: manager1.id,
        },
      },
      update: {},
      create: {
        corporationId: corp1.id,
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
        name: 'שרה לוי',
        password: await bcrypt.hash('manager123', 10),
        role: 'MANAGER',
        phone: '+972-50-200-0002',
      },
    });

    // Create CorporationManager record for manager2
    await prisma.corporationManager.upsert({
      where: {
        corporationId_userId: {
          corporationId: corp2.id,
          userId: manager2.id,
        },
      },
      update: {},
      create: {
        corporationId: corp2.id,
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
        name: 'יוסי מזרחי',
        password: await bcrypt.hash('manager123', 10),
        role: 'MANAGER',
        phone: '+972-50-300-0003',
      },
    });

    // Create CorporationManager record for manager3
    await prisma.corporationManager.upsert({
      where: {
        corporationId_userId: {
          corporationId: corp3.id,
          userId: manager3.id,
        },
      },
      update: {},
      create: {
        corporationId: corp3.id,
        userId: manager3.id,
        title: 'מנהל כללי',
        isActive: true,
      },
    });

    console.log('✅ Managers created');

    // Create sites
    const site1_1 = await prisma.site.create({
      data: {
        name: 'מפעל תל אביב',
        address: 'רחוב הברזל 1',
        city: 'תל אביב',
        country: 'ישראל',
        phone: '+972-3-500-1001',
        email: 'tlv@electra-tech.co.il',
        corporationId: corp1.id,
        isActive: true,
      },
    });

    const site2_1 = await prisma.site.create({
      data: {
        name: 'אתר בנייה - פרויקט הרצליה',
        address: 'רחוב ויצמן 10',
        city: 'הרצליה',
        country: 'ישראל',
        phone: '+972-9-900-3001',
        email: 'herzliya@binui.co.il',
        corporationId: corp2.id,
        isActive: true,
      },
    });

    const site3_1 = await prisma.site.create({
      data: {
        name: 'סניף דיזנגוף',
        address: 'רחוב דיזנגוף 100',
        city: 'תל אביב',
        country: 'ישראל',
        phone: '+972-3-700-5001',
        email: 'dizengoff@taim-food.co.il',
        corporationId: corp3.id,
        isActive: true,
      },
    });

    console.log('✅ Sites created');

    // Create supervisors
    const supervisor1_1 = await prisma.user.upsert({
      where: { email: 'moshe.israeli@electra-tech.co.il' },
      update: {
        name: 'משה ישראלי',
        password: await bcrypt.hash('supervisor123', 10),
      },
      create: {
        email: 'moshe.israeli@electra-tech.co.il',
        name: 'משה ישראלי',
        password: await bcrypt.hash('supervisor123', 10),
        role: 'SUPERVISOR',
        phone: '+972-50-400-1001',
      },
    });

    // Create SiteManager record for supervisor1_1
    const siteManager1_1 = await prisma.siteManager.upsert({
      where: {
        corporationId_userId: {
          corporationId: corp1.id,
          userId: supervisor1_1.id,
        },
      },
      update: {
        title: 'מפקח אתר',
        isActive: true,
      },
      create: {
        corporationId: corp1.id,
        userId: supervisor1_1.id,
        title: 'מפקח אתר',
        isActive: true,
      },
    });

    const supervisor2_1 = await prisma.user.upsert({
      where: { email: 'avi.shapira@binui.co.il' },
      update: {
        name: 'אבי שפירא',
        password: await bcrypt.hash('supervisor123', 10),
      },
      create: {
        email: 'avi.shapira@binui.co.il',
        name: 'אבי שפירא',
        password: await bcrypt.hash('supervisor123', 10),
        role: 'SUPERVISOR',
        phone: '+972-50-500-2001',
      },
    });

    // Create SiteManager record for supervisor2_1
    const siteManager2_1 = await prisma.siteManager.upsert({
      where: {
        corporationId_userId: {
          corporationId: corp2.id,
          userId: supervisor2_1.id,
        },
      },
      update: {
        title: 'מפקח אתר',
        isActive: true,
      },
      create: {
        corporationId: corp2.id,
        userId: supervisor2_1.id,
        title: 'מפקח אתר',
        isActive: true,
      },
    });

    const supervisor3_1 = await prisma.user.upsert({
      where: { email: 'chen.amar@taim-food.co.il' },
      update: {
        name: 'חן עמר',
        password: await bcrypt.hash('supervisor123', 10),
      },
      create: {
        email: 'chen.amar@taim-food.co.il',
        name: 'חן עמר',
        password: await bcrypt.hash('supervisor123', 10),
        role: 'SUPERVISOR',
        phone: '+972-50-600-3001',
      },
    });

    // Create SiteManager record for supervisor3_1
    const siteManager3_1 = await prisma.siteManager.upsert({
      where: {
        corporationId_userId: {
          corporationId: corp3.id,
          userId: supervisor3_1.id,
        },
      },
      update: {
        title: 'מפקחת אתר',
        isActive: true,
      },
      create: {
        corporationId: corp3.id,
        userId: supervisor3_1.id,
        title: 'מפקחת אתר',
        isActive: true,
      },
    });

    console.log('✅ Supervisors created');

    // Assign supervisors to sites (v1.3 compliant with composite FKs)
    await prisma.supervisorSite.create({
      data: {
        corporationId: corp1.id,
        supervisorId: supervisor1_1.id,
        siteManagerId: siteManager1_1.id,
        siteId: site1_1.id,
        assignedBy: manager1.id,
      },
    });

    await prisma.supervisorSite.create({
      data: {
        corporationId: corp2.id,
        supervisorId: supervisor2_1.id,
        siteManagerId: siteManager2_1.id,
        siteId: site2_1.id,
        assignedBy: manager2.id,
      },
    });

    await prisma.supervisorSite.create({
      data: {
        corporationId: corp3.id,
        supervisorId: supervisor3_1.id,
        siteManagerId: siteManager3_1.id,
        siteId: site3_1.id,
        assignedBy: manager3.id,
      },
    });

    console.log('✅ Supervisors assigned to sites');

    // Create workers
    await prisma.worker.create({
      data: {
        name: 'יוסי אבוחצירא',
        phone: '+972-50-700-0001',
        email: 'yossi.a@example.com',
        position: 'טכנאי אלקטרוניקה',
        corporationId: corp1.id,
        siteId: site1_1.id,
        supervisorId: supervisor1_1.id,
        startDate: new Date('2024-01-15'),
        isActive: true,
        tags: ['אלקטרוניקה', 'תעודת בטיחות'],
      },
    });

    await prisma.worker.create({
      data: {
        name: 'דני אברהם',
        phone: '+972-50-800-0001',
        email: 'danny.a@example.com',
        position: 'מנהל פרויקט',
        corporationId: corp2.id,
        siteId: site2_1.id,
        supervisorId: supervisor2_1.id,
        startDate: new Date('2023-12-01'),
        isActive: true,
        tags: ['ניהול פרויקטים', 'בנייה'],
      },
    });

    await prisma.worker.create({
      data: {
        name: 'יאיר כהן',
        phone: '+972-50-900-0001',
        email: 'yair.c@example.com',
        position: 'שף ראשי',
        corporationId: corp3.id,
        siteId: site3_1.id,
        supervisorId: supervisor3_1.id,
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
        corporations: 3,
        managers: 3,
        supervisors: 3,
        sites: 3,
        workers: 3,
      },
      credentials: {
        superAdmin: 'admin@rbac.shop / admin123',
        managers: 'manager123',
        supervisors: 'supervisor123',
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
