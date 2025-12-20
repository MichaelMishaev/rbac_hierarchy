/**
 * Activist Voters Client Component - Hebrew RTL
 *
 * Features:
 * - List of voters inserted by the activist
 * - Add voter button
 * - Excel import functionality
 * - Stats display
 */

'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { ActivistVoterCard } from '@/app/components/activists/ActivistVoterCard';
import { ExcelUpload } from './components/ExcelUpload';
import type { Voter } from '@prisma/client';

type ActivistVotersClientProps = {
  user: {
    fullName: string;
    activistProfile: {
      neighborhood: {
        name: string;
      };
      city: {
        name: string;
      };
    };
  };
  voters: Voter[];
};

export default function ActivistVotersClient({ user, voters: initialVoters }: ActivistVotersClientProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Use refreshKey to trigger re-render after import
  const voters = initialVoters;

  // Calculate stats
  const stats = {
    total: voters.length,
    supporter: voters.filter((v) => v.supportLevel === 'תומך').length,
    hesitant: voters.filter((v) => v.supportLevel === 'מהסס').length,
    opposed: voters.filter((v) => v.supportLevel === 'מתנגד').length,
    noAnswer: voters.filter((v) => v.supportLevel === 'לא ענה').length,
  };

  const handleUploadSuccess = () => {
    setUploadDialogOpen(false);
    setRefreshKey((prev) => prev + 1);
    // Refresh the page to show new voters
    window.location.reload();
  };

  return (
    <Box key={refreshKey}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
          שלום, {user.fullName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          📍 {user.activistProfile.neighborhood.name}, {user.activistProfile.city.name}
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

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
          sx={{
            flex: 1,
            borderRadius: '50px',
            py: 1.5,
            fontWeight: 600,
          }}
          data-testid="import-excel-button"
        >
          ייבוא מאקסל
        </Button>
        <Button
          component={Link}
          href="/voters/new"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            flex: 1,
            borderRadius: '50px',
            py: 1.5,
            fontWeight: 600,
          }}
          data-testid="add-voter-button"
        >
          הוסף בוחר חדש
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Voters List */}
      {voters.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              עדיין לא הוספת בוחרים.
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
              לחץ על אחד הכפתורים למעלה כדי להוסיף את הבוחר הראשון שלך.
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

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
        dir="rtl"
        PaperProps={{
          sx: {
            borderRadius: '32px',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            py: 2,
          }}
        >
          ייבוא בוחרים מאקסל
          <IconButton onClick={() => setUploadDialogOpen(false)} edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <ExcelUpload onSuccess={handleUploadSuccess} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
