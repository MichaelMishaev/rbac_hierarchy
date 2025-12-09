import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seed with full hierarchy...');

  // ========================
  // LEVEL 1: SuperAdmin
  // ========================
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@rbac.shop' },
    update: {},
    create: {
      email: 'admin@rbac.shop',
      fullName: 'Super Admin',
      passwordHash: hashedPassword,
      role: 'SUPERADMIN',
      phone: '+972-50-000-0000',
      isActive: true,
      isSuperAdmin: true,
    },
  });

  console.log('✅ Level 1: SuperAdmin created:', superAdmin.email);

  // ========================
  // LEVEL 2: Area Manager
  // ========================
  const areaManagerUser = await prisma.user.upsert({
    where: { email: 'regional@rbac.shop' },
    update: {},
    create: {
      email: 'regional@rbac.shop',
      fullName: 'יוסי כהן',
      passwordHash: await bcrypt.hash('area123', 10),
      role: 'AREA_MANAGER',
      phone: '+972-50-100-0000',
      isActive: true,
    },
  });

  const areaManager = await prisma.areaManager.upsert({
    where: { userId: areaManagerUser.id },
    update: {},
    create: {
      userId: areaManagerUser.id,
      regionName: 'מרכז ישראל',
      regionCode: 'IL-CENTRAL',
      isActive: true,
      metadata: {
        description: 'מנהל אזורי אחראי על כל התאגידים במרכז הארץ',
      },
    },
  });

  console.log('✅ Level 2: Area Manager created:', areaManager.regionName);

  // ========================
  // LEVEL 3-7: Multiple Corporations with Full Hierarchy
  // ========================

  // Corporation 1: טכנולוגיות אלקטרה
  const corp1 = await prisma.city.upsert({
    where: { code: 'ELECTRA' },
    update: {},
    create: {
      name: 'טכנולוגיות אלקטרה בע"מ',
      code: 'ELECTRA',
      description: 'חברת טכנולוגיה מובילה בתחום האלקטרוניקה והמחשוב',
      email: 'info@electra-tech.co.il',
      phone: '+972-3-555-0001',
      address: 'רחוב רוטשילד 1, תל אביב',
      isActive: true,
      areaManagerId: areaManager.id,
    },
  });

  // Corporation 1 - Manager
  const manager1User = await prisma.user.upsert({
    where: { email: 'david.cohen@electra-tech.co.il' },
    update: {},
    create: {
      email: 'david.cohen@electra-tech.co.il',
      fullName: 'דוד כהן',
      passwordHash: await bcrypt.hash('manager123', 10),
      role: 'CITY_COORDINATOR',
      phone: '+972-50-111-0001',
      isActive: true,
    },
  });

  await prisma.cityCoordinator.upsert({
    where: {
      cityId_userId: {
        cityId: corp1.id,
        userId: manager1User.id,
      },
    },
    update: {},
    create: {
      cityId: corp1.id,
      userId: manager1User.id,
      title: 'מנהל כללי',
      isActive: true,
    },
  });

  // Corporation 1 - Sites and Supervisors
  const site1 = await prisma.neighborhood.upsert({
    where: { id: 'electra-tlv-hq' },
    update: {},
    create: {
      id: 'electra-tlv-hq',
      name: 'משרד ראשי - תל אביב',
      address: 'רחוב רוטשילד 1',
      city: 'תל אביב',
      country: 'ישראל',
      phone: '+972-3-555-0101',
      email: 'tlv@electra-tech.co.il',
      cityId: corp1.id,
      isActive: true,
    },
  });

  const site2 = await prisma.neighborhood.upsert({
    where: { id: 'electra-haifa' },
    update: {},
    create: {
      id: 'electra-haifa',
      name: 'סניף חיפה',
      address: 'שדרות הנשיא 50',
      city: 'חיפה',
      country: 'ישראל',
      phone: '+972-4-855-0201',
      email: 'haifa@electra-tech.co.il',
      cityId: corp1.id,
      isActive: true,
    },
  });

  // Supervisor for Corp 1
  const supervisor1User = await prisma.user.upsert({
    where: { email: 'moshe.israeli@electra-tech.co.il' },
    update: {},
    create: {
      email: 'moshe.israeli@electra-tech.co.il',
      fullName: 'משה ישראלי',
      passwordHash: await bcrypt.hash('supervisor123', 10),
      role: 'ACTIVIST_COORDINATOR',
      phone: '+972-50-222-0001',
      isActive: true,
    },
  });

  const supervisor1 = await prisma.activistCoordinator.upsert({
    where: {
      cityId_userId: {
        cityId: corp1.id,
        userId: supervisor1User.id,
      },
    },
    update: {},
    create: {
      cityId: corp1.id,
      userId: supervisor1User.id,
      title: 'מפקח ראשי',
      isActive: true,
    },
  });

  // Assign supervisor to sites
  await prisma.activistCoordinatorNeighborhood.upsert({
    where: {
      activistCoordinatorId_neighborhoodId: {
        activistCoordinatorId: supervisor1.id,
        neighborhoodId: site1.id,
      },
    },
    update: {},
    create: {
      cityId: corp1.id,
      activistCoordinatorId: supervisor1.id,
      neighborhoodId: site1.id,
      legacyActivistCoordinatorUserId: supervisor1User.id,
      assignedBy: superAdmin.id,
    },
  });

  // Workers for Corp 1
  await prisma.activist.create({
    data: {
      fullName: 'רונית לוי',
      phone: '+972-50-333-0001',
      email: 'ronit.levi@example.com',
      position: 'מהנדסת תוכנה',
      cityId: corp1.id,
      neighborhoodId: site1.id,
      activistCoordinatorId: supervisor1.id,
      startDate: new Date('2024-01-15'),
      isActive: true,
      tags: ['Full Stack', 'React', 'Node.js'],
    },
  });

  await prisma.activist.create({
    data: {
      fullName: 'אבי כהן',
      phone: '+972-50-333-0002',
      email: 'avi.cohen@example.com',
      position: 'טכנאי אלקטרוניקה',
      cityId: corp1.id,
      neighborhoodId: site1.id,
      activistCoordinatorId: supervisor1.id,
      startDate: new Date('2024-02-01'),
      isActive: true,
      tags: ['Electronics', 'Certified'],
    },
  });

  console.log('✅ Corporation 1: טכנולוגיות אלקטרה - Complete hierarchy created');

  // Corporation 2: קבוצת בינוי
  const corp2 = await prisma.city.upsert({
    where: { code: 'BINUY' },
    update: {},
    create: {
      name: 'קבוצת בינוי בע"מ',
      code: 'BINUY',
      description: 'קבוצת בנייה ונדל"ן מובילה בישראל',
      email: 'info@binuy.co.il',
      phone: '+972-3-666-0001',
      address: 'דרך מנחם בגין 125, תל אביב',
      isActive: true,
      areaManagerId: areaManager.id,
    },
  });

  // Corporation 2 - Manager
  const manager2User = await prisma.user.upsert({
    where: { email: 'sara.levi@binuy.co.il' },
    update: {},
    create: {
      email: 'sara.levi@binuy.co.il',
      fullName: 'שרה לוי',
      passwordHash: await bcrypt.hash('manager123', 10),
      role: 'CITY_COORDINATOR',
      phone: '+972-50-111-0002',
      isActive: true,
    },
  });

  await prisma.cityCoordinator.upsert({
    where: {
      cityId_userId: {
        cityId: corp2.id,
        userId: manager2User.id,
      },
    },
    update: {},
    create: {
      cityId: corp2.id,
      userId: manager2User.id,
      title: 'מנהלת תפעול',
      isActive: true,
    },
  });

  // Corporation 2 - Sites
  const site3 = await prisma.neighborhood.upsert({
    where: { id: 'binuy-project-a' },
    update: {},
    create: {
      id: 'binuy-project-a',
      name: 'אתר בנייה - פרויקט א',
      address: 'שדרות יצחק רבין 10',
      city: 'תל אביב',
      country: 'ישראל',
      phone: '+972-3-666-0101',
      email: 'projecta@binuy.co.il',
      cityId: corp2.id,
      isActive: true,
    },
  });

  const site4 = await prisma.neighborhood.upsert({
    where: { id: 'binuy-project-b' },
    update: {},
    create: {
      id: 'binuy-project-b',
      name: 'אתר בנייה - פרויקט ב',
      address: 'כביש החוף 45',
      city: 'הרצליה',
      country: 'ישראל',
      phone: '+972-9-955-0201',
      email: 'projectb@binuy.co.il',
      cityId: corp2.id,
      isActive: true,
    },
  });

  // Supervisor for Corp 2
  const supervisor2User = await prisma.user.upsert({
    where: { email: 'yossi.mizrahi@binuy.co.il' },
    update: {},
    create: {
      email: 'yossi.mizrahi@binuy.co.il',
      fullName: 'יוסי מזרחי',
      passwordHash: await bcrypt.hash('supervisor123', 10),
      role: 'ACTIVIST_COORDINATOR',
      phone: '+972-50-222-0002',
      isActive: true,
    },
  });

  const supervisor2 = await prisma.activistCoordinator.upsert({
    where: {
      cityId_userId: {
        cityId: corp2.id,
        userId: supervisor2User.id,
      },
    },
    update: {},
    create: {
      cityId: corp2.id,
      userId: supervisor2User.id,
      title: 'מנהל אתר',
      isActive: true,
    },
  });

  await prisma.activistCoordinatorNeighborhood.upsert({
    where: {
      activistCoordinatorId_neighborhoodId: {
        activistCoordinatorId: supervisor2.id,
        neighborhoodId: site3.id,
      },
    },
    update: {},
    create: {
      cityId: corp2.id,
      activistCoordinatorId: supervisor2.id,
      neighborhoodId: site3.id,
      legacyActivistCoordinatorUserId: supervisor2User.id,
      assignedBy: superAdmin.id,
    },
  });

  // Workers for Corp 2
  await prisma.activist.create({
    data: {
      fullName: 'דני בן דוד',
      phone: '+972-50-444-0001',
      email: 'danny.bendavid@example.com',
      position: 'מנהל פרויקט',
      cityId: corp2.id,
      neighborhoodId: site3.id,
      activistCoordinatorId: supervisor2.id,
      startDate: new Date('2023-11-01'),
      isActive: true,
      tags: ['Project Management', 'Civil Engineer'],
    },
  });

  await prisma.activist.create({
    data: {
      fullName: 'מיכל אברהם',
      phone: '+972-50-444-0002',
      email: 'michal.abraham@example.com',
      position: 'מהנדסת בניין',
      cityId: corp2.id,
      neighborhoodId: site3.id,
      activistCoordinatorId: supervisor2.id,
      startDate: new Date('2024-01-10'),
      isActive: true,
      tags: ['Structural Engineering', 'Safety'],
    },
  });

  await prisma.activist.create({
    data: {
      fullName: 'אלי שמעון',
      phone: '+972-50-444-0003',
      email: 'eli.shimon@example.com',
      position: 'מנהל עבודות',
      cityId: corp2.id,
      neighborhoodId: site4.id,
      activistCoordinatorId: supervisor2.id,
      startDate: new Date('2023-10-15'),
      isActive: true,
      tags: ['Construction', 'Heavy Equipment'],
    },
  });

  console.log('✅ Corporation 2: קבוצת בינוי - Complete hierarchy created');

  // Corporation 3: רשת מזון טעים
  const corp3 = await prisma.city.upsert({
    where: { code: 'TAIM' },
    update: {},
    create: {
      name: 'רשת מזון טעים בע"מ',
      code: 'TAIM',
      description: 'רשת מסעדות ובתי קפה ארצית',
      email: 'info@taim-food.co.il',
      phone: '+972-3-777-0001',
      address: 'רחוב דיזנגוף 100, תל אביב',
      isActive: true,
      areaManagerId: areaManager.id,
    },
  });

  // Corporation 3 - Manager
  const manager3User = await prisma.user.upsert({
    where: { email: 'orna.hadad@taim-food.co.il' },
    update: {},
    create: {
      email: 'orna.hadad@taim-food.co.il',
      fullName: 'אורנה חדד',
      passwordHash: await bcrypt.hash('manager123', 10),
      role: 'CITY_COORDINATOR',
      phone: '+972-50-111-0003',
      isActive: true,
    },
  });

  await prisma.cityCoordinator.upsert({
    where: {
      cityId_userId: {
        cityId: corp3.id,
        userId: manager3User.id,
      },
    },
    update: {},
    create: {
      cityId: corp3.id,
      userId: manager3User.id,
      title: 'מנהלת רשת',
      isActive: true,
    },
  });

  // Corporation 3 - Sites
  const site5 = await prisma.neighborhood.upsert({
    where: { id: 'taim-tlv-center' },
    update: {},
    create: {
      id: 'taim-tlv-center',
      name: 'סניף תל אביב מרכז',
      address: 'רחוב דיזנגוף 100',
      city: 'תל אביב',
      country: 'ישראל',
      phone: '+972-3-777-0101',
      email: 'tlv@taim-food.co.il',
      cityId: corp3.id,
      isActive: true,
    },
  });

  const site6 = await prisma.neighborhood.upsert({
    where: { id: 'taim-jerusalem' },
    update: {},
    create: {
      id: 'taim-jerusalem',
      name: 'סניף ירושלים',
      address: 'רחוב יפו 45',
      city: 'ירושלים',
      country: 'ישראל',
      phone: '+972-2-624-0101',
      email: 'jerusalem@taim-food.co.il',
      cityId: corp3.id,
      isActive: true,
    },
  });

  // Supervisors for Corp 3
  const supervisor3User = await prisma.user.upsert({
    where: { email: 'tal.golan@taim-food.co.il' },
    update: {},
    create: {
      email: 'tal.golan@taim-food.co.il',
      fullName: 'טל גולן',
      passwordHash: await bcrypt.hash('supervisor123', 10),
      role: 'ACTIVIST_COORDINATOR',
      phone: '+972-50-222-0003',
      isActive: true,
    },
  });

  const supervisor3 = await prisma.activistCoordinator.upsert({
    where: {
      cityId_userId: {
        cityId: corp3.id,
        userId: supervisor3User.id,
      },
    },
    update: {},
    create: {
      cityId: corp3.id,
      userId: supervisor3User.id,
      title: 'מנהל סניף',
      isActive: true,
    },
  });

  await prisma.activistCoordinatorNeighborhood.upsert({
    where: {
      activistCoordinatorId_neighborhoodId: {
        activistCoordinatorId: supervisor3.id,
        neighborhoodId: site5.id,
      },
    },
    update: {},
    create: {
      cityId: corp3.id,
      activistCoordinatorId: supervisor3.id,
      neighborhoodId: site5.id,
      legacyActivistCoordinatorUserId: supervisor3User.id,
      assignedBy: superAdmin.id,
    },
  });

  // Workers for Corp 3
  await prisma.activist.create({
    data: {
      fullName: 'נועה כהן',
      phone: '+972-50-555-0001',
      email: 'noa.cohen@example.com',
      position: 'מלצרית ראשית',
      cityId: corp3.id,
      neighborhoodId: site5.id,
      activistCoordinatorId: supervisor3.id,
      startDate: new Date('2023-08-01'),
      isActive: true,
      tags: ['Customer Service', 'Shift Manager'],
    },
  });

  await prisma.activist.create({
    data: {
      fullName: 'יניב שרון',
      phone: '+972-50-555-0002',
      email: 'yaniv.sharon@example.com',
      position: 'שף ראשי',
      cityId: corp3.id,
      neighborhoodId: site5.id,
      activistCoordinatorId: supervisor3.id,
      startDate: new Date('2023-06-15'),
      isActive: true,
      tags: ['Chef', 'Italian Cuisine', 'Kitchen Management'],
    },
  });

  await prisma.activist.create({
    data: {
      fullName: 'ליאור עמית',
      phone: '+972-50-555-0003',
      email: 'lior.amit@example.com',
      position: 'מלצר',
      cityId: corp3.id,
      neighborhoodId: site6.id,
      activistCoordinatorId: supervisor3.id,
      startDate: new Date('2024-03-01'),
      isActive: true,
      tags: ['Waiter', 'Customer Service'],
    },
  });

  console.log('✅ Corporation 3: רשת מזון טעים - Complete hierarchy created');

  console.log('\n🎉 Comprehensive seed completed successfully!');
  console.log('\n📝 Test credentials:');
  console.log('SuperAdmin:       admin@rbac.shop / admin123');
  console.log('Area Manager:     regional@rbac.shop / area123');
  console.log('Manager (Corp 1): david.cohen@electra-tech.co.il / manager123');
  console.log('Manager (Corp 2): sara.levi@binuy.co.il / manager123');
  console.log('Manager (Corp 3): orna.hadad@taim-food.co.il / manager123');
  console.log('Supervisor (C1):  moshe.israeli@electra-tech.co.il / supervisor123');
  console.log('Supervisor (C2):  yossi.mizrahi@binuy.co.il / supervisor123');
  console.log('Supervisor (C3):  tal.golan@taim-food.co.il / supervisor123');
  console.log('\n🏢 Complete Hierarchy Created:');
  console.log('SuperAdmin → Area Manager (מרכז ישראל)');
  console.log('  → Corporation 1: טכנולוגיות אלקטרה (2 sites, 1 manager, 1 supervisor, 2 workers)');
  console.log('  → Corporation 2: קבוצת בינוי (2 sites, 1 manager, 1 supervisor, 3 workers)');
  console.log('  → Corporation 3: רשת מזון טעים (2 sites, 1 manager, 1 supervisor, 3 workers)');
  console.log('\n✨ Total: 1 SuperAdmin, 1 Area Manager, 3 Corporations, 6 Sites, 3 Managers, 3 Supervisors, 8 Workers');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
