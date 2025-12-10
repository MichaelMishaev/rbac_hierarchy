import { prisma } from '../lib/prisma';

/**
 * Add GPS coordinates to existing sites
 * Israel coordinates range:
 * - Latitude: 29.5° to 33.3°N
 * - Longitude: 34.2° to 35.9°E
 */

const siteCoordinates: Record<string, { latitude: number; longitude: number }> = {
  // Tel Aviv area
  'משרד ראשי - תל אביב': { latitude: 32.0853, longitude: 34.7818 },
  'סניף תל אביב מרכז': { latitude: 32.0749, longitude: 34.7753 },

  // Haifa
  'סניף חיפה': { latitude: 32.7940, longitude: 34.9896 },

  // Jerusalem
  'סניף ירושלים': { latitude: 31.7683, longitude: 35.2137 },

  // Construction sites (spread around Israel)
  'אתר בנייה - פרויקט א': { latitude: 32.0944, longitude: 34.8006 }, // Ramat Gan
  'אתר בנייה - פרויקט ב': { latitude: 32.0333, longitude: 34.8166 }, // Bnei Brak
};

async function addGPSCoordinates() {
  console.log('🗺️  Adding GPS coordinates to sites...\n');

  const sites = await prisma.neighborhood.findMany({
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
    },
  });

  let updatedCount = 0;

  for (const site of sites) {
    const coords = siteCoordinates[site.name];

    if (coords && !site.latitude && !site.longitude) {
      await prisma.neighborhood.update({
        where: { id: site.id },
        data: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      });

      console.log(`✅ Updated "${site.name}": ${coords.latitude}, ${coords.longitude}`);
      updatedCount++;
    } else if (site.latitude && site.longitude) {
      console.log(`⏭️  Skipped "${site.name}" (already has coordinates)`);
    } else {
      console.log(`⚠️  No coordinates defined for "${site.name}"`);
    }
  }

  console.log(`\n✨ Updated ${updatedCount} sites with GPS coordinates`);

  // Show summary
  const sitesWithGPS = await prisma.neighborhood.count({
    where: {
      AND: [
        { latitude: { not: null } },
        { longitude: { not: null } },
      ],
    },
  });

  const totalSites = await prisma.neighborhood.count();
  console.log(`📍 ${sitesWithGPS}/${totalSites} sites now have GPS coordinates\n`);
}

addGPSCoordinates()
  .catch((error) => {
    console.error('❌ Error adding GPS coordinates:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
