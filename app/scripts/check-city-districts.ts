import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📍 Checking current city-district assignments:\n');

  const cities = await prisma.city.findMany({
    include: {
      areaManager: {
        select: {
          regionName: true,
          regionCode: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log('Total cities:', cities.length);
  console.log('\n');

  const byDistrict: Record<string, any[]> = {};

  cities.forEach((city) => {
    const districtName = city.areaManager?.regionName || 'לא משויך';
    if (!byDistrict[districtName]) {
      byDistrict[districtName] = [];
    }
    byDistrict[districtName].push(city);
  });

  Object.entries(byDistrict).forEach(([district, citiesList]) => {
    console.log(`\n${district}:`);
    console.log('='.repeat(50));
    citiesList.forEach((city) => {
      console.log(`  ✓ ${city.name} (${city.code})`);
    });
  });

  await prisma.$disconnect();
}

main();
