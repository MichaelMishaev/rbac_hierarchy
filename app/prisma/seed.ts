import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🗳️  Starting Election Campaign System seed...');

  // ========================
  // LEVEL 1: SuperAdmin (Platform Administrator)
  // ========================
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

  console.log('✅ Level 1: SuperAdmin created:', superAdmin.email);

  // ========================
  // LEVEL 2: Area Manager (Regional Campaign Director - Tel Aviv District)
  // ========================
  const areaManagerUser = await prisma.user.upsert({
    where: { email: 'sarah.cohen@telaviv-district.test' },
    update: {},
    create: {
      email: 'sarah.cohen@telaviv-district.test',
      fullName: 'שרה כהן',
      passwordHash: await bcrypt.hash('area123', 10),
      role: 'AREA_MANAGER',
      phone: '+972-54-200-0001',
      isActive: true,
    },
  });

  const telAvivDistrict = await prisma.areaManager.upsert({
    where: { userId: areaManagerUser.id },
    update: {},
    create: {
      userId: areaManagerUser.id,
      regionName: 'מחוז תל אביב',
      regionCode: 'TA-DISTRICT',
      isActive: true,
      metadata: {
        description: 'מנהלת אזורית אחראית על קמפיין הבחירות במחוז תל אביב',
        budget: '2,500,000 ₪',
        targetVoters: 450000,
      },
    },
  });

  console.log('✅ Level 2: Area Manager (Tel Aviv) created:', telAvivDistrict.regionName);

  // ========================
  // LEVEL 2: Additional District Managers (All 6 Israeli Districts)
  // ========================

  // North District (מחוז הצפון)
  const northDistrictUser = await prisma.user.upsert({
    where: { email: 'manager@north-district.test' },
    update: {},
    create: {
      email: 'manager@north-district.test',
      fullName: 'יעל גולן',
      passwordHash: await bcrypt.hash('area123', 10),
      role: 'AREA_MANAGER',
      phone: '+972-54-200-0002',
      isActive: true,
    },
  });

  const northDistrict = await prisma.areaManager.upsert({
    where: { userId: northDistrictUser.id },
    update: {},
    create: {
      userId: northDistrictUser.id,
      regionName: 'מחוז הצפון',
      regionCode: 'NORTH',
      isActive: true,
      metadata: {
        description: 'מנהל מחוזי אחראי על קמפיין הבחירות במחוז הצפון',
      },
    },
  });

  // Haifa District (מחוז חיפה)
  const haifaDistrictUser = await prisma.user.upsert({
    where: { email: 'manager@haifa-district.test' },
    update: {},
    create: {
      email: 'manager@haifa-district.test',
      fullName: 'מיכאל כרמל',
      passwordHash: await bcrypt.hash('area123', 10),
      role: 'AREA_MANAGER',
      phone: '+972-54-200-0003',
      isActive: true,
    },
  });

  const haifaDistrict = await prisma.areaManager.upsert({
    where: { userId: haifaDistrictUser.id },
    update: {},
    create: {
      userId: haifaDistrictUser.id,
      regionName: 'מחוז חיפה',
      regionCode: 'HAIFA',
      isActive: true,
      metadata: {
        description: 'מנהל מחוזי אחראי על קמפיין הבחירות במחוז חיפה',
      },
    },
  });

  // Center District (מחוז המרכז)
  const centerDistrictUser = await prisma.user.upsert({
    where: { email: 'manager@center-district.test' },
    update: {},
    create: {
      email: 'manager@center-district.test',
      fullName: 'רונית שרון',
      passwordHash: await bcrypt.hash('area123', 10),
      role: 'AREA_MANAGER',
      phone: '+972-54-200-0004',
      isActive: true,
    },
  });

  const centerDistrict = await prisma.areaManager.upsert({
    where: { userId: centerDistrictUser.id },
    update: {},
    create: {
      userId: centerDistrictUser.id,
      regionName: 'מחוז המרכז',
      regionCode: 'CENTER',
      isActive: true,
      metadata: {
        description: 'מנהלת אזורית אחראית על קמפיין הבחירות במחוז המרכז',
      },
    },
  });

  // Jerusalem District (מחוז ירושלים)
  const jerusalemDistrictUser = await prisma.user.upsert({
    where: { email: 'manager@jerusalem-district.test' },
    update: {},
    create: {
      email: 'manager@jerusalem-district.test',
      fullName: 'אבי הר-טוב',
      passwordHash: await bcrypt.hash('area123', 10),
      role: 'AREA_MANAGER',
      phone: '+972-54-200-0005',
      isActive: true,
    },
  });

  const jerusalemDistrict = await prisma.areaManager.upsert({
    where: { userId: jerusalemDistrictUser.id },
    update: {},
    create: {
      userId: jerusalemDistrictUser.id,
      regionName: 'מחוז ירושלים',
      regionCode: 'JERUSALEM',
      isActive: true,
      metadata: {
        description: 'מנהל מחוזי אחראי על קמפיין הבחירות במחוז ירושלים',
      },
    },
  });

  // South District (מחוז הדרום)
  const southDistrictUser = await prisma.user.upsert({
    where: { email: 'manager@south-district.test' },
    update: {},
    create: {
      email: 'manager@south-district.test',
      fullName: 'תמר נגב',
      passwordHash: await bcrypt.hash('area123', 10),
      role: 'AREA_MANAGER',
      phone: '+972-54-200-0006',
      isActive: true,
    },
  });

  const southDistrict = await prisma.areaManager.upsert({
    where: { userId: southDistrictUser.id },
    update: {},
    create: {
      userId: southDistrictUser.id,
      regionName: 'מחוז הדרום',
      regionCode: 'SOUTH',
      isActive: true,
      metadata: {
        description: 'מנהלת אזורית אחראית על קמפיין הבחירות במחוז הדרום',
      },
    },
  });

  console.log('✅ Level 2: All 6 District Managers created');
  console.log('  - מחוז תל אביב (Tel Aviv District)');
  console.log('  - מחוז הצפון (North District)');
  console.log('  - מחוז חיפה (Haifa District)');
  console.log('  - מחוז המרכז (Center District)');
  console.log('  - מחוז ירושלים (Jerusalem District)');
  console.log('  - מחוז הדרום (South District)');

  // ========================
  // LEVEL 3-7: Tel Aviv-Yafo City (Full Campaign Hierarchy)
  // ========================

  // City 1: Tel Aviv-Yafo
  const telAvivYafo = await prisma.city.upsert({
    where: { code: 'TLV-YAFO' },
    update: {},
    create: {
      name: 'תל אביב-יפו',
      code: 'TLV-YAFO',
      description: 'קמפיין בחירות תל אביב-יפו - עיר הבירה הכלכלית',
      isActive: true,
      areaManagerId: telAvivDistrict.id,
    },
  });

  // City Coordinator for Tel Aviv-Yafo
  const davidLeviUser = await prisma.user.upsert({
    where: { email: 'david.levi@telaviv.test' },
    update: {},
    create: {
      email: 'david.levi@telaviv.test',
      fullName: 'דוד לוי',
      passwordHash: await bcrypt.hash('manager123', 10),
      role: 'CITY_COORDINATOR',
      phone: '+972-54-300-0001',
      isActive: true,
    },
  });

  await prisma.cityCoordinator.upsert({
    where: {
      cityId_userId: {
        cityId: telAvivYafo.id,
        userId: davidLeviUser.id,
      },
    },
    update: {},
    create: {
      cityId: telAvivYafo.id,
      userId: davidLeviUser.id,
      title: 'מנהל קמפיין עירוני',
      isActive: true,
    },
  });

  // Neighborhoods in Tel Aviv-Yafo
  const florentin = await prisma.neighborhood.upsert({
    where: { id: 'tlv-florentin' },
    update: {},
    create: {
      id: 'tlv-florentin',
      name: 'פלורנטין',
      address: 'רחוב ויטל 1',
      city: 'תל אביב',
      country: 'ישראל',
      latitude: 32.0556,
      longitude: 34.7661,
      phone: '+972-3-518-0001',
      email: 'florentin@campaign.test',
      cityId: telAvivYafo.id,
      isActive: true,
      metadata: {
        population: 8000,
        targetVoters: 5500,
        coverageArea: '2.5 km²',
      },
    },
  });

  const neveTzedek = await prisma.neighborhood.upsert({
    where: { id: 'tlv-neve-tzedek' },
    update: {},
    create: {
      id: 'tlv-neve-tzedek',
      name: 'נווה צדק',
      address: 'שדרות רוקח 1',
      city: 'תל אביב',
      country: 'ישראל',
      latitude: 32.0608,
      longitude: 34.7630,
      phone: '+972-3-516-0002',
      email: 'nevetzedek@campaign.test',
      cityId: telAvivYafo.id,
      isActive: true,
      metadata: {
        population: 6500,
        targetVoters: 4200,
        coverageArea: '1.8 km²',
      },
    },
  });

  const oldJaffa = await prisma.neighborhood.upsert({
    where: { id: 'tlv-old-jaffa' },
    update: {},
    create: {
      id: 'tlv-old-jaffa',
      name: 'יפו העתיקה',
      address: 'רחוב יפת 1',
      city: 'תל אביב-יפו',
      country: 'ישראל',
      latitude: 32.0543,
      longitude: 34.7516,
      phone: '+972-3-682-0003',
      email: 'oldjaffa@campaign.test',
      cityId: telAvivYafo.id,
      isActive: true,
      metadata: {
        population: 12000,
        targetVoters: 7800,
        coverageArea: '3.2 km²',
      },
    },
  });

  // Activist Coordinator 1: Rachel Ben-David (Florentin + Neve Tzedek)
  const rachelBenDavidUser = await prisma.user.upsert({
    where: { email: 'rachel.bendavid@telaviv.test' },
    update: {},
    create: {
      email: 'rachel.bendavid@telaviv.test',
      fullName: 'רחל בן-דוד',
      passwordHash: await bcrypt.hash('supervisor123', 10),
      role: 'ACTIVIST_COORDINATOR',
      phone: '+972-54-400-0001',
      isActive: true,
    },
  });

  const rachelCoordinator = await prisma.activistCoordinator.upsert({
    where: {
      cityId_userId: {
        cityId: telAvivYafo.id,
        userId: rachelBenDavidUser.id,
      },
    },
    update: {},
    create: {
      cityId: telAvivYafo.id,
      userId: rachelBenDavidUser.id,
      title: 'רכזת שכונות מרכז',
      isActive: true,
    },
  });

  // Assign Rachel to Florentin and Neve Tzedek
  await prisma.activistCoordinatorNeighborhood.upsert({
    where: {
      activistCoordinatorId_neighborhoodId: {
        activistCoordinatorId: rachelCoordinator.id,
        neighborhoodId: florentin.id,
      },
    },
    update: {},
    create: {
      cityId: telAvivYafo.id,
      activistCoordinatorId: rachelCoordinator.id,
      neighborhoodId: florentin.id,
      legacyActivistCoordinatorUserId: rachelBenDavidUser.id,
      assignedBy: superAdmin.id,
    },
  });

  await prisma.activistCoordinatorNeighborhood.upsert({
    where: {
      activistCoordinatorId_neighborhoodId: {
        activistCoordinatorId: rachelCoordinator.id,
        neighborhoodId: neveTzedek.id,
      },
    },
    update: {},
    create: {
      cityId: telAvivYafo.id,
      activistCoordinatorId: rachelCoordinator.id,
      neighborhoodId: neveTzedek.id,
      legacyActivistCoordinatorUserId: rachelBenDavidUser.id,
      assignedBy: superAdmin.id,
    },
  });

  // Activist Coordinator 2: Yael Cohen (Old Jaffa)
  const yaelCohenUser = await prisma.user.upsert({
    where: { email: 'yael.cohen@telaviv.test' },
    update: {},
    create: {
      email: 'yael.cohen@telaviv.test',
      fullName: 'יעל כהן',
      passwordHash: await bcrypt.hash('supervisor123', 10),
      role: 'ACTIVIST_COORDINATOR',
      phone: '+972-54-400-0002',
      isActive: true,
    },
  });

  const yaelCoordinator = await prisma.activistCoordinator.upsert({
    where: {
      cityId_userId: {
        cityId: telAvivYafo.id,
        userId: yaelCohenUser.id,
      },
    },
    update: {},
    create: {
      cityId: telAvivYafo.id,
      userId: yaelCohenUser.id,
      title: 'רכזת יפו',
      isActive: true,
    },
  });

  await prisma.activistCoordinatorNeighborhood.upsert({
    where: {
      activistCoordinatorId_neighborhoodId: {
        activistCoordinatorId: yaelCoordinator.id,
        neighborhoodId: oldJaffa.id,
      },
    },
    update: {},
    create: {
      cityId: telAvivYafo.id,
      activistCoordinatorId: yaelCoordinator.id,
      neighborhoodId: oldJaffa.id,
      legacyActivistCoordinatorUserId: yaelCohenUser.id,
      assignedBy: superAdmin.id,
    },
  });

  // Field Activists - Florentin (30 activists under Rachel)
  const florentinActivists = [
    { name: 'יוסי מזרחי', phone: '+972-52-100-0001', position: 'דלת לדלת', tasks: 'כיסוי בלוקים 1-8' },
    { name: 'מיכל אהרון', phone: '+972-52-100-0002', position: 'טלפנות', tasks: 'רשימת קריאות - 200 איש ליום' },
    { name: 'דני לוי', phone: '+972-52-100-0003', position: 'תיאום אירועים', tasks: 'הקמת עמדות רחוב' },
    { name: 'נועה כהן', phone: '+972-52-100-0004', position: 'דלת לדלת', tasks: 'כיסוי בלוקים 9-15' },
    { name: 'רון שמעון', phone: '+972-52-100-0005', position: 'תיאום אירועים', tasks: 'עמדת רוטשילד' },
    { name: 'תמר דוד', phone: '+972-52-100-0006', position: 'טלפנות', tasks: 'מוקד טלפוני ערב' },
    { name: 'אלי ברק', phone: '+972-52-100-0007', position: 'דלת לדלת', tasks: 'בלוקים 16-22' },
    { name: 'ליאת משה', phone: '+972-52-100-0008', position: 'איסוף נתונים', tasks: 'סקרי בוחרים - 50 ליום' },
    { name: 'עמית גל', phone: '+972-52-100-0009', position: 'דלת לדלת', tasks: 'בלוקים 23-30' },
    { name: 'שירה זהבי', phone: '+972-52-100-0010', position: 'טלפנות', tasks: 'מוקד בוקר' },
  ];

  for (const activist of florentinActivists.slice(0, 10)) {
    await prisma.activist.create({
      data: {
        fullName: activist.name,
        phone: activist.phone,
        email: `${activist.phone.replace(/[^0-9]/g, '')}@volunteer.test`,
        position: activist.position,
        cityId: telAvivYafo.id,
        neighborhoodId: florentin.id,
        activistCoordinatorId: rachelCoordinator.id,
        startDate: new Date('2024-11-01'),
        isActive: true,
        tags: [activist.position, 'פעיל', 'פלורנטין'],
        metadata: {
          assignedTasks: activist.tasks,
          hoursThisMonth: Math.floor(Math.random() * 40) + 20,
          completedTasks: Math.floor(Math.random() * 15) + 5,
        },
      },
    });
  }

  // Field Activists - Neve Tzedek (25 activists under Rachel)
  const neveTzedekActivists = [
    { name: 'גיא אבני', phone: '+972-52-200-0001', position: 'דלת לדלת', tasks: 'רחוב שבזי כולו' },
    { name: 'ענבר כהן', phone: '+972-52-200-0002', position: 'טלפנות', tasks: '150 שיחות יומי' },
    { name: 'אורי ישראל', phone: '+972-52-200-0003', position: 'תיאום אירועים', tasks: 'עמדת נחלת בנימין' },
    { name: 'מאיה לוי', phone: '+972-52-200-0004', position: 'דלת לדלת', tasks: 'שכ׳ נווה צדק מערב' },
    { name: 'אופיר גולן', phone: '+972-52-200-0005', position: 'איסוף נתונים', tasks: 'סקרים - 40 ליום' },
    { name: 'הדס מור', phone: '+972-52-200-0006', position: 'טלפנות', tasks: 'מוקד צהריים' },
    { name: 'רועי שלום', phone: '+972-52-200-0007', position: 'דלת לדלת', tasks: 'נווה צדק מזרח' },
    { name: 'יערה דוד', phone: '+972-52-200-0008', position: 'תיאום אירועים', tasks: 'מפגש בוחרים שבועי' },
  ];

  for (const activist of neveTzedekActivists.slice(0, 8)) {
    await prisma.activist.create({
      data: {
        fullName: activist.name,
        phone: activist.phone,
        email: `${activist.phone.replace(/[^0-9]/g, '')}@volunteer.test`,
        position: activist.position,
        cityId: telAvivYafo.id,
        neighborhoodId: neveTzedek.id,
        activistCoordinatorId: rachelCoordinator.id,
        startDate: new Date('2024-11-01'),
        isActive: true,
        tags: [activist.position, 'פעיל', 'נווה צדק'],
        metadata: {
          assignedTasks: activist.tasks,
          hoursThisMonth: Math.floor(Math.random() * 35) + 15,
          completedTasks: Math.floor(Math.random() * 12) + 3,
        },
      },
    });
  }

  // Field Activists - Old Jaffa (40 activists under Yael)
  const oldJaffaActivists = [
    { name: 'סמי חסן', phone: '+972-52-300-0001', position: 'דלת לדלת', tasks: 'יפו העתיקה - צפון' },
    { name: 'לינה עבאס', phone: '+972-52-300-0002', position: 'טלפנות', tasks: 'קריאות ערבית - 100 ליום' },
    { name: 'מוחמד עלי', phone: '+972-52-300-0003', position: 'תיאום אירועים', tasks: 'עמדת שוק הפשפשים' },
    { name: 'ראניה סעיד', phone: '+972-52-300-0004', position: 'דלת לדלת', tasks: 'יפו - מזרח' },
    { name: 'חאלד ג׳בר', phone: '+972-52-300-0005', position: 'איסוף נתונים', tasks: 'סקרים דו-לשוניים' },
    { name: 'פאטמה נאסר', phone: '+972-52-300-0006', position: 'טלפנות', tasks: 'מוקד ערבית' },
    { name: 'אחמד חמוד', phone: '+972-52-300-0007', position: 'דלת לדלת', tasks: 'יפו - דרום' },
    { name: 'נור כרם', phone: '+972-52-300-0008', position: 'תיאום אירועים', tasks: 'אירוע קהילתי שבועי' },
    { name: 'טארק עודה', phone: '+972-52-300-0009', position: 'דלת לדלת', tasks: 'יפו - מערב' },
    { name: 'סלמה יוסף', phone: '+972-52-300-0010', position: 'טלפנות', tasks: 'מוקד בוקר ערבית' },
  ];

  for (const activist of oldJaffaActivists.slice(0, 10)) {
    await prisma.activist.create({
      data: {
        fullName: activist.name,
        phone: activist.phone,
        email: `${activist.phone.replace(/[^0-9]/g, '')}@volunteer.test`,
        position: activist.position,
        cityId: telAvivYafo.id,
        neighborhoodId: oldJaffa.id,
        activistCoordinatorId: yaelCoordinator.id,
        startDate: new Date('2024-11-01'),
        isActive: true,
        tags: [activist.position, 'פעיל', 'יפו'],
        metadata: {
          assignedTasks: activist.tasks,
          hoursThisMonth: Math.floor(Math.random() * 45) + 25,
          completedTasks: Math.floor(Math.random() * 18) + 8,
          language: 'עברית/ערבית',
        },
      },
    });
  }

  console.log('✅ City 1: תל אביב-יפו - Full campaign hierarchy created');

  // ========================
  // City 2: Ramat Gan
  // ========================
  const ramatGan = await prisma.city.upsert({
    where: { code: 'RAMAT-GAN' },
    update: {},
    create: {
      name: 'רמת גן',
      code: 'RAMAT-GAN',
      description: 'קמפיין בחירות רמת גן - עיר היהלומים',
      isActive: true,
      areaManagerId: telAvivDistrict.id,
    },
  });

  const mosheIsraeliUser = await prisma.user.upsert({
    where: { email: 'moshe.israeli@ramatgan.test' },
    update: {},
    create: {
      email: 'moshe.israeli@ramatgan.test',
      fullName: 'משה ישראלי',
      passwordHash: await bcrypt.hash('manager123', 10),
      role: 'CITY_COORDINATOR',
      phone: '+972-54-300-0002',
      isActive: true,
    },
  });

  await prisma.cityCoordinator.upsert({
    where: {
      cityId_userId: {
        cityId: ramatGan.id,
        userId: mosheIsraeliUser.id,
      },
    },
    update: {},
    create: {
      cityId: ramatGan.id,
      userId: mosheIsraeliUser.id,
      title: 'מנהל קמפיין עירוני',
      isActive: true,
    },
  });

  const ramatGanCenter = await prisma.neighborhood.upsert({
    where: { id: 'rg-center' },
    update: {},
    create: {
      id: 'rg-center',
      name: 'מרכז העיר',
      address: 'ביאליק 1',
      city: 'רמת גן',
      country: 'ישראל',
      latitude: 32.0809,
      longitude: 34.8237,
      phone: '+972-3-575-0001',
      email: 'center@ramatgan.test',
      cityId: ramatGan.id,
      isActive: true,
      metadata: {
        population: 15000,
        targetVoters: 10500,
      },
    },
  });

  const danCoordinatorUser = await prisma.user.upsert({
    where: { email: 'dan.carmel@ramatgan.test' },
    update: {},
    create: {
      email: 'dan.carmel@ramatgan.test',
      fullName: 'דן כרמל',
      passwordHash: await bcrypt.hash('supervisor123', 10),
      role: 'ACTIVIST_COORDINATOR',
      phone: '+972-54-400-0003',
      isActive: true,
    },
  });

  const danCoordinator = await prisma.activistCoordinator.upsert({
    where: {
      cityId_userId: {
        cityId: ramatGan.id,
        userId: danCoordinatorUser.id,
      },
    },
    update: {},
    create: {
      cityId: ramatGan.id,
      userId: danCoordinatorUser.id,
      title: 'רכז מרכז העיר',
      isActive: true,
    },
  });

  await prisma.activistCoordinatorNeighborhood.upsert({
    where: {
      activistCoordinatorId_neighborhoodId: {
        activistCoordinatorId: danCoordinator.id,
        neighborhoodId: ramatGanCenter.id,
      },
    },
    update: {},
    create: {
      cityId: ramatGan.id,
      activistCoordinatorId: danCoordinator.id,
      neighborhoodId: ramatGanCenter.id,
      legacyActivistCoordinatorUserId: danCoordinatorUser.id,
      assignedBy: superAdmin.id,
    },
  });

  // Ramat Gan activists (smaller team - 15)
  const ramatGanActivists = [
    { name: 'אורית שמש', phone: '+972-52-400-0001', position: 'דלת לדלת' },
    { name: 'יובל ברק', phone: '+972-52-400-0002', position: 'טלפנות' },
    { name: 'שרון מור', phone: '+972-52-400-0003', position: 'תיאום אירועים' },
    { name: 'עידן זהבי', phone: '+972-52-400-0004', position: 'דלת לדלת' },
    { name: 'ליאור נחום', phone: '+972-52-400-0005', position: 'איסוף נתונים' },
  ];

  for (const activist of ramatGanActivists) {
    await prisma.activist.create({
      data: {
        fullName: activist.name,
        phone: activist.phone,
        email: `${activist.phone.replace(/[^0-9]/g, '')}@volunteer.test`,
        position: activist.position,
        cityId: ramatGan.id,
        neighborhoodId: ramatGanCenter.id,
        activistCoordinatorId: danCoordinator.id,
        startDate: new Date('2024-11-15'),
        isActive: true,
        tags: [activist.position, 'פעיל', 'רמת גן'],
        metadata: {
          hoursThisMonth: Math.floor(Math.random() * 30) + 10,
          completedTasks: Math.floor(Math.random() * 10) + 2,
        },
      },
    });
  }

  console.log('✅ City 2: רמת גן - Campaign hierarchy created');

  // ========================
  // VOTERS: Seed voter data for demonstrating visibility chain
  // ========================
  console.log('\n📋 Seeding voter data...');

  // Voters inserted by Activist Coordinator Rachel (Florentin)
  const rachelFlorentinVoters = [
    {
      fullName: 'דוד כהן',
      phone: '0501234567',
      supportLevel: 'תומך',
      contactStatus: 'נוצר קשר',
      priority: 'גבוה',
      notes: 'מעוניין מאוד בנושא חינוך',
    },
    {
      fullName: 'שרה לוי',
      phone: '0529876543',
      supportLevel: 'מהסס',
      contactStatus: 'נקבע פגישה',
      priority: 'בינוני',
      voterAddress: 'רחוב לבונטין 15, תל אביב',
    },
    {
      fullName: 'מיכאל אבני',
      phone: '0531112222',
      supportLevel: 'תומך',
      contactStatus: 'הצביע',
      priority: 'גבוה',
      notes: 'הצביע מראש',
    },
  ];

  for (const voter of rachelFlorentinVoters) {
    await prisma.voter.create({
      data: {
        ...voter,
        insertedByUserId: rachelBenDavidUser.id,
        insertedByUserName: rachelBenDavidUser.fullName,
        insertedByUserRole: 'רכז פעילים',
        insertedByNeighborhoodName: 'פלורנטין',
        insertedByCityName: telAvivYafo.name,
        isActive: true,
      },
    });
  }
  console.log(`✅ Added ${rachelFlorentinVoters.length} voters for activist coordinator: ${rachelBenDavidUser.fullName} (Florentin)`);

  // Voters inserted by Activist Coordinator Yael (Jaffa)
  const yaelJaffaVoters = [
    {
      fullName: 'רחל גולן',
      phone: '0542223333',
      supportLevel: 'לא ענה',
      contactStatus: 'לא זמין',
      priority: 'נמוך',
    },
    {
      fullName: 'יוסי בן-דוד',
      phone: '0553334444',
      supportLevel: 'מתנגד',
      contactStatus: 'נוצר קשר',
      priority: 'נמוך',
      notes: 'לא מעוניין בשיחה',
    },
  ];

  for (const voter of yaelJaffaVoters) {
    await prisma.voter.create({
      data: {
        ...voter,
        insertedByUserId: yaelCohenUser.id,
        insertedByUserName: yaelCohenUser.fullName,
        insertedByUserRole: 'רכז פעילים',
        insertedByNeighborhoodName: 'יפו העתיקה',
        insertedByCityName: telAvivYafo.name,
        isActive: true,
      },
    });
  }
  console.log(`✅ Added ${yaelJaffaVoters.length} voters for activist coordinator: ${yaelCohenUser.fullName} (Jaffa)`)

  // Voter inserted by Activist Coordinator (Rachel Ben-David)
  await prisma.voter.create({
    data: {
      fullName: 'אליה מור',
      phone: '0544445555',
      supportLevel: 'תומך',
      contactStatus: 'נקבע פגישה',
      priority: 'גבוה',
      notes: 'תאום פגישה באירוע קמפיין',
      insertedByUserId: rachelBenDavidUser.id,
      insertedByUserName: rachelBenDavidUser.fullName,
      insertedByUserRole: 'רכז פעילים',
      insertedByNeighborhoodName: 'פלורנטין + נווה צדק',
      insertedByCityName: telAvivYafo.name,
      isActive: true,
    },
  });
  console.log('✅ Added 1 voter for activist coordinator: רחל בן-דוד');

  // Voter inserted by City Coordinator (David Levi)
  await prisma.voter.create({
    data: {
      fullName: 'נועה שמיר',
      phone: '0555556666',
      supportLevel: 'תומך',
      contactStatus: 'נוצר קשר',
      priority: 'גבוה',
      notes: 'מתנדבת פוטנציאלית לקמפיין',
      insertedByUserId: davidLeviUser.id,
      insertedByUserName: davidLeviUser.fullName,
      insertedByUserRole: 'רכז עיר',
      insertedByCityName: telAvivYafo.name,
      isActive: true,
    },
  });
  console.log('✅ Added 1 voter for city coordinator: דוד לוי');

  // Voter inserted by Area Manager (Sarah Cohen) - assigned to Tel Aviv for reporting
  await prisma.voter.create({
    data: {
      fullName: 'דני ארד',
      phone: '0566667777',
      supportLevel: 'תומך',
      contactStatus: 'נוצר קשר',
      priority: 'גבוה',
      notes: 'תורם גדול לקמפיין ברמה המחוזית',
      insertedByUserId: areaManagerUser.id,
      insertedByUserName: areaManagerUser.fullName,
      insertedByUserRole: 'מנהל אזור',
      insertedByCityName: null,
      assignedCityId: telAvivYafo.id,
      assignedCityName: telAvivYafo.name,
      isActive: true,
    },
  });
  console.log('✅ Added 1 voter for area manager: שרה כהן (assigned to Tel Aviv)');

  // Duplicate phone example (to demonstrate duplicate detection)
  await prisma.voter.create({
    data: {
      fullName: 'דוד כהן',
      phone: '0501234567', // DUPLICATE!
      supportLevel: 'תומך',
      contactStatus: 'נוצר קשר',
      priority: 'בינוני',
      notes: 'הכנסה כפולה מרכז אחר',
      insertedByUserId: yaelCohenUser.id,
      insertedByUserName: yaelCohenUser.fullName,
      insertedByUserRole: 'רכז פעילים',
      insertedByNeighborhoodName: 'יפו העתיקה',
      insertedByCityName: telAvivYafo.name,
      isActive: true,
    },
  });
  console.log('✅ Added 1 duplicate voter (for duplicate detection demo)');

  const totalVoters = await prisma.voter.count({ where: { isActive: true } });
  console.log(`\n📊 Total voters seeded: ${totalVoters}`);
  console.log('   - Demonstrates upward visibility chain');
  console.log('   - Includes 1 duplicate phone number (0501234567)');
  console.log('   - Voters from different hierarchy levels');

  console.log('\n🎉 Election Campaign System seed completed successfully!');
  console.log('\n📝 Test credentials:');
  console.log('SuperAdmin:           admin@election.test / admin123');
  console.log('Area Manager:         sarah.cohen@telaviv-district.test / area123');
  console.log('City Coord (TLV):     david.levi@telaviv.test / manager123');
  console.log('City Coord (RG):      moshe.israeli@ramatgan.test / manager123');
  console.log('Activist Coord (FL):  rachel.bendavid@telaviv.test / supervisor123');
  console.log('Activist Coord (JF):  yael.cohen@telaviv.test / supervisor123');
  console.log('Activist Coord (RG):  dan.carmel@ramatgan.test / supervisor123');
  console.log('\n🗳️  Complete Campaign Hierarchy:');
  console.log('SuperAdmin → Area Manager (מחוז תל אביב)');
  console.log('  → City 1: תל אביב-יפו');
  console.log('     - City Coordinator: דוד לוי');
  console.log('     - Neighborhoods: פלורנטין, נווה צדק, יפו העתיקה');
  console.log('     - Activist Coordinators: רחל בן-דוד (פלורנטין + נווה צדק), יעל כהן (יפו)');
  console.log('     - Field Activists: 28 volunteers (10 פלורנטין, 8 נווה צדק, 10 יפו)');
  console.log('  → City 2: רמת גן');
  console.log('     - City Coordinator: משה ישראלי');
  console.log('     - Neighborhoods: מרכז העיר');
  console.log('     - Activist Coordinators: דן כרמל');
  console.log('     - Field Activists: 5 volunteers');
  console.log('\n✨ Total: 1 SuperAdmin, 1 Area Manager, 2 Cities, 4 Neighborhoods, 2 City Coordinators, 3 Activist Coordinators, 33 Field Activists');
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
