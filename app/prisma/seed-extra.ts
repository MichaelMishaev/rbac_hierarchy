// prisma/seed-extra.ts
// Script to add extra dummy data for organizational tree visualization

import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding extra dummy data...');

  // Get existing corporation
  const acmeCorp = await prisma.corporation.findFirst({
    where: { code: 'ACME' },
  });

  if (!acmeCorp) {
    throw new Error('Acme Corporation not found - run main seed first');
  }

  console.log('  📍 Adding more sites to Acme Corporation...');

  // Add 2 more sites to Acme
  const haifaSite = await prisma.site.create({
    data: {
      name: 'Haifa Office',
      address: '123 Carmel St',
      city: 'Haifa',
      country: 'Israel',
      corporationId: acmeCorp.id,
      isActive: true,
    },
  });

  const jerusalemSite = await prisma.site.create({
    data: {
      name: 'Jerusalem Branch',
      address: '456 King David St',
      city: 'Jerusalem',
      country: 'Israel',
      corporationId: acmeCorp.id,
      isActive: true,
    },
  });

  console.log(`  ✅ Created sites: ${haifaSite.name}, ${jerusalemSite.name}`);

  // Create 2 new corporations
  console.log('  🏢 Creating new corporations...');

  const techCorp = await prisma.corporation.create({
    data: {
      name: 'TechVision Industries',
      code: 'TECH',
      description: 'Leading technology solutions provider',
      email: 'info@techvision.co.il',
      phone: '+972-3-5551234',
      isActive: true,
    },
  });

  const globalCorp = await prisma.corporation.create({
    data: {
      name: 'Global Services Ltd',
      code: 'GLOB',
      description: 'International business services',
      email: 'contact@globalservices.com',
      phone: '+972-4-8881234',
      isActive: true,
    },
  });

  console.log(`  ✅ Created corporations: ${techCorp.name}, ${globalCorp.name}`);

  // Add sites to TechVision
  console.log('  📍 Adding sites to TechVision...');

  const techSite1 = await prisma.site.create({
    data: {
      name: 'R&D Center',
      address: '100 Innovation Blvd',
      city: 'Herzliya',
      country: 'Israel',
      corporationId: techCorp.id,
      isActive: true,
    },
  });

  const techSite2 = await prisma.site.create({
    data: {
      name: 'Support Center',
      address: '200 Tech Park',
      city: 'Petah Tikva',
      country: 'Israel',
      corporationId: techCorp.id,
      isActive: true,
    },
  });

  const techSite3 = await prisma.site.create({
    data: {
      name: 'Sales Office',
      address: '50 Rothschild Blvd',
      city: 'Tel Aviv',
      country: 'Israel',
      corporationId: techCorp.id,
      isActive: true,
    },
  });

  console.log(`  ✅ Created TechVision sites: ${techSite1.name}, ${techSite2.name}, ${techSite3.name}`);

  // Add sites to Global Services
  console.log('  📍 Adding sites to Global Services...');

  const globalSite1 = await prisma.site.create({
    data: {
      name: 'Northern Hub',
      address: '75 Industrial Zone',
      city: 'Haifa',
      country: 'Israel',
      corporationId: globalCorp.id,
      isActive: true,
    },
  });

  const globalSite2 = await prisma.site.create({
    data: {
      name: 'Central Office',
      address: '88 Business Center',
      city: 'Rishon LeZion',
      country: 'Israel',
      corporationId: globalCorp.id,
      isActive: true,
    },
  });

  console.log(`  ✅ Created Global Services sites: ${globalSite1.name}, ${globalSite2.name}`);

  // Create managers for new corporations
  console.log('  👨‍💼 Creating managers...');

  const hashedPassword = await bcryptjs.hash('manager123', 10);

  const techManager = await prisma.user.create({
    data: {
      email: 'manager@techvision.com',
      name: 'David Cohen',
      password: hashedPassword,
      role: 'MANAGER',
      corporationId: techCorp.id,
    },
  });

  const globalManager = await prisma.user.create({
    data: {
      email: 'manager@globalservices.com',
      name: 'Sarah Levy',
      password: hashedPassword,
      role: 'MANAGER',
      corporationId: globalCorp.id,
    },
  });

  console.log(`  ✅ Created managers: ${techManager.name}, ${globalManager.name}`);

  // Create supervisors for new sites
  console.log('  👥 Creating supervisors...');

  const sup1 = await prisma.user.create({
    data: {
      email: 'supervisor@haifa.acme.com',
      name: 'Michael Mizrahi',
      password: hashedPassword,
      role: 'SUPERVISOR',
      corporationId: acmeCorp.id,
    },
  });

  const sup2 = await prisma.user.create({
    data: {
      email: 'supervisor@rd.techvision.com',
      name: 'Rachel Goldstein',
      password: hashedPassword,
      role: 'SUPERVISOR',
      corporationId: techCorp.id,
    },
  });

  const sup3 = await prisma.user.create({
    data: {
      email: 'supervisor@support.techvision.com',
      name: 'Yossi Katz',
      password: hashedPassword,
      role: 'SUPERVISOR',
      corporationId: techCorp.id,
    },
  });

  const sup4 = await prisma.user.create({
    data: {
      email: 'supervisor@north.global.com',
      name: 'Tamar Rosen',
      password: hashedPassword,
      role: 'SUPERVISOR',
      corporationId: globalCorp.id,
    },
  });

  console.log(`  ✅ Created supervisors: ${sup1.name}, ${sup2.name}, ${sup3.name}, ${sup4.name}`);

  // Assign supervisors to sites
  console.log('  🔗 Assigning supervisors to sites...');

  await prisma.supervisorSite.createMany({
    data: [
      { supervisorId: sup1.id, siteId: haifaSite.id },
      { supervisorId: sup2.id, siteId: techSite1.id },
      { supervisorId: sup3.id, siteId: techSite2.id },
      { supervisorId: sup4.id, siteId: globalSite1.id },
    ],
  });

  console.log('  ✅ Supervisors assigned to sites');

  // Create workers for each site
  console.log('  👷 Creating workers...');

  const workers = [
    // Haifa site workers
    { name: 'Avi Ben-David', site: haifaSite, supervisor: sup1 },
    { name: 'Noa Friedman', site: haifaSite, supervisor: sup1 },
    { name: 'Eli Shapira', site: haifaSite, supervisor: sup1 },
    // Jerusalem site workers (no supervisor assigned yet)
    { name: 'Dani Weiss', site: jerusalemSite, supervisor: sup1 },
    { name: 'Maya Shabtai', site: jerusalemSite, supervisor: sup1 },
    // TechVision R&D workers
    { name: 'Alex Romanov', site: techSite1, supervisor: sup2 },
    { name: 'Chen Li', site: techSite1, supervisor: sup2 },
    { name: 'Lior Malka', site: techSite1, supervisor: sup2 },
    { name: 'Yael Peres', site: techSite1, supervisor: sup2 },
    // TechVision Support workers
    { name: 'Ron Baruch', site: techSite2, supervisor: sup3 },
    { name: 'Shira Azoulay', site: techSite2, supervisor: sup3 },
    { name: 'Omer Biton', site: techSite2, supervisor: sup3 },
    // TechVision Sales workers (no supervisor assigned)
    { name: 'Tal Dahan', site: techSite3, supervisor: sup2 },
    { name: 'Inbal Golan', site: techSite3, supervisor: sup2 },
    // Global Services workers
    { name: 'Adam Hazan', site: globalSite1, supervisor: sup4 },
    { name: 'Gal Kramer', site: globalSite1, supervisor: sup4 },
    { name: 'Roni Levi', site: globalSite2, supervisor: sup4 },
    { name: 'Michal Aharoni', site: globalSite2, supervisor: sup4 },
  ];

  for (const worker of workers) {
    await prisma.worker.create({
      data: {
        name: worker.name,
        phone: `+972-50-${Math.floor(1000000 + Math.random() * 9000000)}`,
        position: ['Developer', 'Designer', 'Analyst', 'Technician'][Math.floor(Math.random() * 4)],
        isActive: true,
        siteId: worker.site.id,
        supervisorId: worker.supervisor.id,
      },
    });
  }

  console.log(`  ✅ Created ${workers.length} workers`);

  console.log('\n✨ Extra dummy data seeding complete!');
  console.log('\n📊 Summary:');
  console.log('  • Corporations: 3 total (1 existing + 2 new)');
  console.log('  • Sites: 8 total (3 Acme, 3 TechVision, 2 Global)');
  console.log('  • Managers: 3 total');
  console.log('  • Supervisors: 5 total');
  console.log(`  • Workers: ${workers.length} new workers`);
}

main()
  .catch((e) => {
    console.error('Error seeding extra data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
