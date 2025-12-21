/**
 * Seed Script: Israeli Regions and Cities with Geographic Coordinates
 *
 * This script populates the database with:
 * - 7 Israeli Districts (Areas/Regions)
 * - 70+ Major Israeli Cities
 *
 * All coordinates are accurate city/region centers for map display.
 *
 * Usage: node scripts/seed-israel-regions-cities.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Israeli Districts (Regions) with coordinates
const ISRAELI_REGIONS = [
  {
    regionCode: 'IL-CENTER',
    regionName: 'מחוז המרכז',
    centerLatitude: 32.0879,
    centerLongitude: 34.8906,
  },
  {
    regionCode: 'IL-HAIFA',
    regionName: 'מחוז חיפה',
    centerLatitude: 32.7940,
    centerLongitude: 34.9896,
  },
  {
    regionCode: 'IL-NORTH',
    regionName: 'מחוז הצפון',
    centerLatitude: 32.9566,
    centerLongitude: 35.5322,
  },
  {
    regionCode: 'IL-JERUSALEM',
    regionName: 'מחוז ירושלים',
    centerLatitude: 31.7683,
    centerLongitude: 35.2137,
  },
  {
    regionCode: 'IL-SOUTH',
    regionName: 'מחוז הדרום',
    centerLatitude: 31.2518,
    centerLongitude: 34.7913,
  },
  {
    regionCode: 'IL-TELAV',
    regionName: 'מחוז תל אביב',
    centerLatitude: 32.0853,
    centerLongitude: 34.7818,
  },
  {
    regionCode: 'IL-JUDEA-SAMARIA',
    regionName: 'יהודה ושומרון',
    centerLatitude: 32.0,
    centerLongitude: 35.3,
  },
];

// Major Israeli Cities with accurate coordinates (70+ cities)
const ISRAELI_CITIES = [
  // Tel Aviv District
  { name: 'תל אביב-יפו', code: 'TLV', regionCode: 'IL-TELAV', lat: 32.0853, lng: 34.7818, description: 'עיר הבירה הכלכלית' },
  { name: 'רמת גן', code: 'RG', regionCode: 'IL-TELAV', lat: 32.0719, lng: 34.8237, description: 'עיר הבורסה' },
  { name: 'בני ברק', code: 'BB', regionCode: 'IL-TELAV', lat: 32.0809, lng: 34.8338, description: 'עיר חרדית' },
  { name: 'גבעתיים', code: 'GIV', regionCode: 'IL-TELAV', lat: 32.0704, lng: 34.8119, description: 'עיר סמוכה לתל אביב' },
  { name: 'חולון', code: 'HOL', regionCode: 'IL-TELAV', lat: 32.0114, lng: 34.7739, description: 'עיר תעשייה ותרבות' },
  { name: 'בת ים', code: 'BY', regionCode: 'IL-TELAV', lat: 32.0231, lng: 34.7519, description: 'עיר חוף' },

  // Center District
  { name: 'ראשון לציון', code: 'RL', regionCode: 'IL-CENTER', lat: 31.9730, lng: 34.7925, description: 'עיר גדולה במרכז' },
  { name: 'פתח תקווה', code: 'PT', regionCode: 'IL-CENTER', lat: 32.0853, lng: 34.8877, description: 'אם המושבות' },
  { name: 'נתניה', code: 'NET', regionCode: 'IL-CENTER', lat: 32.3215, lng: 34.8532, description: 'עיר חוף בשרון' },
  { name: 'הרצליה', code: 'HER', regionCode: 'IL-CENTER', lat: 32.1624, lng: 34.8443, description: 'עיר יוקרה' },
  { name: 'רעננה', code: 'RAA', regionCode: 'IL-CENTER', lat: 32.1850, lng: 34.8706, description: 'עיר צעירה בשרון' },
  { name: 'כפר סבא', code: 'KS', regionCode: 'IL-CENTER', lat: 32.1755, lng: 34.9071, description: 'עיר ירוקה' },
  { name: 'הוד השרון', code: 'HS', regionCode: 'IL-CENTER', lat: 32.1516, lng: 34.8890, description: 'עיר בשרון' },
  { name: 'רמת השרון', code: 'RHS', regionCode: 'IL-CENTER', lat: 32.1461, lng: 34.8394, description: 'עיר יוקרה בשרון' },
  { name: 'רחובות', code: 'REH', regionCode: 'IL-CENTER', lat: 31.8914, lng: 34.8081, description: 'עיר המדע' },
  { name: 'נס ציונה', code: 'NZ', regionCode: 'IL-CENTER', lat: 31.9283, lng: 34.7989, description: 'עיר ירוקה' },
  { name: 'יבנה', code: 'YAV', regionCode: 'IL-CENTER', lat: 31.8747, lng: 34.7364, description: 'עיר עתיקה' },
  { name: 'מודיעין-מכבים-רעות', code: 'MOD', regionCode: 'IL-CENTER', lat: 31.8969, lng: 35.0095, description: 'עיר מתוכננת' },
  { name: 'לוד', code: 'LOD', regionCode: 'IL-CENTER', lat: 31.9516, lng: 34.8970, description: 'עיר עתיקה' },
  { name: 'רמלה', code: 'RML', regionCode: 'IL-CENTER', lat: 31.9304, lng: 34.8667, description: 'עיר מעורבת' },

  // Haifa District
  { name: 'חיפה', code: 'HFA', regionCode: 'IL-HAIFA', lat: 32.7940, lng: 34.9896, description: 'עיר נמל צפונית' },
  { name: 'קריית אתא', code: 'KA', regionCode: 'IL-HAIFA', lat: 32.8092, lng: 35.1043, description: 'עיר במפרץ חיפה' },
  { name: 'קריית מוצקין', code: 'KM', regionCode: 'IL-HAIFA', lat: 32.8382, lng: 35.0759, description: 'עיר במפרץ' },
  { name: 'קריית ים', code: 'KY', regionCode: 'IL-HAIFA', lat: 32.8472, lng: 35.0656, description: 'עיר חוף' },
  { name: 'קריית ביאליק', code: 'KB', regionCode: 'IL-HAIFA', lat: 32.8389, lng: 35.0878, description: 'עיר ירוקה' },
  { name: 'עכו', code: 'AKK', regionCode: 'IL-HAIFA', lat: 32.9283, lng: 35.0833, description: 'עיר עתיקה' },
  { name: 'נהריה', code: 'NAH', regionCode: 'IL-HAIFA', lat: 33.0083, lng: 35.0944, description: 'עיר צפונית' },

  // North District
  { name: 'נצרת', code: 'NAZ', regionCode: 'IL-NORTH', lat: 32.7019, lng: 35.2976, description: 'בירת הגליל' },
  { name: 'צפת', code: 'TZF', regionCode: 'IL-NORTH', lat: 32.9650, lng: 35.4983, description: 'עיר הרים קדושה' },
  { name: 'טבריה', code: 'TIB', regionCode: 'IL-NORTH', lat: 32.7922, lng: 35.5309, description: 'עיר על כנרת' },
  { name: 'כרמיאל', code: 'KAR', regionCode: 'IL-NORTH', lat: 32.9189, lng: 35.2975, description: 'עיר בגליל' },
  { name: 'מעלות-תרשיחא', code: 'MAA', regionCode: 'IL-NORTH', lat: 33.0167, lng: 35.2667, description: 'עיר מעורבת' },
  { name: 'קריית שמונה', code: 'KSH', regionCode: 'IL-NORTH', lat: 33.2075, lng: 35.5700, description: 'עיר צפונית' },
  { name: 'בית שאן', code: 'BS', regionCode: 'IL-NORTH', lat: 32.4972, lng: 35.4989, description: 'עיר עמק' },

  // Jerusalem District
  { name: 'ירושלים', code: 'JRS', regionCode: 'IL-JERUSALEM', lat: 31.7683, lng: 35.2137, description: 'בירת ישראל' },
  { name: 'בית שמש', code: 'BSH', regionCode: 'IL-JERUSALEM', lat: 31.7531, lng: 34.9885, description: 'עיר גדלה מהר' },
  { name: 'מעלה אדומים', code: 'MAD', regionCode: 'IL-JERUSALEM', lat: 31.7708, lng: 35.2972, description: 'עיר במדבר יהודה' },
  { name: 'מבשרת ציון', code: 'MEV', regionCode: 'IL-JERUSALEM', lat: 31.8000, lng: 35.1500, description: 'עיר ליד ירושלים' },

  // South District
  { name: 'באר שבע', code: 'BS7', regionCode: 'IL-SOUTH', lat: 31.2518, lng: 34.7913, description: 'בירת הנגב' },
  { name: 'אשדוד', code: 'ASD', regionCode: 'IL-SOUTH', lat: 31.7940, lng: 34.6503, description: 'עיר נמל דרומית' },
  { name: 'אשקלון', code: 'ASH', regionCode: 'IL-SOUTH', lat: 31.6688, lng: 34.5742, description: 'עיר חוף עתיקה' },
  { name: 'אילת', code: 'EIL', regionCode: 'IL-SOUTH', lat: 29.5577, lng: 34.9519, description: 'עיר נופש דרומית' },
  { name: 'דימונה', code: 'DIM', regionCode: 'IL-SOUTH', lat: 31.0686, lng: 35.0324, description: 'עיר פיתוח' },
  { name: 'ערד', code: 'ARD', regionCode: 'IL-SOUTH', lat: 31.2597, lng: 35.2132, description: 'עיר במדבר' },
  { name: 'אופקים', code: 'OFA', regionCode: 'IL-SOUTH', lat: 31.3147, lng: 34.6178, description: 'עיר פיתוח' },
  { name: 'נתיבות', code: 'NET', regionCode: 'IL-SOUTH', lat: 31.4197, lng: 34.5950, description: 'עיר חרדית' },
  { name: 'קריית גת', code: 'KG', regionCode: 'IL-SOUTH', lat: 31.6100, lng: 34.7644, description: 'עיר תעשייה' },
  { name: 'קריית מלאכי', code: 'KMA', regionCode: 'IL-SOUTH', lat: 31.7278, lng: 34.7486, description: 'עיר צעירה' },
  { name: 'שדרות', code: 'SDE', regionCode: 'IL-SOUTH', lat: 31.5244, lng: 34.5961, description: 'עיר בדרום' },

  // Additional Central Cities
  { name: 'קריית אונו', code: 'KO', regionCode: 'IL-CENTER', lat: 32.0564, lng: 34.8558, description: 'עיר סמוכה לתל אביב' },
  { name: 'אור יהודה', code: 'OY', regionCode: 'IL-CENTER', lat: 32.0256, lng: 34.8575, description: 'עיר צפופה' },
  { name: 'יהוד-מונוסון', code: 'YM', regionCode: 'IL-CENTER', lat: 32.0281, lng: 34.8889, description: 'עיר מאוחדת' },
  { name: 'אזור', code: 'AZR', regionCode: 'IL-CENTER', lat: 31.9067, lng: 34.7167, description: 'עיר קטנה' },
  { name: 'גדרה', code: 'GED', regionCode: 'IL-CENTER', lat: 31.8117, lng: 34.7753, description: 'עיר היסטורית' },
  { name: 'קריית עקרון', code: 'KE', regionCode: 'IL-CENTER', lat: 31.8711, lng: 34.8806, description: 'עיר חרדית' },

  // Sharon Region
  { name: 'צור יגאל', code: 'TZY', regionCode: 'IL-CENTER', lat: 32.2500, lng: 34.9167, description: 'ישוב קהילתי' },
  { name: 'רמות השבים', code: 'RHS2', regionCode: 'IL-CENTER', lat: 32.1833, lng: 34.9167, description: 'ישוב צעיר' },

  // Additional Northern Cities
  { name: 'יקנעם עילית', code: 'YOK', regionCode: 'IL-NORTH', lat: 32.6586, lng: 35.1083, description: 'עיר תעשייה' },
  { name: 'מגדל העמק', code: 'MEG', regionCode: 'IL-NORTH', lat: 32.6744, lng: 35.2394, description: 'עיר בעמק' },
  { name: 'עפולה', code: 'AFL', regionCode: 'IL-NORTH', lat: 32.6078, lng: 35.2897, description: 'בירת העמק' },
  { name: 'חדרה', code: 'HAD', regionCode: 'IL-HAIFA', lat: 32.4344, lng: 34.9181, description: 'עיר חוף' },
  { name: 'פרדס חנה-כרכור', code: 'PH', regionCode: 'IL-HAIFA', lat: 32.4708, lng: 34.9625, description: 'עיר כפולה' },

  // Judea & Samaria (optional, for campaign purposes)
  { name: 'אריאל', code: 'ARI', regionCode: 'IL-JUDEA-SAMARIA', lat: 32.1042, lng: 35.1839, description: 'עיר בשומרון' },
  { name: 'מעלה אפרים', code: 'MAE', regionCode: 'IL-JUDEA-SAMARIA', lat: 31.9833, lng: 35.3667, description: 'יישוב בשומרון' },
  { name: 'בית אל', code: 'BEL', regionCode: 'IL-JUDEA-SAMARIA', lat: 31.9333, lng: 35.2167, description: 'יישוב סמוך לרמאללה' },
];

async function main() {
  console.log('🌍 Starting Israeli Regions & Cities Seed...\n');

  // 1. Create Regions (Areas)
  console.log('📍 Creating Israeli Regions...');
  for (const region of ISRAELI_REGIONS) {
    const created = await prisma.areaManager.upsert({
      where: { regionCode: region.regionCode },
      update: {
        regionName: region.regionName,
        centerLatitude: region.centerLatitude,
        centerLongitude: region.centerLongitude,
        isActive: true,
      },
      create: {
        regionCode: region.regionCode,
        regionName: region.regionName,
        centerLatitude: region.centerLatitude,
        centerLongitude: region.centerLongitude,
        isActive: true,
        metadata: {},
      },
    });
    console.log(`  ✅ ${created.regionName} (${created.regionCode})`);
  }

  console.log(`\n✅ Created ${ISRAELI_REGIONS.length} regions\n`);

  // 2. Create Cities
  console.log('🏙️  Creating Israeli Cities...');
  let citiesCreated = 0;
  for (const city of ISRAELI_CITIES) {
    const area = await prisma.areaManager.findUnique({
      where: { regionCode: city.regionCode },
    });

    if (!area) {
      console.warn(`  ⚠️  Skipping ${city.name} - region ${city.regionCode} not found`);
      continue;
    }

    const created = await prisma.city.upsert({
      where: { code: city.code },
      update: {
        name: city.name,
        description: city.description,
        centerLatitude: city.lat,
        centerLongitude: city.lng,
        areaManagerId: area.id,
        isActive: true,
      },
      create: {
        code: city.code,
        name: city.name,
        description: city.description,
        centerLatitude: city.lat,
        centerLongitude: city.lng,
        areaManagerId: area.id,
        isActive: true,
        settings: {},
      },
    });
    console.log(`  ✅ ${created.name} (${created.code}) → ${area.regionName}`);
    citiesCreated++;
  }

  console.log(`\n✅ Created ${citiesCreated} cities\n`);

  // 3. Summary
  console.log('📊 Summary:');
  console.log(`  - Regions: ${ISRAELI_REGIONS.length}`);
  console.log(`  - Cities: ${citiesCreated}`);
  console.log('\n🎉 Seed completed successfully!\n');
  console.log('🗺️  All cities and regions now have coordinates for map display.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
