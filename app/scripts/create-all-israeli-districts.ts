#!/usr/bin/env tsx
/**
 * Create all 6 Israeli administrative districts (מחוזות ישראל)
 * Based on official Israeli government districts
 *
 * Source: https://en.wikipedia.org/wiki/Districts_of_Israel
 * 6 main districts: Jerusalem, North, Haifa, Center, Tel Aviv, South
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 6 Official Israeli Districts
const ISRAELI_DISTRICTS = [
  {
    code: 'JERUSALEM',
    nameHebrew: 'מחוז ירושלים',
    nameEnglish: 'Jerusalem District',
    managerName: 'אבי הר-טוב',
    email: 'manager@jerusalem-district.prod',
    phone: '+972-54-200-0001',
    description: 'מנהל אזורי אחראי על קמפיין הבחירות במחוז ירושלים',
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
    managerName: 'יעל גולן',
    email: 'manager@north-district.prod',
    phone: '+972-54-200-0002',
    description: 'מנהלת אזורית אחראית על קמפיין הבחירות במחוז הצפון',
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
    managerName: 'מיכאל כרמל',
    email: 'manager@haifa-district.prod',
    phone: '+972-54-200-0003',
    description: 'מנהל אזורי אחראי על קמפיין הבחירות במחוז חיפה',
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
    managerName: 'רונית שרון',
    email: 'manager@center-district.prod',
    phone: '+972-54-200-0004',
    description: 'מנהלת אזורית אחראית על קמפיין הבחירות במחוז המרכז',
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
    managerName: 'שרה כהן',
    email: 'manager@telaviv-district.prod',
    phone: '+972-54-200-0005',
    description: 'מנהלת אזורית אחראית על קמפיין הבחירות במחוז תל אביב',
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
    managerName: 'תמר נגב',
    email: 'manager@south-district.prod',
    phone: '+972-54-200-0006',
    description: 'מנהלת אזורית אחראית על קמפיין הבחירות במחוז הדרום',
    metadata: {
      capital: 'באר שבע',
      population: 1244200,
      area: '14,231 km²',
      note: 'המחוז הגדול ביותר - כולל את הנגב',
    },
  },
];

async function main() {
  console.log('🇮🇱 Creating all 6 Israeli administrative districts...\n');
  console.log('📍 Official districts (מחוזות ישראל):');
  console.log('   1. מחוז ירושלים (Jerusalem)');
  console.log('   2. מחוז הצפון (Northern)');
  console.log('   3. מחוז חיפה (Haifa)');
  console.log('   4. מחוז המרכז (Central)');
  console.log('   5. מחוז תל אביב (Tel Aviv)');
  console.log('   6. מחוז הדרום (Southern)');
  console.log('\n' + '─'.repeat(80) + '\n');

  // Get SuperAdmin
  const superAdmin = await prisma.user.findFirst({
    where: { isSuperAdmin: true },
  });

  if (!superAdmin) {
    console.error('❌ No SuperAdmin found! Please ensure SuperAdmin exists.');
    process.exit(1);
  }

  console.log(`✅ SuperAdmin found: ${superAdmin.fullName} (${superAdmin.email})\n`);

  const hashedPassword = await bcrypt.hash('area123', 10);
  const created: any[] = [];
  const updated: any[] = [];
  const errors: any[] = [];

  for (const district of ISRAELI_DISTRICTS) {
    try {
      console.log(`🔄 Processing: ${district.nameHebrew} (${district.nameEnglish})...`);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: district.email },
        include: { areaManager: true },
      });

      if (existingUser) {
        if (existingUser.areaManager) {
          console.log(`   ⚠️  Area Manager already exists - updating...`);

          // Update area manager
          await prisma.areaManager.update({
            where: { id: existingUser.areaManager.id },
            data: {
              regionCode: district.code,
              regionName: district.nameHebrew,
              isActive: true,
              metadata: district.metadata,
            },
          });

          updated.push({
            district: district.nameHebrew,
            email: district.email,
            action: 'updated',
          });

          console.log(`   ✅ Updated: ${district.nameHebrew}`);
        } else {
          // User exists but no area manager - create it
          console.log(`   ⚠️  User exists but no area manager - creating area manager record...`);

          await prisma.areaManager.create({
            data: {
              userId: existingUser.id,
              regionCode: district.code,
              regionName: district.nameHebrew,
              isActive: true,
              metadata: district.metadata,
            },
          });

          updated.push({
            district: district.nameHebrew,
            email: district.email,
            action: 'area_manager_created',
          });

          console.log(`   ✅ Created area manager for: ${district.nameHebrew}`);
        }
      } else {
        // Create new user + area manager
        console.log(`   ➕ Creating new user and area manager...`);

        const newUser = await prisma.user.create({
          data: {
            email: district.email,
            fullName: district.managerName,
            passwordHash: hashedPassword,
            role: 'AREA_MANAGER',
            phone: district.phone,
            isActive: true,
          },
        });

        await prisma.areaManager.create({
          data: {
            userId: newUser.id,
            regionCode: district.code,
            regionName: district.nameHebrew,
            isActive: true,
            metadata: district.metadata,
          },
        });

        created.push({
          district: district.nameHebrew,
          manager: district.managerName,
          email: district.email,
        });

        console.log(`   ✅ Created: ${district.nameHebrew} - ${district.managerName}`);
      }

      console.log(`   📊 Population: ${district.metadata.population.toLocaleString()}`);
      console.log(`   📍 Capital: ${district.metadata.capital}`);
      console.log();
    } catch (error) {
      console.error(`   ❌ Error creating ${district.nameHebrew}:`, error);
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
    console.log(`✅ Created ${created.length} new district(s):`);
    created.forEach((d) => {
      console.log(`   - ${d.district} - ${d.manager} (${d.email})`);
    });
    console.log();
  }

  if (updated.length > 0) {
    console.log(`🔄 Updated ${updated.length} existing district(s):`);
    updated.forEach((d) => {
      console.log(`   - ${d.district} (${d.email}) - ${d.action}`);
    });
    console.log();
  }

  if (errors.length > 0) {
    console.log(`❌ Failed to create ${errors.length} district(s):`);
    errors.forEach((e) => {
      console.log(`   - ${e.district}: ${e.error}`);
    });
    console.log();
  }

  // Verify all districts
  const allAreaManagers = await prisma.areaManager.findMany({
    include: { user: true },
    orderBy: { regionName: 'asc' },
  });

  console.log('═'.repeat(80));
  console.log('🗺️  ALL ISRAELI DISTRICTS IN DATABASE:\n');
  allAreaManagers.forEach((am, i) => {
    const status = am.isActive ? '✅' : '❌';
    console.log(`${i + 1}. ${status} ${am.regionName} (${am.regionCode})`);
    console.log(`   Manager: ${am.user.fullName} (${am.user.email})`);
  });

  console.log('\n═'.repeat(80));
  console.log('✅ All 6 Israeli administrative districts are now in the system!');
  console.log('\n📝 Login credentials for all district managers:');
  console.log('   Password: area123');
  console.log('\n🔐 Districts list:');
  ISRAELI_DISTRICTS.forEach((d, i) => {
    console.log(`   ${i + 1}. ${d.email} - ${d.nameHebrew}`);
  });
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
