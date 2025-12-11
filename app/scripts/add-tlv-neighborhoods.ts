import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTelAvivNeighborhoods() {
  console.log('🏘️  Adding Tel Aviv Neighborhoods...\n');

  try {
    // Find Tel Aviv city
    const telAviv = await prisma.city.findFirst({
      where: {
        OR: [
          { code: 'TLV-YAFO' },
          { code: 'tel-aviv-yafo' },
          { name: { contains: 'תל אביב' } },
          { name: { contains: 'Tel Aviv' } },
        ],
      },
    });

    if (!telAviv) {
      console.error('❌ Tel Aviv city not found in database');
      console.log('Available cities:');
      const cities = await prisma.city.findMany({
        select: { code: true, name: true },
      });
      console.table(cities);
      return;
    }

    console.log(`✅ Found Tel Aviv: ${telAviv.name} (${telAviv.code})\n`);

    // Tel Aviv neighborhoods based on Wikipedia and 2025 guides
    const neighborhoods = [
      // Center & Historic
      { name: 'לב העיר', nameEn: 'Lev Hair (City Center)' },
      { name: 'נווה צדק', nameEn: 'Neve Tzedek' },
      { name: 'פלורנטין', nameEn: 'Florentin' },
      { name: 'יפו העתיקה', nameEn: 'Old Jaffa' },
      { name: 'עג\'מי', nameEn: 'Ajami' },
      { name: 'נווה שאנן', nameEn: 'Neve Sha\'anan' },

      // North
      { name: 'צפון הישן', nameEn: 'Old North (Tzafon HaYashan)' },
      { name: 'רמת אביב', nameEn: 'Ramat Aviv' },
      { name: 'רמת החייל', nameEn: 'Ramat HaHayal' },
      { name: 'תל ברוך', nameEn: 'Tel Baruch' },
      { name: 'יד אליהו', nameEn: 'Yad Eliyahu' },

      // Central & East
      { name: 'בבלי', nameEn: 'Bavli' },
      { name: 'צהלון', nameEn: 'Tzahalon' },
      { name: 'שפירא', nameEn: 'Shapira' },
      { name: 'הקריה', nameEn: 'HaKirya' },

      // South
      { name: 'יפו ג\'', nameEn: 'Jaffa South (Yafo C)' },
      { name: 'גבעת התמרים', nameEn: 'Givat HaTmarim' },
      { name: 'גבעת עלייה', nameEn: 'Givat Aliyah' },

      // Beachfront & West
      { name: 'נמל תל אביב', nameEn: 'Tel Aviv Port Area' },
      { name: 'הירקון', nameEn: 'HaYarkon' },

      // Additional Popular Areas
      { name: 'רוטשילד', nameEn: 'Rothschild Boulevard Area' },
      { name: 'דיזנגוף', nameEn: 'Dizengoff Area' },
      { name: 'שוק הכרמל', nameEn: 'Carmel Market Area' },
      { name: 'נחלת בנימין', nameEn: 'Nahalat Binyamin' },
    ];

    console.log(`📝 Adding ${neighborhoods.length} neighborhoods to ${telAviv.name}...\n`);

    let created = 0;
    let skipped = 0;

    for (const neighborhood of neighborhoods) {
      try {
        // Check if neighborhood already exists
        const existing = await prisma.neighborhood.findFirst({
          where: {
            cityId: telAviv.id,
            name: neighborhood.name,
          },
        });

        if (existing) {
          console.log(`⏭️  Skipped: ${neighborhood.name} (already exists)`);
          skipped++;
          continue;
        }

        // Create neighborhood
        await prisma.neighborhood.create({
          data: {
            name: neighborhood.name,
            cityId: telAviv.id,
            address: `${neighborhood.name}, תל אביב-יפו`,
            city: 'תל אביב-יפו',
            country: 'ישראל',
            isActive: true,
          },
        });

        console.log(`✅ Created: ${neighborhood.name} (${neighborhood.nameEn})`);
        created++;
      } catch (error: any) {
        console.error(`❌ Error creating ${neighborhood.name}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created} neighborhoods`);
    console.log(`   ⏭️  Skipped: ${skipped} (already exist)`);
    console.log(`   📍 Total: ${created + skipped} neighborhoods\n`);

    // Show final count
    const totalNeighborhoods = await prisma.neighborhood.count({
      where: { cityId: telAviv.id, isActive: true },
    });

    console.log(`🏘️  ${telAviv.name} now has ${totalNeighborhoods} neighborhoods!`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTelAvivNeighborhoods();
