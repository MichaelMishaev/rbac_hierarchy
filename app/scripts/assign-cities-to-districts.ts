import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Official Israeli District Assignments based on government data
const districtAssignments: Record<string, string[]> = {
  'מחוז הצפון': [
    'tzfat',
    'karmiel',
    'nahariya',
    'kiryat-shmona',
    'acre',
    'tiberias',
    'migdal-haemek',
    'afula',
    'nazareth',
    'beit-shean',
    'maalot-tarshiha',
    'nof-hagalil',
    'yokneam-illit',
    'majd-al-krum',
    'sakhnin',
    'tamra',
    'shfaram',
    'arraba',
    'kafr-qara',
  ],
  'מחוז חיפה': [
    'haifa',
    'nesher',
    'tirat-carmel',
    'or-akiva',
    'hadera',
    'kiryat-ata',
    'kiryat-bialik',
    'kiryat-yam',
    'kiryat-motzkin',
  ],
  'מחוז תל אביב': [
    'TLV-YAFO',
    'RAMAT-GAN',
    'givatayim',
    'bnei-brak',
    'holon',
    'bat-yam',
    'herzliya',
    'ramat-hasharon',
    'or-yehuda',
    'kiryat-ono',
    'givat-shmuel',
    'ganei-tikva',
  ],
  'מחוז המרכז': [
    'petah-tikva',
    'rishon-letzion',
    'rehovot',
    'netanya',
    'kfar-saba',
    'hod-hasharon',
    'raanana',
    'rosh-haayin',
    'yehud-monosson',
    'lod',
    'ramla',
    'modiin-maccabim-reut',
    'nes-ziona',
    'yavne',
    'kfar-yona',
    'tayibe',
    'tira',
    'qalansawe',
    'kafr-qasim',
    'baqa-al-gharbiyye',
    'umm-al-fahm',
  ],
  'מחוז ירושלים': [
    'jerusalem',
    'beit-shemesh',
    'maaleh-adumim',
    'modiin-illit',
    'beitar-illit',
  ],
  'מחוז הדרום': [
    'beer-sheva',
    'ashdod',
    'ashkelon',
    'eilat',
    'dimona',
    'arad',
    'ofakim',
    'netivot',
    'kiryat-gat',
    'kiryat-malakhi',
    'sderot',
    'beer-yaakov',
    'rahat',
  ],
  // Special administrative regions (will be assigned based on proximity)
  'אזורים מיוחדים': [
    'ariel',    // West Bank settlement - assign to Central
    'elad',     // Assign to Central
    'harish',   // Assign to Haifa
  ],
};

async function main() {
  console.log('📍 Assigning cities to their official Israeli districts...\n');

  // Get all districts
  const districts = await prisma.areaManager.findMany({
    select: {
      id: true,
      regionName: true,
      regionCode: true,
    },
  });

  const districtMap = new Map<string, string>();
  districts.forEach((d) => {
    districtMap.set(d.regionName, d.id);
  });

  console.log('Available districts:');
  districts.forEach((d) => console.log(`  - ${d.regionName} (${d.regionCode})`));
  console.log('\n');

  let totalAssigned = 0;
  let totalErrors = 0;

  // Process each district
  for (const [districtName, cityCodes] of Object.entries(districtAssignments)) {
    const districtId = districtMap.get(districtName);

    if (!districtId && districtName !== 'אזורים מיוחדים') {
      console.log(`⚠️  District "${districtName}" not found in database. Skipping...`);
      continue;
    }

    console.log(`\n${districtName}:`);
    console.log('='.repeat(60));

    for (const cityCode of cityCodes) {
      try {
        // Handle special regions
        let targetDistrictId = districtId;
        if (districtName === 'אזורים מיוחדים') {
          // Assign special regions to appropriate districts
          if (cityCode === 'ariel' || cityCode === 'elad') {
            targetDistrictId = districtMap.get('מחוז המרכז');
          } else if (cityCode === 'harish') {
            targetDistrictId = districtMap.get('מחוז חיפה');
          }
        }

        if (!targetDistrictId) {
          console.log(`  ⚠️  No target district for ${cityCode}`);
          totalErrors++;
          continue;
        }

        const result = await prisma.city.updateMany({
          where: {
            code: cityCode,
          },
          data: {
            areaManagerId: targetDistrictId,
          },
        });

        if (result.count > 0) {
          const city = await prisma.city.findUnique({
            where: { code: cityCode },
            select: { name: true },
          });
          console.log(`  ✓ ${city?.name || cityCode} assigned`);
          totalAssigned++;
        } else {
          console.log(`  ⚠️  City with code "${cityCode}" not found`);
          totalErrors++;
        }
      } catch (error) {
        console.log(`  ❌ Error assigning ${cityCode}:`, error);
        totalErrors++;
      }
    }
  }

  console.log('\n');
  console.log('='.repeat(60));
  console.log(`✅ Total cities assigned: ${totalAssigned}`);
  console.log(`⚠️  Total errors: ${totalErrors}`);
  console.log('='.repeat(60));

  // Show final summary
  console.log('\n📊 Final Distribution:\n');
  const finalCounts = await prisma.city.groupBy({
    by: ['areaManagerId'],
    _count: true,
  });

  for (const count of finalCounts) {
    if (count.areaManagerId) {
      const district = await prisma.areaManager.findUnique({
        where: { id: count.areaManagerId },
        select: { regionName: true },
      });
      console.log(`  ${district?.regionName}: ${count._count} cities`);
    } else {
      console.log(`  לא משויך: ${count._count} cities`);
    }
  }

  await prisma.$disconnect();
}

main();
