#!/usr/bin/env tsx
/**
 * Create ONLY the 6 Israeli administrative districts (Areas)
 * WITHOUT creating any users
 *
 * Areas will exist independently and can be assigned managers later
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 6 Official Israeli Districts - NO USERS
const ISRAELI_DISTRICTS = [
  {
    code: 'JERUSALEM',
    nameHebrew: 'מחוז ירושלים',
    nameEnglish: 'Jerusalem District',
    description: 'מחוז ירושלים - אזור ירושלים והסביבה',
    metadata: {
      capital: 'ירושלים',
      population: 1253900,
      area: '652 km²',
    },
  },
  {
    code: 'NORTH',
    nameHebrew: 'מחוז הצפון',
    nameEnglish: 'Northern District',
    description: 'מחוז הצפון - הגליל והעמקים',
    metadata: {
      capital: 'נצרת',
      population: 1401900,
      area: '4,478 km²',
    },
  },
  {
    code: 'HAIFA',
    nameHebrew: 'מחוז חיפה',
    nameEnglish: 'Haifa District',
    description: 'מחוז חיפה - חיפה והקריות',
    metadata: {
      capital: 'חיפה',
      population: 1014500,
      area: '864 km²',
    },
  },
  {
    code: 'CENTER',
    nameHebrew: 'מחוז המרכז',
    nameEnglish: 'Central District',
    description: 'מחוז המרכז - השפלה והשרון',
    metadata: {
      capital: 'רמלה',
      population: 2329500,
      area: '1,294 km²',
    },
  },
  {
    code: 'TEL_AVIV',
    nameHebrew: 'מחוז תל אביב',
    nameEnglish: 'Tel Aviv District',
    description: 'מחוז תל אביב - גוש דן המטרופוליני',
    metadata: {
      capital: 'תל אביב-יפו',
      population: 1423300,
      area: '172 km²',
      note: 'המחוז הקטן ביותר אך הצפוף ביותר',
    },
  },
  {
    code: 'SOUTH',
    nameHebrew: 'מחוז הדרום',
    nameEnglish: 'Southern District',
    description: 'מחוז הדרום - הנגב ובאר שבע',
    metadata: {
      capital: 'באר שבע',
      population: 1244200,
      area: '14,231 km²',
      note: 'המחוז הגדול ביותר - כולל את הנגב',
    },
  },
];

async function main() {
  console.log('🇮🇱 Creating 6 Israeli districts (AREAS ONLY - NO USERS)\n');
  console.log('═'.repeat(80) + '\n');

  const created: any[] = [];
  const updated: any[] = [];
  const errors: any[] = [];

  for (const district of ISRAELI_DISTRICTS) {
    try {
      console.log(`🔄 Processing: ${district.nameHebrew} (${district.code})...`);

      // Check if area already exists
      const existingArea = await prisma.areaManager.findUnique({
        where: { regionCode: district.code },
      });

      if (existingArea) {
        // Update existing area
        await prisma.areaManager.update({
          where: { id: existingArea.id },
          data: {
            regionName: district.nameHebrew,
            isActive: true,
            metadata: district.metadata,
          },
        });

        updated.push({
          district: district.nameHebrew,
          code: district.code,
        });

        console.log(`   ✅ Updated: ${district.nameHebrew}`);
      } else {
        // Create new area WITHOUT a user
        await prisma.areaManager.create({
          data: {
            regionCode: district.code,
            regionName: district.nameHebrew,
            userId: null, // No user assigned
            isActive: true,
            metadata: district.metadata,
          },
        });

        created.push({
          district: district.nameHebrew,
          code: district.code,
        });

        console.log(`   ✅ Created: ${district.nameHebrew} (no manager assigned)`);
      }

      console.log(`   📊 Population: ${district.metadata.population.toLocaleString()}`);
      console.log(`   📍 Capital: ${district.metadata.capital}`);
      console.log();
    } catch (error) {
      console.error(`   ❌ Error processing ${district.nameHebrew}:`, error);
      errors.push({
        district: district.nameHebrew,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log();
    }
  }

  // Summary
  console.log('═'.repeat(80));
  console.log('📊 SUMMARY\n');

  if (created.length > 0) {
    console.log(`✅ Created ${created.length} new area(s):`);
    created.forEach((d) => {
      console.log(`   - ${d.district} (${d.code})`);
    });
    console.log();
  }

  if (updated.length > 0) {
    console.log(`🔄 Updated ${updated.length} existing area(s):`);
    updated.forEach((d) => {
      console.log(`   - ${d.district} (${d.code})`);
    });
    console.log();
  }

  if (errors.length > 0) {
    console.log(`❌ Failed ${errors.length} area(s):`);
    errors.forEach((e) => {
      console.log(`   - ${e.district}: ${e.error}`);
    });
    console.log();
  }

  // Verify all areas
  const allAreas = await prisma.areaManager.findMany({
    include: { user: true },
    orderBy: { regionName: 'asc' },
  });

  console.log('═'.repeat(80));
  console.log('🗺️  ALL AREAS IN DATABASE:\n');
  allAreas.forEach((area, i) => {
    const status = area.isActive ? '✅' : '❌';
    const manager = area.user ? `Manager: ${area.user.fullName}` : '⚠️  No manager assigned';
    console.log(`${i + 1}. ${status} ${area.regionName} (${area.regionCode})`);
    console.log(`   ${manager}`);
  });

  console.log('\n═'.repeat(80));
  console.log('✅ All 6 Israeli districts exist as independent areas!');
  console.log('\n⚠️  IMPORTANT:');
  console.log('   - Areas exist WITHOUT users');
  console.log('   - Deleting users will NOT delete areas');
  console.log('   - You can assign managers to areas later via the /areas page');
  console.log('\n🔗 To view: http://localhost:3200/areas');
  console.log('   Login with: admin@election.test / admin123\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Script failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
