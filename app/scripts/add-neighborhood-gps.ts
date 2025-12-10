/**
 * Add GPS Coordinates to Neighborhoods
 * Updates existing neighborhoods with latitude/longitude for Tel Aviv areas
 */

import { prisma } from '../lib/prisma';

async function main() {
  console.log('🗺️  Adding GPS coordinates to neighborhoods...\n');

  // Tel Aviv neighborhoods with approximate coordinates
  const neighborhoods = [
    {
      id: 'tlv-florentin',
      name: 'פלורנטין (Florentin)',
      latitude: 32.0556,
      longitude: 34.7661,
    },
    {
      id: 'tlv-neve-tzedek',
      name: 'נווה צדק (Neve Tzedek)',
      latitude: 32.0608,
      longitude: 34.7630,
    },
    {
      id: 'tlv-old-jaffa',
      name: 'יפו העתיקה (Old Jaffa)',
      latitude: 32.0543,
      longitude: 34.7516,
    },
  ];

  for (const neighborhood of neighborhoods) {
    try {
      await prisma.neighborhood.update({
        where: { id: neighborhood.id },
        data: {
          latitude: neighborhood.latitude,
          longitude: neighborhood.longitude,
        },
      });
      console.log(`✅ ${neighborhood.name}: ${neighborhood.latitude}, ${neighborhood.longitude}`);
    } catch (error) {
      console.error(`❌ Failed to update ${neighborhood.name}:`, error);
    }
  }

  console.log('\n✨ GPS coordinates added successfully!');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
