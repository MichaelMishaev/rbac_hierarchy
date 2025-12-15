import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addIsraeliDistricts() {
  console.log('🇮🇱 Adding 6 Israeli Districts (מחוזות ישראל)...\n');

  try {
    const districts = [
      {
        regionName: 'מחוז תל אביב',
        regionCode: 'TA-DISTRICT',
        email: 'manager@telaviv-district.prod',
        description: 'מנהלת אזורית אחראית על קמפיין הבחירות במחוז תל אביב',
      },
      {
        regionName: 'מחוז הצפון',
        regionCode: 'NORTH',
        email: 'manager@north-district.prod',
        description: 'מנהל מחוזי אחראי על קמפיין הבחירות במחוז הצפון',
      },
      {
        regionName: 'מחוז חיפה',
        regionCode: 'HAIFA',
        email: 'manager@haifa-district.prod',
        description: 'מנהל מחוזי אחראי על קמפיין הבחירות במחוז חיפה',
      },
      {
        regionName: 'מחוז המרכז',
        regionCode: 'CENTER',
        email: 'manager@center-district.prod',
        description: 'מנהלת אזורית אחראית על קמפיין הבחירות במחוז המרכז',
      },
      {
        regionName: 'מחוז ירושלים',
        regionCode: 'JERUSALEM',
        email: 'manager@jerusalem-district.prod',
        description: 'מנהל מחוזי אחראי על קמפיין הבחירות במחוז ירושלים',
      },
      {
        regionName: 'מחוז הדרום',
        regionCode: 'SOUTH',
        email: 'manager@south-district.prod',
        description: 'מנהלת אזורית אחראית על קמפיין הבחירות במחוז הדרום',
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const district of districts) {
      try {
        // Check if district already exists
        const existingDistrict = await prisma.areaManager.findFirst({
          where: { regionCode: district.regionCode },
        });

        if (existingDistrict) {
          console.log(`⏭️  Skipped: ${district.regionName} (already exists)`);
          skipped++;
          continue;
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email: district.email },
        });

        // Create user if doesn't exist
        if (!user) {
          const hashedPassword = await bcrypt.hash('district-manager-2025', 12);
          user = await prisma.user.create({
            data: {
              email: district.email,
              passwordHash: hashedPassword,
              fullName: district.regionName,
              role: 'AREA_MANAGER',
              isActive: true,
            },
          });
          console.log(`   👤 Created user: ${district.email}`);
        }

        // Create AreaManager
        await prisma.areaManager.create({
          data: {
            userId: user.id,
            regionName: district.regionName,
            regionCode: district.regionCode,
            isActive: true,
            metadata: {
              description: district.description,
            },
          },
        });

        console.log(`✅ Created: ${district.regionName} (${district.regionCode})`);
        created++;
      } catch (error: any) {
        console.error(`❌ Error creating ${district.regionName}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created} districts`);
    console.log(`   ⏭️  Skipped: ${skipped} (already exist)`);
    console.log(`   📍 Total: ${created + skipped} districts\n`);

    // Show final count
    const totalDistricts = await prisma.areaManager.count({
      where: { isActive: true },
    });

    console.log(`🇮🇱 Israel now has ${totalDistricts} active district managers!`);
    console.log('\nDistricts:');
    console.log('  1. מחוז תל אביב (Tel Aviv District)');
    console.log('  2. מחוז הצפון (North District)');
    console.log('  3. מחוז חיפה (Haifa District)');
    console.log('  4. מחוז המרכז (Center District)');
    console.log('  5. מחוז ירושלים (Jerusalem District)');
    console.log('  6. מחוז הדרום (South District)');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addIsraeliDistricts();
