import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@election.test' },
    select: { email: true, passwordHash: true },
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('📧 Email:', user.email);
  console.log('🔑 Hash:', user.passwordHash?.substring(0, 30) + '...');

  const testPassword = 'admin123';
  const matches = await bcrypt.compare(testPassword, user.passwordHash || '');

  console.log(`\n✓ Password "${testPassword}" matches:`, matches);

  if (!matches) {
    console.log('\n🔧 Updating password to admin123...');
    const newHash = await bcrypt.hash('admin123', 10);
    await prisma.user.update({
      where: { email: 'admin@election.test' },
      data: { passwordHash: newHash },
    });
    console.log('✅ Password updated successfully');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
