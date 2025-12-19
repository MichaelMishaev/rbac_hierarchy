import { redirect, notFound } from 'next/navigation';
import { auth, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Box, Typography, Paper } from '@mui/material';
import { ActivistVoterForm } from '@/app/components/activists/ActivistVoterForm';

export default async function EditVoterPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  // CRITICAL: Only ACTIVIST role
  if (!session || session.user.role !== 'ACTIVIST') {
    redirect('/login');
  }

  // Get full user data including activist profile
  const user = await getCurrentUser();

  if (!user.activistProfile) {
    console.error('[EditVoterPage] CRITICAL: ACTIVIST user without activistProfile!');
    console.error('[EditVoterPage] User ID:', user.id, 'Email:', user.email);
    redirect('/login');
  }

  // Next.js 15: params is now a Promise
  const { id } = await params;

  // CRITICAL: Only load voter if inserted by this user
  const voter = await prisma.voter.findUnique({
    where: {
      id,
    },
  });

  if (!voter) {
    notFound();
  }

  // CRITICAL: Verify ownership
  if (voter.insertedByUserId !== user.id) {
    return (
      <Box>
        <Typography variant="h5" color="error">
          אין לך הרשאה לערוך בוחר זה
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        ערוך בוחר
      </Typography>

      <Paper sx={{ p: 3 }}>
        <ActivistVoterForm
          userId={user.id}
          userName={user.fullName}
          neighborhoodName={user.activistProfile.neighborhood.name}
          cityName={user.activistProfile.city.name}
          initialData={{
            id: voter.id,
            fullName: voter.fullName,
            phone: voter.phone,
            supportLevel: (voter.supportLevel as any) || undefined,
            voterAddress: voter.voterAddress || undefined,
            voterCity: voter.voterCity || undefined,
            voterNeighborhood: voter.voterNeighborhood || undefined,
            notes: voter.notes || undefined,
          }}
        />
      </Paper>
    </Box>
  );
}
