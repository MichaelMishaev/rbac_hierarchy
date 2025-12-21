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
  // 3. Cities (All 82 Israeli Cities)
  // ========================

  const cities = [
    // Tel Aviv District (8 cities)
    { name: 'תל אביב-יפו', code: 'TLV-YAFO', district: 'TA-DISTRICT' },
    { name: 'רמת גן', code: 'RAMAT-GAN', district: 'TA-DISTRICT' },
    { name: 'בני ברק', code: 'BNEI-BRAK', district: 'TA-DISTRICT' },
    { name: 'הרצליה', code: 'HERZLIYA', district: 'TA-DISTRICT' },
    { name: 'בת ים', code: 'BAT-YAM', district: 'TA-DISTRICT' },
    { name: 'חולון', code: 'HOLON', district: 'TA-DISTRICT' },
    { name: 'גבעתיים', code: 'GIVATAYIM', district: 'TA-DISTRICT' },
    { name: 'אור יהודה', code: 'OR-YEHUDA', district: 'TA-DISTRICT' },

    // North District (14 cities)
    { name: 'נצרת', code: 'NAZARETH', district: 'NORTH' },
    { name: 'עכו', code: 'AKKO', district: 'NORTH' },
    { name: 'טבריה', code: 'TIBERIAS', district: 'NORTH' },
    { name: 'צפת', code: 'SAFED', district: 'NORTH' },
    { name: 'קריית שמונה', code: 'QIRYAT-SHMONA', district: 'NORTH' },
    { name: 'מעלות-תרשיחא', code: 'MAALOT-TARSHIHA', district: 'NORTH' },
    { name: 'כרמיאל', code: 'KARMIEL', district: 'NORTH' },
    { name: 'בית שאן', code: 'BET-SHEAN', district: 'NORTH' },
    { name: 'נהריה', code: 'NAHARIYA', district: 'NORTH' },
    { name: 'מגדל העמק', code: 'MIGDAL-HAEMEK', district: 'NORTH' },
    { name: 'שפרעם', code: 'SHFARAM', district: 'NORTH' },
    { name: 'עפולה', code: 'AFULA', district: 'NORTH' },
    { name: 'יקנעם עילית', code: 'YOQNEAM-ILLIT', district: 'NORTH' },
    { name: 'חצור הגלילית', code: 'HATZOR-HAGLILIT', district: 'NORTH' },

    // Haifa District (10 cities)
    { name: 'חיפה', code: 'HAIFA', district: 'HAIFA' },
    { name: 'קריית ים', code: 'QIRYAT-YAM', district: 'HAIFA' },
    { name: 'קריית ביאליק', code: 'QIRYAT-BIALIK', district: 'HAIFA' },
    { name: 'קריית מוצקין', code: 'QIRYAT-MOTZKIN', district: 'HAIFA' },
    { name: 'קריית אתא', code: 'QIRYAT-ATA', district: 'HAIFA' },
    { name: 'טמרה', code: 'TAMRA', district: 'HAIFA' },
    { name: 'נשר', code: 'NESHER', district: 'HAIFA' },
    { name: 'טירת כרמל', code: 'TIRAT-CARMEL', district: 'HAIFA' },
    { name: 'עתלית', code: 'ATLIT', district: 'HAIFA' },
    { name: 'דליית אל-כרמל', code: 'DALIYAT-AL-CARMEL', district: 'HAIFA' },

    // Center District (22 cities)
    { name: 'פתח תקווה', code: 'PETAH-TIKVA', district: 'CENTER' },
    { name: 'נתניה', code: 'NETANYA', district: 'CENTER' },
    { name: 'ראשון לציון', code: 'RISHON-LEZION', district: 'CENTER' },
    { name: 'רעננה', code: 'RAANANA', district: 'CENTER' },
    { name: 'כפר סבא', code: 'KFAR-SABA', district: 'CENTER' },
    { name: 'הוד השרון', code: 'HOD-HASHARON', district: 'CENTER' },
    { name: 'רחובות', code: 'REHOVOT', district: 'CENTER' },
    { name: 'לוד', code: 'LOD', district: 'CENTER' },
    { name: 'רמלה', code: 'RAMLA', district: 'CENTER' },
    { name: 'יבנה', code: 'YAVNE', district: 'CENTER' },
    { name: 'גדרה', code: 'GEDERA', district: 'CENTER' },
    { name: 'נס ציונה', code: 'NES-ZIONA', district: 'CENTER' },
    { name: 'קריית אונו', code: 'QIRYAT-ONO', district: 'CENTER' },
    { name: 'קריית עקרון', code: 'QIRYAT-EKRON', district: 'CENTER' },
    { name: 'יהוד-מונוסון', code: 'YEHUD-MONOSSON', district: 'CENTER' },
    { name: 'גני תקווה', code: 'GANEI-TIKVA', district: 'CENTER' },
    { name: 'קריית מלאכי', code: 'QIRYAT-MALACHI', district: 'CENTER' },
    { name: 'אלעד', code: 'ELAD', district: 'CENTER' },
    { name: 'סביון', code: 'SAVYON', district: 'CENTER' },
    { name: 'שוהם', code: 'SHOHAM', district: 'CENTER' },
    { name: 'תל מונד', code: 'TEL-MOND', district: 'CENTER' },
    { name: 'אור עקיבא', code: 'OR-AKIVA', district: 'CENTER' },

    // Jerusalem District (8 cities)
    { name: 'ירושלים', code: 'JERUSALEM', district: 'JERUSALEM' },
    { name: 'בית שמש', code: 'BEIT-SHEMESH', district: 'JERUSALEM' },
    { name: 'מעלה אדומים', code: 'MAALE-ADUMIM', district: 'JERUSALEM' },
    { name: 'מודיעין-מכבים-רעות', code: 'MODIIN-MACCABIM-REUT', district: 'JERUSALEM' },
    { name: 'מודיעין עילית', code: 'MODIIN-ILLIT', district: 'JERUSALEM' },
    { name: 'מבשרת ציון', code: 'MEVASSERET-ZION', district: 'JERUSALEM' },
    { name: 'אפרת', code: 'EFRAT', district: 'JERUSALEM' },
    { name: 'ביתר עילית', code: 'BEITAR-ILLIT', district: 'JERUSALEM' },

    // South District (20 cities)
    { name: 'באר שבע', code: 'BEER-SHEVA', district: 'SOUTH' },
    { name: 'אשדוד', code: 'ASHDOD', district: 'SOUTH' },
    { name: 'אשקלון', code: 'ASHKELON', district: 'SOUTH' },
    { name: 'אילת', code: 'EILAT', district: 'SOUTH' },
    { name: 'קריית גת', code: 'QIRYAT-GAT', district: 'SOUTH' },
    { name: 'דימונה', code: 'DIMONA', district: 'SOUTH' },
    { name: 'נתיבות', code: 'NETIVOT', district: 'SOUTH' },
    { name: 'שדרות', code: 'SDEROT', district: 'SOUTH' },
    { name: 'אופקים', code: 'OFAKIM', district: 'SOUTH' },
    { name: 'ערד', code: 'ARAD', district: 'SOUTH' },
    { name: 'מצפה רמון', code: 'MITZPE-RAMON', district: 'SOUTH' },
    { name: 'רהט', code: 'RAHAT', district: 'SOUTH' },
    { name: 'כסיפה', code: 'KUSEIFE', district: 'SOUTH' },
    { name: 'תל שבע', code: 'TEL-SHEVA', district: 'SOUTH' },
    { name: 'לקיה', code: 'LAKIYA', district: 'SOUTH' },
    { name: 'ערערה-בנגב', code: 'ARARA-BANEGEV', district: 'SOUTH' },
    { name: 'חורה', code: 'HURA', district: 'SOUTH' },
    { name: 'שגב-שלום', code: 'SEGEV-SHALOM', district: 'SOUTH' },
    { name: 'ירוחם', code: 'YERUHAM', district: 'SOUTH' },
    { name: 'קריית מנחם', code: 'QIRYAT-MENAHEM', district: 'SOUTH' },
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
        description: `קמפיין בחירות ${city.name}`,
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
  console.log(`   - ${cities.length} Cities (All Israeli cities)`);
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
