import { redirect } from 'next/navigation';
import { auth, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import { ActivistVoterCard } from '@/app/components/activists/ActivistVoterCard';

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

  // Calculate stats
  const stats = {
    total: voters.length,
    supporter: voters.filter((v) => v.supportLevel === 'תומך').length,
    hesitant: voters.filter((v) => v.supportLevel === 'מהסס').length,
    opposed: voters.filter((v) => v.supportLevel === 'מתנגד').length,
    noAnswer: voters.filter((v) => v.supportLevel === 'לא ענה').length,
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
          שלום, {user.fullName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          📍 {user.activistProfile.neighborhood.name},{' '}
          {user.activistProfile.city.name}
        </Typography>
      </Box>

      {/* Stats Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            📊 הבוחרים שלי ({stats.total})
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Chip
              label={`🟢 תומך: ${stats.supporter}`}
              color="success"
              variant="outlined"
              size="small"
            />
            <Chip
              label={`🟡 מהסס: ${stats.hesitant}`}
              color="warning"
              variant="outlined"
              size="small"
            />
            <Chip
              label={`🔴 מתנגד: ${stats.opposed}`}
              color="error"
              variant="outlined"
              size="small"
            />
            <Chip
              label={`⚪ לא ענה: ${stats.noAnswer}`}
              color="default"
              variant="outlined"
              size="small"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Add Voter Button */}
      <Button
        component={Link}
        href="/voters/new"
        variant="contained"
        fullWidth
        size="large"
        startIcon={<AddIcon />}
        sx={{ mb: 3 }}
        data-testid="add-voter-button"
      >
        הוסף בוחר חדש
      </Button>

      <Divider sx={{ mb: 2 }} />

      {/* Voters List */}
      {voters.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              עדיין לא הוספת בוחרים.
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
              לחץ על הכפתור למעלה כדי להוסיף את הבוחר הראשון שלך.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {voters.map((voter) => (
            <ActivistVoterCard key={voter.id} voter={voter} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
