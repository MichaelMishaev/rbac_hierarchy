import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create SuperAdmin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@hierarchy.test' },
    update: {},
    create: {
      email: 'superadmin@hierarchy.test',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPERADMIN',
      phone: '+972-50-000-0000',
    },
  });

  console.log('✅ SuperAdmin created:', superAdmin.email);

  // Create test corporation
  const corp1 = await prisma.corporation.upsert({
    where: { code: 'ACME' },
    update: {},
    create: {
      name: 'Acme Corporation',
      code: 'ACME',
      description: 'Leading provider of innovative solutions',
      email: 'info@acme.com',
      phone: '+972-3-000-0000',
      address: 'Tel Aviv, Israel',
      isActive: true,
    },
  });

  console.log('✅ Corporation created:', corp1.name);

  // Create test manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@acme.com' },
    update: {},
    create: {
      email: 'manager@acme.com',
      name: 'David Cohen',
      password: await bcrypt.hash('manager123', 10),
      role: 'MANAGER',
      corporationId: corp1.id,
      phone: '+972-50-111-1111',
    },
  });

  console.log('✅ Manager created:', manager.email);

  // Create test site
  const site1 = await prisma.site.upsert({
    where: { id: 'default-site-id' },
    update: {},
    create: {
      id: 'default-site-id',
      name: 'Tel Aviv HQ',
      address: 'Rothschild Blvd 1',
      city: 'Tel Aviv',
      country: 'Israel',
      phone: '+972-3-111-1111',
      email: 'tlv@acme.com',
      corporationId: corp1.id,
      isActive: true,
    },
  });

  console.log('✅ Site created:', site1.name);

  // Create test supervisor
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@acme.com' },
    update: {},
    create: {
      email: 'supervisor@acme.com',
      name: 'Sarah Levi',
      password: await bcrypt.hash('supervisor123', 10),
      role: 'SUPERVISOR',
      corporationId: corp1.id,
      phone: '+972-50-222-2222',
    },
  });

  console.log('✅ Supervisor created:', supervisor.email);

  // Assign supervisor to site (M2M relationship)
  const supervisorSite = await prisma.supervisorSite.upsert({
    where: {
      supervisorId_siteId: {
        supervisorId: supervisor.id,
        siteId: site1.id,
      },
    },
    update: {},
    create: {
      supervisorId: supervisor.id,
      siteId: site1.id,
      assignedBy: superAdmin.id,
    },
  });

  console.log('✅ Supervisor assigned to site:', site1.name);

  // Create test workers
  const worker1 = await prisma.worker.create({
    data: {
      name: 'Moshe Israeli',
      phone: '+972-50-333-3333',
      email: 'moshe@example.com',
      position: 'Technician',
      siteId: site1.id,
      supervisorId: supervisor.id,
      startDate: new Date('2024-01-01'),
      isActive: true,
      tags: ['Electrician', 'Safety Certified'],
    },
  });

  const worker2 = await prisma.worker.create({
    data: {
      name: 'Yael Cohen',
      phone: '+972-50-444-4444',
      email: 'yael@example.com',
      position: 'Engineer',
      siteId: site1.id,
      supervisorId: supervisor.id,
      startDate: new Date('2024-02-15'),
      isActive: true,
      tags: ['Civil Engineer', 'Project Management'],
    },
  });

  console.log('✅ Workers created:', worker1.name, worker2.name);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Test credentials:');
  console.log('SuperAdmin: superadmin@hierarchy.test / admin123');
  console.log('Manager:    manager@acme.com / manager123');
  console.log('Supervisor: supervisor@acme.com / supervisor123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
