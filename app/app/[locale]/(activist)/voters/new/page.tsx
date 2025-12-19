import { redirect } from 'next/navigation';
import { auth, getCurrentUser } from '@/lib/auth';
import { Box, Typography, Paper } from '@mui/material';
import { ActivistVoterForm } from '@/app/components/activists/ActivistVoterForm';

export default async function NewVoterPage() {
  const session = await auth();

  // CRITICAL: Only ACTIVIST role
  if (!session || session.user.role !== 'ACTIVIST') {
    redirect('/login');
  }

  // Get full user data including activist profile
  const user = await getCurrentUser();

  if (!user.activistProfile) {
    console.error('[NewVoterPage] CRITICAL: ACTIVIST user without activistProfile!');
    console.error('[NewVoterPage] User ID:', user.id, 'Email:', user.email);
    redirect('/login');
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        הוסף בוחר חדש
      </Typography>

      <Paper sx={{ p: 3 }}>
        <ActivistVoterForm
          userId={user.id}
          userName={user.fullName}
          neighborhoodName={user.activistProfile.neighborhood.name}
          cityName={user.activistProfile.city.name}
        />
      </Paper>
    </Box>
  );
}
