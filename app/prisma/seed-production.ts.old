import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production seed with Hebrew demo data...');

  // Create SuperAdmin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@rbac.shop' },
    update: {},
    create: {
      email: 'admin@rbac.shop',
      name: 'מנהל מערכת ראשי',
      password: hashedPassword,
      role: 'SUPERADMIN',
      phone: '+972-50-000-0000',
    },
  });

  console.log('✅ SuperAdmin created:', superAdmin.email);

  // Create 3 corporations
  const corp1 = await prisma.corporation.upsert({
    where: { code: 'TECH' },
    update: {},
    create: {
      name: 'טכנולוגיות אלקטרה בע"מ',
      code: 'TECH',
      description: 'חברת טכנולוגיה מובילה בתחום האלקטרוניקה',
      email: 'info@electra-tech.co.il',
      phone: '+972-3-500-0001',
      address: 'רחוב הברזל 1, תל אביב',
      isActive: true,
    },
  });

  const corp2 = await prisma.corporation.upsert({
    where: { code: 'BUILD' },
    update: {},
    create: {
      name: 'קבוצת בינוי ופיתוח בע"מ',
      code: 'BUILD',
      description: 'קבוצת בנייה ותשתיות מובילה',
      email: 'info@binui.co.il',
      phone: '+972-3-600-0002',
      address: 'שדרות רוטשילד 50, תל אביב',
      isActive: true,
    },
  });

  const corp3 = await prisma.corporation.upsert({
    where: { code: 'FOOD' },
    update: {},
    create: {
      name: 'רשת מזון טעים בע"מ',
      code: 'FOOD',
      description: 'רשת מסעדות וקייטרינג ארצית',
      email: 'info@taim-food.co.il',
      phone: '+972-9-700-0003',
      address: 'דרך בגין 100, רמת גן',
      isActive: true,
    },
  });

  console.log('✅ Corporations created:', corp1.name, corp2.name, corp3.name);

  // Create managers for each corporation
  const manager1 = await prisma.user.upsert({
    where: { email: 'david.cohen@electra-tech.co.il' },
    update: {},
    create: {
      email: 'david.cohen@electra-tech.co.il',
      name: 'דוד כהן',
      password: await bcrypt.hash('manager123', 10),
      role: 'MANAGER',
      corporationId: corp1.id,
      phone: '+972-50-100-0001',
    },
  });

  const manager2 = await prisma.user.upsert({
    where: { email: 'sarah.levi@binui.co.il' },
    update: {},
    create: {
      email: 'sarah.levi@binui.co.il',
      name: 'שרה לוי',
      password: await bcrypt.hash('manager123', 10),
      role: 'MANAGER',
      corporationId: corp2.id,
      phone: '+972-50-200-0002',
    },
  });

  const manager3 = await prisma.user.upsert({
    where: { email: 'yossi.mizrahi@taim-food.co.il' },
    update: {},
    create: {
      email: 'yossi.mizrahi@taim-food.co.il',
      name: 'יוסי מזרחי',
      password: await bcrypt.hash('manager123', 10),
      role: 'MANAGER',
      corporationId: corp3.id,
      phone: '+972-50-300-0003',
    },
  });

  console.log('✅ Managers created');

  // Create sites for Corp1 (Electra Tech)
  const site1_1 = await prisma.site.create({
    data: {
      name: 'מפעל תל אביב',
      address: 'רחוב הברזל 1',
      city: 'תל אביב',
      country: 'ישראל',
      phone: '+972-3-500-1001',
      email: 'tlv@electra-tech.co.il',
      corporationId: corp1.id,
      isActive: true,
    },
  });

  const site1_2 = await prisma.site.create({
    data: {
      name: 'מפעל חיפה',
      address: 'רחוב התעשייה 25',
      city: 'חיפה',
      country: 'ישראל',
      phone: '+972-4-800-2001',
      email: 'haifa@electra-tech.co.il',
      corporationId: corp1.id,
      isActive: true,
    },
  });

  // Create sites for Corp2 (Binui)
  const site2_1 = await prisma.site.create({
    data: {
      name: 'אתר בנייה - פרויקט הרצליה',
      address: 'רחוב ויצמן 10',
      city: 'הרצליה',
      country: 'ישראל',
      phone: '+972-9-900-3001',
      email: 'herzliya@binui.co.il',
      corporationId: corp2.id,
      isActive: true,
    },
  });

  const site2_2 = await prisma.site.create({
    data: {
      name: 'אתר בנייה - פרויקט ירושלים',
      address: 'דרך חברון 50',
      city: 'ירושלים',
      country: 'ישראל',
      phone: '+972-2-600-4001',
      email: 'jerusalem@binui.co.il',
      corporationId: corp2.id,
      isActive: true,
    },
  });

  // Create sites for Corp3 (Food)
  const site3_1 = await prisma.site.create({
    data: {
      name: 'סניף דיזנגוף',
      address: 'רחוב דיזנגוף 100',
      city: 'תל אביב',
      country: 'ישראל',
      phone: '+972-3-700-5001',
      email: 'dizengoff@taim-food.co.il',
      corporationId: corp3.id,
      isActive: true,
    },
  });

  console.log('✅ Sites created');

  // Create supervisors for Corp1
  const supervisor1_1 = await prisma.user.create({
    data: {
      email: 'moshe.israeli@electra-tech.co.il',
      name: 'משה ישראלי',
      password: await bcrypt.hash('supervisor123', 10),
      role: 'SUPERVISOR',
      corporationId: corp1.id,
      phone: '+972-50-400-1001',
    },
  });

  const supervisor1_2 = await prisma.user.create({
    data: {
      email: 'rachel.cohen@electra-tech.co.il',
      name: 'רחל כהן',
      password: await bcrypt.hash('supervisor123', 10),
      role: 'SUPERVISOR',
      corporationId: corp1.id,
      phone: '+972-50-400-1002',
    },
  });

  // Create supervisors for Corp2
  const supervisor2_1 = await prisma.user.create({
    data: {
      email: 'avi.shapira@binui.co.il',
      name: 'אבי שפירא',
      password: await bcrypt.hash('supervisor123', 10),
      role: 'SUPERVISOR',
      corporationId: corp2.id,
      phone: '+972-50-500-2001',
    },
  });

  const supervisor2_2 = await prisma.user.create({
    data: {
      email: 'noa.goldstein@binui.co.il',
      name: 'נועה גולדשטיין',
      password: await bcrypt.hash('supervisor123', 10),
      role: 'SUPERVISOR',
      corporationId: corp2.id,
      phone: '+972-50-500-2002',
    },
  });

  // Create supervisors for Corp3
  const supervisor3_1 = await prisma.user.create({
    data: {
      email: 'chen.amar@taim-food.co.il',
      name: 'חן עמר',
      password: await bcrypt.hash('supervisor123', 10),
      role: 'SUPERVISOR',
      corporationId: corp3.id,
      phone: '+972-50-600-3001',
    },
  });

  console.log('✅ Supervisors created');

  // Assign supervisors to sites
  await prisma.supervisorSite.create({
    data: {
      supervisorId: supervisor1_1.id,
      siteId: site1_1.id,
      assignedBy: manager1.id,
    },
  });

  await prisma.supervisorSite.create({
    data: {
      supervisorId: supervisor1_2.id,
      siteId: site1_2.id,
      assignedBy: manager1.id,
    },
  });

  await prisma.supervisorSite.create({
    data: {
      supervisorId: supervisor2_1.id,
      siteId: site2_1.id,
      assignedBy: manager2.id,
    },
  });

  await prisma.supervisorSite.create({
    data: {
      supervisorId: supervisor2_2.id,
      siteId: site2_2.id,
      assignedBy: manager2.id,
    },
  });

  await prisma.supervisorSite.create({
    data: {
      supervisorId: supervisor3_1.id,
      siteId: site3_1.id,
      assignedBy: manager3.id,
    },
  });

  console.log('✅ Supervisors assigned to sites');

  // Create workers for each site
  // Site 1-1 (Tel Aviv Factory)
  await prisma.worker.create({
    data: {
      name: 'יוסי אבוחצירא',
      phone: '+972-50-700-0001',
      email: 'yossi.a@example.com',
      position: 'טכנאי אלקטרוניקה',
      siteId: site1_1.id,
      supervisorId: supervisor1_1.id,
      startDate: new Date('2024-01-15'),
      isActive: true,
      tags: ['אלקטרוניקה', 'תעודת בטיחות'],
    },
  });

  await prisma.worker.create({
    data: {
      name: 'מיכל לוי',
      phone: '+972-50-700-0002',
      email: 'michal.l@example.com',
      position: 'מהנדסת תוכנה',
      siteId: site1_1.id,
      supervisorId: supervisor1_1.id,
      startDate: new Date('2024-02-01'),
      isActive: true,
      tags: ['תכנות', 'בדיקות'],
    },
  });

  await prisma.worker.create({
    data: {
      name: 'רון כהן',
      phone: '+972-50-700-0003',
      email: 'ron.c@example.com',
      position: 'מנהל ייצור',
      siteId: site1_1.id,
      supervisorId: supervisor1_1.id,
      startDate: new Date('2023-11-10'),
      isActive: true,
      tags: ['ניהול', 'ייצור'],
    },
  });

  // Site 1-2 (Haifa Factory)
  await prisma.worker.create({
    data: {
      name: 'שירה מזרחי',
      phone: '+972-50-700-0004',
      email: 'shira.m@example.com',
      position: 'טכנאית מעבדה',
      siteId: site1_2.id,
      supervisorId: supervisor1_2.id,
      startDate: new Date('2024-03-01'),
      isActive: true,
      tags: ['מעבדה', 'בקרת איכות'],
    },
  });

  await prisma.worker.create({
    data: {
      name: 'עומר דהן',
      phone: '+972-50-700-0005',
      email: 'omer.d@example.com',
      position: 'מהנדס חומרה',
      siteId: site1_2.id,
      supervisorId: supervisor1_2.id,
      startDate: new Date('2024-01-20'),
      isActive: true,
      tags: ['חומרה', 'פיתוח'],
    },
  });

  // Site 2-1 (Herzliya Construction)
  await prisma.worker.create({
    data: {
      name: 'דני אברהם',
      phone: '+972-50-800-0001',
      email: 'danny.a@example.com',
      position: 'מנהל פרויקט',
      siteId: site2_1.id,
      supervisorId: supervisor2_1.id,
      startDate: new Date('2023-12-01'),
      isActive: true,
      tags: ['ניהול פרויקטים', 'בנייה'],
    },
  });

  await prisma.worker.create({
    data: {
      name: 'תמר שמעוני',
      phone: '+972-50-800-0002',
      email: 'tamar.s@example.com',
      position: 'מהנדסת אזרחית',
      siteId: site2_1.id,
      supervisorId: supervisor2_1.id,
      startDate: new Date('2024-01-05'),
      isActive: true,
      tags: ['הנדסה אזרחית', 'תכנון'],
    },
  });

  await prisma.worker.create({
    data: {
      name: 'אלי ביטון',
      phone: '+972-50-800-0003',
      email: 'eli.b@example.com',
      position: 'מפקח בטיחות',
      siteId: site2_1.id,
      supervisorId: supervisor2_1.id,
      startDate: new Date('2024-02-10'),
      isActive: true,
      tags: ['בטיחות', 'פיקוח'],
    },
  });

  await prisma.worker.create({
    data: {
      name: 'ליאור רוזנברג',
      phone: '+972-50-800-0004',
      email: 'lior.r@example.com',
      position: 'אדריכל',
      siteId: site2_1.id,
      supervisorId: supervisor2_1.id,
      startDate: new Date('2023-10-15'),
      isActive: true,
      tags: ['אדריכלות', 'תכנון'],
    },
  });

  // Site 2-2 (Jerusalem Construction)
  await prisma.worker.create({
    data: {
      name: 'גל פרידמן',
      phone: '+972-50-800-0005',
      email: 'gal.f@example.com',
      position: 'מנהל עבודה',
      siteId: site2_2.id,
      supervisorId: supervisor2_2.id,
      startDate: new Date('2024-01-01'),
      isActive: true,
      tags: ['ניהול', 'בנייה'],
    },
  });

  await prisma.worker.create({
    data: {
      name: 'מאיה גרינברג',
      phone: '+972-50-800-0006',
      email: 'maya.g@example.com',
      position: 'מודדת',
      siteId: site2_2.id,
      supervisorId: supervisor2_2.id,
      startDate: new Date('2024-02-15'),
      isActive: true,
      tags: ['מדידה', 'GIS'],
    },
  });

  // Site 3-1 (Dizengoff Restaurant)
  await prisma.worker.create({
    data: {
      name: 'יאיר כהן',
      phone: '+972-50-900-0001',
      email: 'yair.c@example.com',
      position: 'שף ראשי',
      siteId: site3_1.id,
      supervisorId: supervisor3_1.id,
      startDate: new Date('2023-09-01'),
      isActive: true,
      tags: ['בישול', 'ניהול מטבח'],
    },
  });

  await prisma.worker.create({
    data: {
      name: 'נועם לוין',
      phone: '+972-50-900-0002',
      email: 'noam.l@example.com',
      position: 'מנהל סניף',
      siteId: site3_1.id,
      supervisorId: supervisor3_1.id,
      startDate: new Date('2023-11-01'),
      isActive: true,
      tags: ['ניהול', 'שירות'],
    },
  });

  await prisma.worker.create({
    data: {
      name: 'רותם אשכנזי',
      phone: '+972-50-900-0003',
      email: 'rotem.a@example.com',
      position: 'סגנית שף',
      siteId: site3_1.id,
      supervisorId: supervisor3_1.id,
      startDate: new Date('2024-01-10'),
      isActive: true,
      tags: ['בישול', 'קונדיטוריה'],
    },
  });

  console.log('✅ Workers created');

  console.log('\n🎉 Production seed completed successfully!');
  console.log('\n📝 Demo credentials:');
  console.log('SuperAdmin: admin@rbac.shop / admin123');
  console.log('\nManagers:');
  console.log('  - david.cohen@electra-tech.co.il / manager123 (טכנולוגיות אלקטרה)');
  console.log('  - sarah.levi@binui.co.il / manager123 (קבוצת בינוי)');
  console.log('  - yossi.mizrahi@taim-food.co.il / manager123 (רשת מזון טעים)');
  console.log('\nSupervisors: supervisor123');
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
