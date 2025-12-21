import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Production Seed - Structure Only...');
  console.log('⚠️  This will seed: SuperAdmin + Areas + Cities ONLY');
  console.log('');

  // ========================
  // 1. SuperAdmin
  // ========================
  const hashedPassword = await bcrypt.hash('789789', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'yoniozery@gmail.com' },
    update: {
      passwordHash: hashedPassword,
      fullName: 'Yoni Ozery',
      role: 'SUPERADMIN',
      isSuperAdmin: true,
      isActive: true,
    },
    create: {
      email: 'yoniozery@gmail.com',
      fullName: 'Yoni Ozery',
      passwordHash: hashedPassword,
      role: 'SUPERADMIN',
      phone: null,
      isActive: true,
      isSuperAdmin: true,
    },
  });

  console.log('✅ SuperAdmin created:', superAdmin.email);

  // ========================
  // 2. Area Managers (6 Israeli Districts)
  // ========================

  const districts = [
    {
      email: 'manager@telaviv-district.test',
      fullName: 'מנהל מחוז תל אביב',
      regionName: 'מחוז תל אביב',
      regionCode: 'TA-DISTRICT',
      description: 'מנהל אזורי אחראי על קמפיין הבחירות במחוז תל אביב',
    },
    {
      email: 'manager@north-district.test',
      fullName: 'מנהל מחוז הצפון',
      regionName: 'מחוז הצפון',
      regionCode: 'NORTH',
      description: 'מנהל מחוזי אחראי על קמפיין הבחירות במחוז הצפון',
    },
    {
      email: 'manager@haifa-district.test',
      fullName: 'מנהל מחוז חיפה',
      regionName: 'מחוז חיפה',
      regionCode: 'HAIFA',
      description: 'מנהל מחוזי אחראי על קמפיין הבחירות במחוז חיפה',
    },
    {
      email: 'manager@center-district.test',
      fullName: 'מנהל מחוז המרכז',
      regionName: 'מחוז המרכז',
      regionCode: 'CENTER',
      description: 'מנהל אזורי אחראי על קמפיין הבחירות במחוז המרכז',
    },
    {
      email: 'manager@jerusalem-district.test',
      fullName: 'מנהל מחוז ירושלים',
      regionName: 'מחוז ירושלים',
      regionCode: 'JERUSALEM',
      description: 'מנהל מחוזי אחראי על קמפיין הבחירות במחוז ירושלים',
    },
    {
      email: 'manager@south-district.test',
      fullName: 'מנהל מחוז הדרום',
      regionName: 'מחוז הדרום',
      regionCode: 'SOUTH',
      description: 'מנהל אזורי אחראי על קמפיין הבחירות במחוז הדרום',
    },
  ];

  const createdDistricts: Record<string, any> = {};

  for (const district of districts) {
    const user = await prisma.user.upsert({
      where: { email: district.email },
      update: {},
      create: {
        email: district.email,
        fullName: district.fullName,
        passwordHash: hashedPassword,
        role: 'AREA_MANAGER',
        phone: null,
        isActive: true,
      },
    });

    const areaManager = await prisma.areaManager.upsert({
      where: { regionCode: district.regionCode },
      update: {
        userId: user.id,
        regionName: district.regionName,
      },
      create: {
        userId: user.id,
        regionName: district.regionName,
        regionCode: district.regionCode,
        isActive: true,
        metadata: {
          description: district.description,
        },
      },
    });

    createdDistricts[district.regionCode] = areaManager;
    console.log(`✅ Area Manager created: ${district.regionName}`);
  }

  console.log('');
  console.log('✅ All 6 District Managers created');

  // ========================
  // 3. Cities (Major Israeli Cities)
  // ========================

  const cities = [
    // Tel Aviv District
    { name: 'תל אביב-יפו', code: 'TLV-YAFO', district: 'TA-DISTRICT', description: 'קמפיין בחירות תל אביב-יפו - עיר הבירה הכלכלית' },
    { name: 'רמת גן', code: 'RAMAT-GAN', district: 'TA-DISTRICT', description: 'קמפיין בחירות רמת גן - עיר היהלומים' },
    { name: 'בני ברק', code: 'BNEI-BRAK', district: 'TA-DISTRICT', description: 'קמפיין בחירות בני ברק' },
    { name: 'הרצליה', code: 'HERZLIYA', district: 'TA-DISTRICT', description: 'קמפיין בחירות הרצליה' },
    { name: 'בת ים', code: 'BAT-YAM', district: 'TA-DISTRICT', description: 'קמפיין בחירות בת ים' },
    { name: 'חולון', code: 'HOLON', district: 'TA-DISTRICT', description: 'קמפיין בחירות חולון' },

    // North District
    { name: 'נצרת', code: 'NAZARETH', district: 'NORTH', description: 'קמפיין בחירות נצרת' },
    { name: 'עכו', code: 'AKKO', district: 'NORTH', description: 'קמפיין בחירות עכו' },
    { name: 'טבריה', code: 'TIBERIAS', district: 'NORTH', description: 'קמפיין בחירות טבריה' },
    { name: 'צפת', code: 'SAFED', district: 'NORTH', description: 'קמפיין בחירות צפת' },

    // Haifa District
    { name: 'חיפה', code: 'HAIFA', district: 'HAIFA', description: 'קמפיין בחירות חיפה' },
    { name: 'קריית ים', code: 'QIRYAT-YAM', district: 'HAIFA', description: 'קמפיין בחירות קריית ים' },
    { name: 'נהריה', code: 'NAHARIYA', district: 'HAIFA', description: 'קמפיין בחירות נהריה' },

    // Center District
    { name: 'פתח תקווה', code: 'PETAH-TIKVA', district: 'CENTER', description: 'קמפיין בחירות פתח תקווה' },
    { name: 'נתניה', code: 'NETANYA', district: 'CENTER', description: 'קמפיין בחירות נתניה' },
    { name: 'ראשון לציון', code: 'RISHON-LEZION', district: 'CENTER', description: 'קמפיין בחירות ראשון לציון' },
    { name: 'רעננה', code: 'RAANANA', district: 'CENTER', description: 'קמפיין בחירות רעננה' },
    { name: 'כפר סבא', code: 'KFAR-SABA', district: 'CENTER', description: 'קמפיין בחירות כפר סבא' },
    { name: 'הוד השרון', code: 'HOD-HASHARON', district: 'CENTER', description: 'קמפיין בחירות הוד השרון' },
    { name: 'רחובות', code: 'REHOVOT', district: 'CENTER', description: 'קמפיין בחירות רחובות' },
    { name: 'לוד', code: 'LOD', district: 'CENTER', description: 'קמפיין בחירות לוד' },
    { name: 'רמלה', code: 'RAMLA', district: 'CENTER', description: 'קמפיין בחירות רמלה' },

    // Jerusalem District
    { name: 'ירושלים', code: 'JERUSALEM', district: 'JERUSALEM', description: 'קמפיין בחירות ירושלים - עיר הבירה' },
    { name: 'בית שמש', code: 'BEIT-SHEMESH', district: 'JERUSALEM', description: 'קמפיין בחירות בית שמש' },
    { name: 'מעלה אדומים', code: 'MAALE-ADUMIM', district: 'JERUSALEM', description: 'קמפיין בחירות מעלה אדומים' },

    // South District
    { name: 'באר שבע', code: 'BEER-SHEVA', district: 'SOUTH', description: 'קמפיין בחירות באר שבע - בירת הנגב' },
    { name: 'אשדוד', code: 'ASHDOD', district: 'SOUTH', description: 'קמפיין בחירות אשדוד' },
    { name: 'אשקלון', code: 'ASHKELON', district: 'SOUTH', description: 'קמפיין בחירות אשקלון' },
    { name: 'אילת', code: 'EILAT', district: 'SOUTH', description: 'קמפיין בחירות אילת' },
  ];

  for (const city of cities) {
    const areaManager = createdDistricts[city.district];

    if (!areaManager) {
      console.error(`❌ Could not find area manager for ${city.district}`);
      continue;
    }

    await prisma.city.upsert({
      where: { code: city.code },
      update: {},
      create: {
        name: city.name,
        code: city.code,
        description: city.description,
        isActive: true,
        areaManagerId: areaManager.id,
      },
    });

    console.log(`✅ City created: ${city.name} (${city.district})`);
  }

  console.log('');
  console.log('✅ All cities created');
  console.log('');
  console.log('🎉 Production seed completed successfully!');
  console.log('');
  console.log('📝 SuperAdmin credentials:');
  console.log('   Email: yoniozery@gmail.com');
  console.log('   Password: 789789');
  console.log('');
  console.log('📊 Summary:');
  console.log('   - 1 SuperAdmin');
  console.log('   - 6 Area Managers (Districts)');
  console.log('   - 29 Cities');
  console.log('');
  console.log('⚠️  NEXT STEPS:');
  console.log('   1. Login as SuperAdmin');
  console.log('   2. Create City Coordinators for each city');
  console.log('   3. Create neighborhoods');
  console.log('   4. Assign Activist Coordinators');
  console.log('   5. Add field activists');
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
