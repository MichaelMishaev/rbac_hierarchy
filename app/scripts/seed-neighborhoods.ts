import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script to create realistic Israeli neighborhoods
 * Cleans up old test data and creates real examples
 *
 * Run: npx tsx scripts/seed-neighborhoods.ts
 */

async function main() {
  console.log('🏘️  Starting neighborhoods cleanup and seed...\n');

  // Step 1: Get city IDs for major cities
  const telAviv = await prisma.city.findUnique({
    where: { code: 'CITY_תל_אביב_יפו' }
  });

  const jerusalem = await prisma.city.findUnique({
    where: { code: 'CITY_ירושלים' }
  });

  const haifa = await prisma.city.findUnique({
    where: { code: 'CITY_חיפה' }
  });

  const beerSheva = await prisma.city.findUnique({
    where: { code: 'CITY_באר_שבע' }
  });

  if (!telAviv || !jerusalem || !haifa || !beerSheva) {
    console.error('❌ Could not find required cities. Make sure cities are seeded first.');
    process.exit(1);
  }

  console.log('✅ Found cities:');
  console.log(`   - ${telAviv.name} (${telAviv.id})`);
  console.log(`   - ${jerusalem.name} (${jerusalem.id})`);
  console.log(`   - ${haifa.name} (${haifa.id})`);
  console.log(`   - ${beerSheva.name} (${beerSheva.id})\n`);

  // Step 2: Delete old test neighborhoods
  console.log('🗑️  Deleting old test neighborhoods...');
  const deleteResult = await prisma.neighborhood.deleteMany({});
  console.log(`✅ Deleted ${deleteResult.count} old neighborhoods\n`);

  // Step 3: Create realistic neighborhoods
  console.log('📍 Creating realistic Israeli neighborhoods...\n');

  const neighborhoods = [
    // Tel Aviv neighborhoods (real famous neighborhoods)
    {
      id: 'tlv-florentin',
      name: 'פלורנטין',
      city: 'תל אביב-יפו',
      address: 'רח\' פלורנטין 20',
      country: 'ישראל',
      phone: '+972-3-517-0000',
      email: 'florentin@campaign.co.il',
      cityId: telAviv.id,
      isActive: true,
    },
    {
      id: 'tlv-neve-tzedek',
      name: 'נווה צדק',
      city: 'תל אביב-יפו',
      address: 'רח\' שבזי 30',
      country: 'ישראל',
      phone: '+972-3-510-0000',
      email: 'nevetzedek@campaign.co.il',
      cityId: telAviv.id,
      isActive: true,
    },
    {
      id: 'tlv-rothschild',
      name: 'שדרות רוטשילד',
      city: 'תל אביב-יפו',
      address: 'שדרות רוטשילד 80',
      country: 'ישראל',
      phone: '+972-3-566-0000',
      email: 'rothschild@campaign.co.il',
      cityId: telAviv.id,
      isActive: true,
    },
    {
      id: 'tlv-dizengoff',
      name: 'דיזנגוף',
      city: 'תל אביב-יפו',
      address: 'רח\' דיזנגוף 50',
      country: 'ישראל',
      phone: '+972-3-522-0000',
      email: 'dizengoff@campaign.co.il',
      cityId: telAviv.id,
      isActive: true,
    },
    {
      id: 'tlv-old-jaffa',
      name: 'יפו העתיקה',
      city: 'תל אביב-יפו',
      address: 'רח\' יפת 10',
      country: 'ישראל',
      phone: '+972-3-682-0000',
      email: 'jaffa@campaign.co.il',
      cityId: telAviv.id,
      isActive: true,
    },
    {
      id: 'tlv-old-north',
      name: 'הצפון הישן',
      city: 'תל אביב-יפו',
      address: 'רח\' אבן גבירול 125',
      country: 'ישראל',
      phone: '+972-3-605-0000',
      email: 'oldnorth@campaign.co.il',
      cityId: telAviv.id,
      isActive: true,
    },

    // Jerusalem neighborhoods
    {
      id: 'jer-city-center',
      name: 'מרכז העיר',
      city: 'ירושלים',
      address: 'רח\' יפו 45',
      country: 'ישראל',
      phone: '+972-2-623-0000',
      email: 'center.jer@campaign.co.il',
      cityId: jerusalem.id,
      isActive: true,
    },
    {
      id: 'jer-mahane-yehuda',
      name: 'מחנה יהודה',
      city: 'ירושלים',
      address: 'רח\' אגריפס 88',
      country: 'ישראל',
      phone: '+972-2-624-0000',
      email: 'mahane@campaign.co.il',
      cityId: jerusalem.id,
      isActive: true,
    },
    {
      id: 'jer-old-city',
      name: 'העיר העתיקה',
      city: 'ירושלים',
      address: 'דרך שכם',
      country: 'ישראל',
      phone: '+972-2-627-0000',
      email: 'oldcity@campaign.co.il',
      cityId: jerusalem.id,
      isActive: true,
    },
    {
      id: 'jer-givat-shaul',
      name: 'גבעת שאול',
      city: 'ירושלים',
      address: 'רח\' יחזקאל 15',
      country: 'ישראל',
      phone: '+972-2-651-0000',
      email: 'givatshaul@campaign.co.il',
      cityId: jerusalem.id,
      isActive: true,
    },

    // Haifa neighborhoods
    {
      id: 'hfa-hadar',
      name: 'הדר',
      city: 'חיפה',
      address: 'שדרות הרצל 100',
      country: 'ישראל',
      phone: '+972-4-862-0000',
      email: 'hadar@campaign.co.il',
      cityId: haifa.id,
      isActive: true,
    },
    {
      id: 'hfa-carmel',
      name: 'כרמל צרפתי',
      city: 'חיפה',
      address: 'דרך הים 200',
      country: 'ישראל',
      phone: '+972-4-838-0000',
      email: 'carmel@campaign.co.il',
      cityId: haifa.id,
      isActive: true,
    },
    {
      id: 'hfa-neve-shaanan',
      name: 'נווה שאנן',
      city: 'חיפה',
      address: 'רח\' הנביאים 50',
      country: 'ישראל',
      phone: '+972-4-866-0000',
      email: 'neveshaanan@campaign.co.il',
      cityId: haifa.id,
      isActive: true,
    },

    // Be'er Sheva neighborhoods
    {
      id: 'bs-old-quarter',
      name: 'הרובע הישן',
      city: 'באר שבע',
      address: 'רח\' הבנים 10',
      country: 'ישראל',
      phone: '+972-8-623-0000',
      email: 'oldquarter@campaign.co.il',
      cityId: beerSheva.id,
      isActive: true,
    },
    {
      id: 'bs-ramot',
      name: 'רמות',
      city: 'באר שבע',
      address: 'רח\' רגר 50',
      country: 'ישראל',
      phone: '+972-8-640-0000',
      email: 'ramot@campaign.co.il',
      cityId: beerSheva.id,
      isActive: true,
    },
    {
      id: 'bs-dalet',
      name: 'שכונה ד\'',
      city: 'באר שבע',
      address: 'רח\' הפלמ"ח 30',
      country: 'ישראל',
      phone: '+972-8-627-0000',
      email: 'dalet@campaign.co.il',
      cityId: beerSheva.id,
      isActive: true,
    },
  ];

  let created = 0;
  for (const neighborhood of neighborhoods) {
    try {
      await prisma.neighborhood.create({
        data: neighborhood,
      });
      created++;
      console.log(`✅ ${neighborhood.name} (${neighborhood.city})`);
    } catch (error) {
      console.error(`❌ Failed to create ${neighborhood.name}:`, error);
    }
  }

  console.log(`\n🎉 Successfully created ${created}/${neighborhoods.length} neighborhoods!`);
  console.log('\n📊 Summary by city:');
  console.log(`   תל אביב-יפו: 6 neighborhoods`);
  console.log(`   ירושלים: 4 neighborhoods`);
  console.log(`   חיפה: 3 neighborhoods`);
  console.log(`   באר שבע: 3 neighborhoods`);
  console.log(`\n✨ Total: 16 realistic Israeli neighborhoods`);
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
