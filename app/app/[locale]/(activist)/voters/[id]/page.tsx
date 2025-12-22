import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import VoterDetailClient from './VoterDetailClient';

type Params = Promise<{ locale: string; id: string }>;

export default async function VoterDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const session = await auth();

  // CRITICAL: Only ACTIVIST role
  if (!session || session.user.role !== 'ACTIVIST') {
    redirect('/login');
  }

  // Fetch voter - ensure it belongs to this activist
  const voter = await prisma.voter.findUnique({
    where: {
      id,
    },
  });

  // Verify the voter exists and was inserted by this activist
  if (!voter || voter.insertedByUserId !== session.user.id) {
    redirect('/voters');
  }

  return <VoterDetailClient voter={voter} />;
}
