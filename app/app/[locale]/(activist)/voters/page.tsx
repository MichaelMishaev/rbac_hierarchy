import { redirect } from 'next/navigation';
import { auth, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ActivistVotersClient from './ActivistVotersClient';

export default async function ActivistVotersPage() {
  const session = await auth();

  // CRITICAL: Only ACTIVIST role
  if (!session || session.user.role !== 'ACTIVIST') {
    redirect('/login');
  }

  // Get full user data including activist profile
  const user = await getCurrentUser();

  if (!user.activistProfile) {
    console.error('[ActivistVotersPage] CRITICAL: ACTIVIST user without activistProfile!');
    console.error('[ActivistVotersPage] User ID:', user.id, 'Email:', user.email);
    redirect('/login');
  }

  // CRITICAL: Only load voters inserted by this activist
  const voters = await prisma.voter.findMany({
    where: {
      insertedByUserId: session.user.id,
      isActive: true,
    },
    orderBy: {
      insertedAt: 'desc',
    },
  });

  return (
    <ActivistVotersClient
      user={{
        fullName: user.fullName,
        activistProfile: {
          neighborhood: {
            name: user.activistProfile.neighborhood.name,
          },
          city: {
            name: user.activistProfile.city.name,
          },
        },
      }}
      voters={voters}
    />
  );
}
