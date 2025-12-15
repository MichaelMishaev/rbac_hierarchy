import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCityAssignment() {
  const city = await prisma.city.findFirst({
    where: { name: 'שפרעם' },
    include: {
      areaManager: {
        include: {
          user: true,
        },
      },
    },
  });

  console.log('\n=== City שפרעם ===');
  if (city) {
    console.log('City ID:', city.id);
    console.log('City Name:', city.name);
    console.log('Area Manager ID:', city.areaManagerId || 'NULL (NOT ASSIGNED!)');
    if (city.areaManager) {
      console.log('Area Manager:', city.areaManager.regionName);
      console.log('Area Manager User:', city.areaManager.user?.email);
    } else {
      console.log('⚠️  NO AREA MANAGER ASSIGNED!');
    }
  } else {
    console.log('City not found!');
  }

  const cafon = await prisma.user.findFirst({
    where: { email: 'cafon@gmail.com' },
    include: {
      areaManager: {
        include: {
          cities: true,
        },
      },
    },
  });

  console.log('\n=== Area Manager (cafon@gmail.com) ===');
  if (cafon?.areaManager) {
    console.log('Area Manager ID:', cafon.areaManager.id);
    console.log('Region:', cafon.areaManager.regionName);
    console.log('Cities Count:', cafon.areaManager.cities.length);
    console.log('Cities:');
    cafon.areaManager.cities.forEach(c => console.log('  -', c.name));
    
    const hasShfaram = cafon.areaManager.cities.some(c => c.name === 'שפרעם');
    console.log('\n✅ Has שפרעם:', hasShfaram ? 'YES' : 'NO');
  }

  await prisma.$disconnect();
}

checkCityAssignment();
