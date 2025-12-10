import { PrismaClient } from '@prisma/client';
import { generateCityCode } from '../lib/transliteration';

const prisma = new PrismaClient();

/**
 * Seed script to add all 82 Israeli cities to the database
 * Based on official data as of 2025
 *
 * Updated: Uses Latin transliteration for city codes (URL-safe, DB-optimized)
 *
 * Run: npx tsx scripts/seed-israeli-cities.ts
 */

// Complete list of all 82 Israeli cities (in Hebrew)
// Updated as of 2025 with latest city designations
const ISRAELI_CITIES = [
  'אום אל-פחם',
  'אופקים',
  'אור יהודה',
  'אור עקיבא',
  'אילת',
  'אלעד',
  'אריאל',
  'אשדוד',
  'אשקלון',
  'באקה אל-גרבייה',
  'באר יעקב',        // Added 2025 - new city status
  'באר שבע',
  'בית שאן',
  'בית שמש',
  'ביתר עילית',
  'בני ברק',
  'בת ים',
  'גבעת שמואל',
  'גבעתיים',
  'גני תקווה',        // Added 2025 - new city status
  'דימונה',
  'הוד השרון',
  'הרצליה',
  'חדרה',
  'חולון',
  'חיפה',
  'חריש',            // Added 2025 - new city status
  'טבריה',
  'טייבה',
  'טירה',
  'טירת כרמל',
  'טמרה',
  'יבנה',
  'יהוד-מונוסון',
  'יקנעם עילית',
  'ירושלים',
  'כפר יונה',
  'כפר סבא',
  'כפר קאסם',
  'כפר קרע',         // Added 2025 - new city status
  'כרמיאל',
  'לוד',
  'מגדל העמק',
  'מודיעין-מכבים-רעות',
  'מודיעין עילית',
  'מע\'אר',          // Added 2025 - first Druze city
  'מעלה אדומים',
  'מעלות-תרשיחא',
  'נהריה',
  'נוף הגליל',
  'נס ציונה',
  'נצרת',
  'נשר',
  'נתיבות',
  'נתניה',
  'סח\'נין',
  'עכו',
  'עפולה',
  'עראבה',
  'ערד',
  'פתח תקווה',
  'צפת',
  'קלנסווה',
  'קריית אונו',
  'קריית אתא',
  'קריית ביאליק',
  'קריית גת',
  'קריית ים',
  'קריית מוצקין',
  'קריית מלאכי',
  'קריית שמונה',
  'ראש העין',
  'ראשון לציון',
  'רהט',
  'רחובות',
  'רמלה',
  'רמת גן',
  'רמת השרון',
  'רעננה',
  'שדרות',
  'שפרעם',
  'תל אביב-יפו'
];

// Note: generateCityCode is now imported from lib/transliteration.ts
// It converts Hebrew to Latin characters for better URL/DB compatibility

// Helper function to get region name based on city
function getCityRegion(cityName: string): string {
  // Major cities in different regions
  const northCities = [
    'חיפה', 'נהריה', 'עכו', 'כרמיאל', 'צפת', 'קריית שמונה',
    'טבריה', 'נצרת', 'עפולה', 'בית שאן', 'מגדל העמק', 'יקנעם עילית',
    'נוף הגליל', 'קריית אתא', 'קריית ביאליק', 'קריית ים', 'קריית מוצקין',
    'נשר', 'טירת כרמל', 'מעלות-תרשיחא', 'טמרה', 'סח\'נין', 'עראבה',
    'שפרעם', 'טייבה', 'טירה', 'מע\'אר'
  ];

  const centerCities = [
    'תל אביב-יפו', 'ראשון לציון', 'פתח תקווה', 'חולון', 'בני ברק',
    'רמת גן', 'בת ים', 'הרצליה', 'כפר סבא', 'רעננה', 'הוד השרון',
    'רמת השרון', 'גבעתיים', 'קריית אונו', 'גבעת שמואל', 'יהוד-מונוסון',
    'אור יהודה', 'לוד', 'רמלה', 'נס ציונה', 'רחובות', 'יבנה',
    'חדרה', 'נתניה', 'כפר יונה', 'אור עקיבא', 'ביתר עילית',
    'מודיעין-מכבים-רעות', 'מודיעין עילית', 'מעלה אדומים', 'אלעד',
    'ראש העין', 'כפר קאסם', 'באקה אל-גרבייה', 'באר יעקב',
    'גני תקווה', 'חריש', 'כפר קרע'
  ];

  const southCities = [
    'באר שבע', 'אשדוד', 'אשקלון', 'קריית גת', 'קריית מלאכי',
    'שדרות', 'נתיבות', 'אילת', 'ערד', 'דימונה', 'אופקים',
    'אום אל-פחם', 'קלנסווה', 'רהט'
  ];

  const jerusalemArea = ['ירושלים', 'בית שמש'];

  if (jerusalemArea.includes(cityName)) return 'אזור ירושלים';
  if (northCities.includes(cityName)) return 'צפון';
  if (centerCities.includes(cityName)) return 'מרכז';
  if (southCities.includes(cityName)) return 'דרום';

  return 'מרכז'; // Default to center
}

async function main() {
  console.log('🇮🇱 Starting Israeli cities seed...');
  console.log(`📊 Total cities to add: ${ISRAELI_CITIES.length}\n`);

  // Check if we need to create an area manager first
  let areaManager = await prisma.areaManager.findFirst({
    where: { regionName: 'מדינת ישראל' }
  });

  if (!areaManager) {
    console.log('⚠️  No "מדינת ישראל" area manager found. Cities will be created without area manager assignment.');
    console.log('   You can assign them to an area manager later via the UI.\n');
  }

  let added = 0;
  let skipped = 0;
  let updated = 0;

  // Get all existing codes to ensure uniqueness
  const existingCities = await prisma.city.findMany({
    select: { code: true }
  });
  const existingCodes = existingCities.map(c => c.code);

  for (const cityName of ISRAELI_CITIES) {
    const code = generateCityCode(cityName, existingCodes);
    const region = getCityRegion(cityName);

    try {
      // Check if city already exists (by name, since codes may change)
      const existingCity = await prisma.city.findFirst({
        where: { name: cityName }
      });

      if (existingCity) {
        // Update existing city (keep existing code, just update other fields)
        await prisma.city.update({
          where: { id: existingCity.id },
          data: {
            description: `עיר ${cityName} - אזור ${region}`,
            isActive: true,
          }
        });
        updated++;
        console.log(`✏️  עדכון: ${cityName} (קוד: ${existingCity.code})`);
      } else {
        // Create new city with transliterated code
        await prisma.city.create({
          data: {
            name: cityName,
            code,
            description: `עיר ${cityName} - אזור ${region}`,
            email: null,
            phone: null,
            address: null,
            isActive: true,
            areaManagerId: areaManager?.id || null,
          }
        });
        existingCodes.push(code); // Add to list to prevent duplicates
        added++;
        console.log(`✅ חדש: ${cityName} (קוד: ${code})`);
      }
    } catch (error) {
      console.error(`❌ שגיאה ב-${cityName}:`, error);
      skipped++;
    }
  }

  console.log('\n🎉 הושלם!');
  console.log(`✅ נוספו: ${added} ערים`);
  console.log(`✏️  עודכנו: ${updated} ערים`);
  console.log(`⚠️  דלגו: ${skipped} ערים`);
  console.log(`📊 סה"כ ערים במערכת: ${added + updated} / ${ISRAELI_CITIES.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
