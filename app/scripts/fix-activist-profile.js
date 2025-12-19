const { prisma } = require('../lib/prisma.ts');

async function main() {
  try {
    // Get the user
    const user = await prisma.users.findUnique({
      where: { email: '0544345288@activist.login' }
    });

    console.log('User found:', user);

    // Check if there's an activist with this phone
    const activists = await prisma.activists.findMany({
      where: { phone: '0544345288' },
      include: { neighborhood: { include: { city: true } } }
    });

    console.log('\nActivists found:', activists);

    if (activists.length > 0) {
      // Link the first activist to the user
      const activist = activists[0];
      console.log('\nLinking activist:', activist.id, 'to user:', user.id);

      const updated = await prisma.activists.update({
        where: { id: activist.id },
        data: { user_id: user.id }
      });

      console.log('\nUpdated activist:', updated);
    } else {
      console.log('\nNo activist found with phone 0544345288. Need to create one.');

      // Get a neighborhood to assign to
      const neighborhood = await prisma.neighborhoods.findFirst({
        include: { city: true }
      });

      console.log('\nFound neighborhood:', neighborhood);

      if (neighborhood) {
        const newActivist = await prisma.activists.create({
          data: {
            full_name: 'פעיל בדיקה 2',
            phone: '0544345288',
            neighborhood_id: neighborhood.id,
            user_id: user.id,
            is_active: true,
          }
        });

        console.log('\nCreated activist:', newActivist);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
