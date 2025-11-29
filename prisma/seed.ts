import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...')
  await prisma.auditLog.deleteMany()
  await prisma.invitation.deleteMany()
  await prisma.worker.deleteMany()
  await prisma.user.deleteMany()
  await prisma.site.deleteMany()
  await prisma.corporation.deleteMany()

  // ============================================
  // CREATE SUPERADMIN
  // ============================================
  console.log('👑 Creating SuperAdmin...')
  const superAdmin = await prisma.user.create({
    data: {
      password: 'password123',
      email: 'superadmin@hierarchy.test',
      name: 'Super Admin',
      phone: '+972-50-1000000',
      password: 'password123', // TODO: Hash this in production
      role: 'SUPERADMIN',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin',
    },
  })
  console.log(`   ✓ SuperAdmin created: ${superAdmin.email}`)

  // ============================================
  // CORPORATION 1: ACME CORP
  // ============================================
  console.log('\n🏢 Creating Corporation 1: Acme Corp...')
  const acmeCorp = await prisma.corporation.create({
    data: {
      name: 'Acme Corporation',
      code: 'ACME',
      description: 'Leading technology solutions provider',
      password: 'password123',
      email: 'info@acme.com',
      phone: '+972-3-1234567',
      address: '123 Tech Boulevard, Tel Aviv, Israel',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ACME',
      isActive: true,
    },
  })
  console.log(`   ✓ Corporation created: ${acmeCorp.name}`)

  // Acme Managers
  const acmeManager1 = await prisma.user.create({
    data: {
      password: 'password123',
      email: 'john.manager@acme.com',
      name: 'John Manager',
      phone: '+972-50-1111111',
      role: 'MANAGER',
      corporationId: acmeCorp.id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JohnManager',
    },
  })

  const acmeManager2 = await prisma.user.create({
    data: {
      password: 'password123',
      email: 'sarah.director@acme.com',
      name: 'Sarah Director',
      phone: '+972-50-1111112',
      role: 'MANAGER',
      corporationId: acmeCorp.id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahDirector',
    },
  })
  console.log(`   ✓ Created ${2} managers`)

  // Acme Sites
  const acmeDowntown = await prisma.site.create({
    data: {
      name: 'Downtown Office',
      address: '456 Business St',
      city: 'Tel Aviv',
      country: 'Israel',
      phone: '+972-3-1234568',
      password: 'password123',
      email: 'downtown@acme.com',
      corporationId: acmeCorp.id,
      isActive: true,
    },
  })

  const acmeHaifa = await prisma.site.create({
    data: {
      name: 'Haifa Tech Hub',
      address: '789 Innovation Ave',
      city: 'Haifa',
      country: 'Israel',
      phone: '+972-4-1234569',
      password: 'password123',
      email: 'haifa@acme.com',
      corporationId: acmeCorp.id,
      isActive: true,
    },
  })

  const acmeJerusalem = await prisma.site.create({
    data: {
      name: 'Jerusalem Branch',
      address: '321 Heritage Road',
      city: 'Jerusalem',
      country: 'Israel',
      phone: '+972-2-1234570',
      password: 'password123',
      email: 'jerusalem@acme.com',
      corporationId: acmeCorp.id,
      isActive: true,
    },
  })
  console.log(`   ✓ Created ${3} sites`)

  // Acme Supervisors for Downtown
  const acmeSupervisor1 = await prisma.user.create({
    data: {
      password: 'password123',
      email: 'david.supervisor@acme.com',
      name: 'David Supervisor',
      phone: '+972-50-2222221',
      role: 'SUPERVISOR',
      corporationId: acmeCorp.id,
      siteId: acmeDowntown.id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DavidSupervisor',
    },
  })

  const acmeSupervisor2 = await prisma.user.create({
    data: {
      password: 'password123',
      email: 'rachel.lead@acme.com',
      name: 'Rachel Lead',
      phone: '+972-50-2222222',
      role: 'SUPERVISOR',
      corporationId: acmeCorp.id,
      siteId: acmeDowntown.id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RachelLead',
    },
  })

  // Acme Supervisors for Haifa
  const acmeSupervisor3 = await prisma.user.create({
    data: {
      password: 'password123',
      email: 'michael.coordinator@acme.com',
      name: 'Michael Coordinator',
      phone: '+972-50-2222223',
      role: 'SUPERVISOR',
      corporationId: acmeCorp.id,
      siteId: acmeHaifa.id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MichaelCoordinator',
    },
  })

  // Acme Supervisors for Jerusalem
  const acmeSupervisor4 = await prisma.user.create({
    data: {
      password: 'password123',
      email: 'yael.teamlead@acme.com',
      name: 'Yael TeamLead',
      phone: '+972-50-2222224',
      role: 'SUPERVISOR',
      corporationId: acmeCorp.id,
      siteId: acmeJerusalem.id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=YaelTeamLead',
    },
  })
  console.log(`   ✓ Created ${4} supervisors`)

  // Acme Workers - Downtown (15 workers)
  const acmeWorkerPositions = ['Technician', 'Engineer', 'Analyst', 'Specialist', 'Developer', 'Designer']
  const acmeWorkerNames = [
    'Avi Cohen', 'Tamar Levi', 'Moshe Israeli', 'Shira Ben-David',
    'Yossi Mizrahi', 'Noa Shapira', 'Eitan Goldberg', 'Maya Rosenberg',
    'Dan Friedman', 'Liora Katz', 'Ron Segal', 'Hadas Barak',
    'Amir Levy', 'Tali Weiss', 'Oren Green'
  ]

  for (let i = 0; i < 15; i++) {
    await prisma.worker.create({
      data: {
        name: acmeWorkerNames[i],
        phone: `+972-50-33${String(i + 1).padStart(5, '0')}`,
        email: `${acmeWorkerNames[i].toLowerCase().replace(' ', '.')}@email.com`,
        position: acmeWorkerPositions[i % acmeWorkerPositions.length],
        siteId: acmeDowntown.id,
        supervisorId: i % 2 === 0 ? acmeSupervisor1.id : acmeSupervisor2.id,
        startDate: new Date('2024-01-15'),
        isActive: true,
        tags: ['Certified', 'Experienced'],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${acmeWorkerNames[i].replace(' ', '')}`,
      },
    })
  }
  console.log(`   ✓ Created ${15} workers for Downtown Office`)

  // Acme Workers - Haifa (8 workers)
  const haifaWorkerNames = [
    'Chen Avraham', 'Gal Peretz', 'Roni Shimoni', 'Dafna Klein',
    'Yuval Navon', 'Michal Dahan', 'Shai Yosef', 'Rina Tzur'
  ]

  for (let i = 0; i < 8; i++) {
    await prisma.worker.create({
      data: {
        name: haifaWorkerNames[i],
        phone: `+972-50-44${String(i + 1).padStart(5, '0')}`,
        email: `${haifaWorkerNames[i].toLowerCase().replace(' ', '.')}@email.com`,
        position: acmeWorkerPositions[i % acmeWorkerPositions.length],
        siteId: acmeHaifa.id,
        supervisorId: acmeSupervisor3.id,
        startDate: new Date('2024-02-01'),
        isActive: true,
        tags: ['Tech Savvy'],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${haifaWorkerNames[i].replace(' ', '')}`,
      },
    })
  }
  console.log(`   ✓ Created ${8} workers for Haifa Tech Hub`)

  // Acme Workers - Jerusalem (12 workers)
  const jerusalemWorkerNames = [
    'Elad Romano', 'Keren Ziv', 'Noam Haim', 'Shani Gross',
    'Guy Stern', 'Orly Alon', 'Barak Carmel', 'Liat Shalom',
    'Itay Mor', 'Rinat Golan', 'Omri Tal', 'Yarden Fox'
  ]

  for (let i = 0; i < 12; i++) {
    await prisma.worker.create({
      data: {
        name: jerusalemWorkerNames[i],
        phone: `+972-50-55${String(i + 1).padStart(5, '0')}`,
        email: `${jerusalemWorkerNames[i].toLowerCase().replace(' ', '.')}@email.com`,
        position: acmeWorkerPositions[i % acmeWorkerPositions.length],
        siteId: acmeJerusalem.id,
        supervisorId: acmeSupervisor4.id,
        startDate: new Date('2024-03-01'),
        isActive: true,
        tags: ['Reliable'],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${jerusalemWorkerNames[i].replace(' ', '')}`,
      },
    })
  }
  console.log(`   ✓ Created ${12} workers for Jerusalem Branch`)

  // ============================================
  // CORPORATION 2: TECHCO
  // ============================================
  console.log('\n🏢 Creating Corporation 2: TechCo...')
  const techCo = await prisma.corporation.create({
    data: {
      name: 'TechCo Solutions',
      code: 'TECHCO',
      description: 'Innovative software development company',
      password: 'password123',
      email: 'contact@techco.com',
      phone: '+972-9-8765432',
      address: '555 Software Lane, Herzliya, Israel',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=TECHCO',
      isActive: true,
    },
  })
  console.log(`   ✓ Corporation created: ${techCo.name}`)

  // TechCo Manager
  const techCoManager = await prisma.user.create({
    data: {
      password: 'password123',
      email: 'lisa.admin@techco.com',
      name: 'Lisa Admin',
      phone: '+972-50-6666666',
      role: 'MANAGER',
      corporationId: techCo.id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LisaAdmin',
    },
  })
  console.log(`   ✓ Created ${1} manager`)

  // TechCo Sites
  const techCoHQ = await prisma.site.create({
    data: {
      name: 'Herzliya HQ',
      address: '100 Innovation Street',
      city: 'Herzliya',
      country: 'Israel',
      phone: '+972-9-8765433',
      password: 'password123',
      email: 'hq@techco.com',
      corporationId: techCo.id,
      isActive: true,
    },
  })

  const techCoRD = await prisma.site.create({
    data: {
      name: 'R&D Center',
      address: '200 Research Blvd',
      city: 'Rehovot',
      country: 'Israel',
      phone: '+972-8-8765434',
      password: 'password123',
      email: 'rd@techco.com',
      corporationId: techCo.id,
      isActive: true,
    },
  })
  console.log(`   ✓ Created ${2} sites`)

  // TechCo Supervisors
  const techCoSupervisor1 = await prisma.user.create({
    data: {
      password: 'password123',
      email: 'alex.tech@techco.com',
      name: 'Alex TechLead',
      phone: '+972-50-7777771',
      role: 'SUPERVISOR',
      corporationId: techCo.id,
      siteId: techCoHQ.id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexTechLead',
    },
  })

  const techCoSupervisor2 = await prisma.user.create({
    data: {
      password: 'password123',
      email: 'nina.dev@techco.com',
      name: 'Nina DevOps',
      phone: '+972-50-7777772',
      role: 'SUPERVISOR',
      corporationId: techCo.id,
      siteId: techCoRD.id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NinaDevOps',
    },
  })
  console.log(`   ✓ Created ${2} supervisors`)

  // TechCo Workers - HQ (6 workers)
  const techCoWorkerNames = [
    'Tom Cohen', 'Emma Levi', 'Jake Mizrahi',
    'Sophie Katz', 'Max Goldstein', 'Luna Shapiro'
  ]

  for (let i = 0; i < 6; i++) {
    await prisma.worker.create({
      data: {
        name: techCoWorkerNames[i],
        phone: `+972-50-88${String(i + 1).padStart(5, '0')}`,
        email: `${techCoWorkerNames[i].toLowerCase().replace(' ', '.')}@email.com`,
        position: 'Software Engineer',
        siteId: techCoHQ.id,
        supervisorId: techCoSupervisor1.id,
        startDate: new Date('2024-01-01'),
        isActive: true,
        tags: ['Agile', 'Full-Stack'],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${techCoWorkerNames[i].replace(' ', '')}`,
      },
    })
  }
  console.log(`   ✓ Created ${6} workers for Herzliya HQ`)

  // TechCo Workers - R&D (4 workers)
  const rdWorkerNames = ['Ben Silver', 'Zoe Diamond', 'Leo Ruby', 'Mia Pearl']

  for (let i = 0; i < 4; i++) {
    await prisma.worker.create({
      data: {
        name: rdWorkerNames[i],
        phone: `+972-50-99${String(i + 1).padStart(5, '0')}`,
        email: `${rdWorkerNames[i].toLowerCase().replace(' ', '.')}@email.com`,
        position: 'Research Scientist',
        siteId: techCoRD.id,
        supervisorId: techCoSupervisor2.id,
        startDate: new Date('2024-02-15'),
        isActive: true,
        tags: ['PhD', 'Research'],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${rdWorkerNames[i].replace(' ', '')}`,
      },
    })
  }
  console.log(`   ✓ Created ${4} workers for R&D Center`)

  // ============================================
  // CORPORATION 3: BUILDCO
  // ============================================
  console.log('\n🏢 Creating Corporation 3: BuildCo...')
  const buildCo = await prisma.corporation.create({
    data: {
      name: 'BuildCo Construction',
      code: 'BUILDCO',
      description: 'Premier construction and infrastructure company',
      password: 'password123',
      email: 'info@buildco.com',
      phone: '+972-3-9999999',
      address: '777 Construction Way, Beer Sheva, Israel',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=BUILDCO',
      isActive: true,
    },
  })
  console.log(`   ✓ Corporation created: ${buildCo.name}`)

  // BuildCo Manager
  const buildCoManager = await prisma.user.create({
    data: {
      password: 'password123',
      email: 'bob.builder@buildco.com',
      name: 'Bob Builder',
      phone: '+972-50-9999991',
      role: 'MANAGER',
      corporationId: buildCo.id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BobBuilder',
    },
  })
  console.log(`   ✓ Created ${1} manager`)

  // BuildCo Site
  const buildCoSite = await prisma.site.create({
    data: {
      name: 'Construction Site Alpha',
      address: '888 Build Street',
      city: 'Beer Sheva',
      country: 'Israel',
      phone: '+972-8-9999992',
      password: 'password123',
      email: 'site-alpha@buildco.com',
      corporationId: buildCo.id,
      isActive: true,
    },
  })
  console.log(`   ✓ Created ${1} site`)

  // BuildCo Supervisor
  const buildCoSupervisor = await prisma.user.create({
    data: {
      password: 'password123',
      email: 'frank.foreman@buildco.com',
      name: 'Frank Foreman',
      phone: '+972-50-9999993',
      role: 'SUPERVISOR',
      corporationId: buildCo.id,
      siteId: buildCoSite.id,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FrankForeman',
    },
  })
  console.log(`   ✓ Created ${1} supervisor`)

  // BuildCo Workers (5 workers)
  const buildWorkerNames = ['Carlos Mason', 'Diego Carpenter', 'Pablo Welder', 'Jose Electrician', 'Luis Plumber']

  for (let i = 0; i < 5; i++) {
    await prisma.worker.create({
      data: {
        name: buildWorkerNames[i],
        phone: `+972-50-00${String(i + 1).padStart(5, '0')}`,
        email: `${buildWorkerNames[i].toLowerCase().replace(' ', '.')}@email.com`,
        position: buildWorkerNames[i].split(' ')[1],
        siteId: buildCoSite.id,
        supervisorId: buildCoSupervisor.id,
        startDate: new Date('2024-04-01'),
        isActive: true,
        tags: ['Licensed', 'Safety Certified'],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${buildWorkerNames[i].replace(' ', '')}`,
      },
    })
  }
  console.log(`   ✓ Created ${5} workers for Construction Site Alpha`)

  // ============================================
  // CREATE SAMPLE INVITATIONS
  // ============================================
  console.log('\n📧 Creating sample invitations...')

  await prisma.invitation.create({
    data: {
      password: 'password123',
      email: 'pending.manager@acme.com',
      role: 'MANAGER',
      status: 'PENDING',
      token: 'invite-token-acme-manager-001',
      message: 'Join Acme Corporation as a Manager',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      corporationId: acmeCorp.id,
      createdById: superAdmin.id,
    },
  })

  await prisma.invitation.create({
    data: {
      password: 'password123',
      email: 'pending.supervisor@techco.com',
      role: 'SUPERVISOR',
      status: 'PENDING',
      token: 'invite-token-techco-supervisor-001',
      message: 'Join TechCo as a Supervisor at our HQ',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      corporationId: techCo.id,
      siteId: techCoHQ.id,
      createdById: techCoManager.id,
    },
  })
  console.log(`   ✓ Created ${2} pending invitations`)

  // ============================================
  // CREATE SAMPLE AUDIT LOGS
  // ============================================
  console.log('\n📝 Creating sample audit logs...')

  await prisma.auditLog.create({
    data: {
      action: 'CREATE_CORPORATION',
      entity: 'Corporation',
      entityId: acmeCorp.id,
      newValue: { name: acmeCorp.name, code: acmeCorp.code },
      userId: superAdmin.id,
      userEmail: superAdmin.email,
      userRole: 'SUPERADMIN',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Seed Script)',
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'CREATE_SITE',
      entity: 'Site',
      entityId: acmeDowntown.id,
      newValue: { name: acmeDowntown.name, city: acmeDowntown.city },
      userId: acmeManager1.id,
      userEmail: acmeManager1.email,
      userRole: 'MANAGER',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Seed Script)',
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'INVITE_MANAGER',
      entity: 'Invitation',
      entityId: 'invite-pending-001',
      newValue: { email: 'pending.manager@acme.com', role: 'MANAGER' },
      userId: superAdmin.id,
      userEmail: superAdmin.email,
      userRole: 'SUPERADMIN',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Seed Script)',
    },
  })
  console.log(`   ✓ Created ${3} audit logs`)

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(50))
  console.log('✅ Database seeding completed successfully!')
  console.log('='.repeat(50))

  console.log('\n📊 Summary:')
  console.log(`   • SuperAdmin: 1`)
  console.log(`   • Corporations: 3 (Acme, TechCo, BuildCo)`)
  console.log(`   • Managers: 5`)
  console.log(`   • Sites: 6`)
  console.log(`   • Supervisors: 7`)
  console.log(`   • Workers: 50`)
  console.log(`   • Invitations: 2`)
  console.log(`   • Audit Logs: 3`)

  console.log('\n🔑 Test Credentials:')
  console.log('   SuperAdmin:    superadmin@hierarchy.test')
  console.log('   Acme Manager:  john.manager@acme.com')
  console.log('   TechCo Manager: lisa.admin@techco.com')
  console.log('   Build Manager: bob.builder@buildco.com')
  console.log('   Acme Supervisor: david.supervisor@acme.com')

  console.log('\n🌳 Organizational Structure:')
  console.log(`
  SuperAdmin
  ├── Acme Corporation (${3} sites, ${4} supervisors, ${35} workers)
  │   ├── Downtown Office (${15} workers)
  │   ├── Haifa Tech Hub (${8} workers)
  │   └── Jerusalem Branch (${12} workers)
  ├── TechCo Solutions (${2} sites, ${2} supervisors, ${10} workers)
  │   ├── Herzliya HQ (${6} workers)
  │   └── R&D Center (${4} workers)
  └── BuildCo Construction (${1} site, ${1} supervisor, ${5} workers)
      └── Construction Site Alpha (${5} workers)
  `)

  console.log('🚀 Ready to start development!\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
