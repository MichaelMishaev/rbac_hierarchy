'use client';

import { Card, CardContent, Typography, Chip, Stack, Box, IconButton, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import WarningIcon from '@mui/icons-material/Warning';
import { useRouter } from 'next/navigation';

interface Voter {
  id: string;
  fullName: string;
  phone: string;
  supportLevel: string | null;
  voterAddress: string | null;
  contactStatus: string | null;
  lastContactedAt: Date | null;
  notes: string | null;
}

export function ActivistVoterCard({
  voter,
  isDuplicate,
  duplicateCount,
}: {
  voter: Voter;
  isDuplicate?: boolean;
  duplicateCount?: number;
}) {
  const router = useRouter();

  const getSupportColor = (level: string | null) => {
    switch (level) {
      case 'תומך':
        return 'success';
      case 'מהסס':
        return 'warning';
      case 'מתנגד':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSupportIcon = (level: string | null) => {
    switch (level) {
      case 'תומך':
        return '🟢';
      case 'מהסס':
        return '🟡';
      case 'מתנגד':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: isDuplicate ? '2px solid' : 'none',
        borderColor: isDuplicate ? 'error.main' : 'transparent',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
      }}
      onClick={() => router.push(`/voters/${voter.id}`)}
      data-testid="voter-card"
      data-inserted-by={voter.id}
    >
      <CardContent>
        {isDuplicate && !duplicateCount && (
          <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningIcon />}>
            <Typography variant="caption">
              <strong>כפילות:</strong> נמצא בוחר נוסף עם אותו שם ומספר טלפון
            </Typography>
          </Alert>
        )}
        {duplicateCount && duplicateCount > 1 && (
          <Alert severity="info" sx={{ mb: 2 }} icon={<WarningIcon />}>
            <Typography variant="caption">
              <strong>כפילויות:</strong> {duplicateCount} רשומות זהות (שם + טלפון)
            </Typography>
          </Alert>
        )}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="h6">
                {voter.fullName}
              </Typography>
              {duplicateCount && duplicateCount > 1 && (
                <Chip
                  label={`×${duplicateCount}`}
                  color="error"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                />
              )}
            </Stack>

            <Stack spacing={1}>
              {/* Phone */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {voter.phone}
                </Typography>
              </Stack>

              {/* Address */}
              {voter.voterAddress && (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <HomeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {voter.voterAddress}
                  </Typography>
                </Stack>
              )}

              {/* Support Level */}
              {voter.supportLevel && (
                <Box>
                  <Chip
                    label={`${getSupportIcon(voter.supportLevel)} ${voter.supportLevel}`}
                    color={getSupportColor(voter.supportLevel)}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              )}

              {/* Contact Status */}
              {voter.contactStatus && (
                <Typography variant="caption" color="text.secondary">
                  סטטוס: {voter.contactStatus}
                </Typography>
              )}

              {/* Notes Preview */}
              {voter.notes && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  📝 {voter.notes}
                </Typography>
              )}
            </Stack>
          </Box>

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/voters/${voter.id}/edit`);
            }}
            data-testid="edit-voter-button"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
}
