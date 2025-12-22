/**
 * Voter Detail Client Component - Hebrew RTL
 *
 * Features:
 * - Display all voter information
 * - Contact history
 * - Edit button
 * - Back navigation
 */

'use client';

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
import {
  Edit as EditIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import type { Voter } from '@prisma/client';

type VoterDetailClientProps = {
  voter: Voter;
};

export default function VoterDetailClient({ voter }: VoterDetailClientProps) {
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

  const formatDate = (date: Date | null) => {
    if (!date) return 'לא זמין';
    return new Date(date).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box dir="rtl">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {voter.fullName}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => router.push(`/voters/${voter.id}/edit`)}
            sx={{
              borderRadius: '50px',
              px: { xs: 2, sm: 3 },
              py: 1,
              fontWeight: 600,
              gap: 1,
            }}
          >
            <EditIcon sx={{ fontSize: 20 }} />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              ערוך
            </Box>
          </Button>
        </Box>
        <Button
          variant="text"
          onClick={() => router.push('/voters')}
          sx={{
            color: 'text.secondary',
            textTransform: 'none',
            p: 0,
            minWidth: 'auto',
            '&:hover': {
              backgroundColor: 'transparent',
              color: 'primary.main',
            },
          }}
        >
          ← חזרה לרשימת הבוחרים
        </Button>
      </Box>

      {/* Main Info Card */}
      <Card sx={{ mb: 3, borderRadius: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            {/* Name */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  שם מלא
                </Typography>
              </Stack>
              <Typography variant="h6">{voter.fullName}</Typography>
            </Box>

            <Divider />

            {/* Phone */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  טלפון
                </Typography>
              </Stack>
              <Typography variant="body1">{voter.phone}</Typography>
            </Box>

            <Divider />

            {/* Address */}
            {voter.voterAddress && (
              <>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <HomeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      כתובת
                    </Typography>
                  </Stack>
                  <Typography variant="body1">{voter.voterAddress}</Typography>
                </Box>
                <Divider />
              </>
            )}

            {/* Support Level */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                רמת תמיכה
              </Typography>
              {voter.supportLevel ? (
                <Chip
                  label={`${getSupportIcon(voter.supportLevel)} ${voter.supportLevel}`}
                  color={getSupportColor(voter.supportLevel)}
                  variant="outlined"
                />
              ) : (
                <Typography variant="body1" color="text.secondary">
                  לא נקבעה
                </Typography>
              )}
            </Box>

            {/* Contact Status */}
            {voter.contactStatus && (
              <>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    סטטוס יצירת קשר
                  </Typography>
                  <Typography variant="body1">{voter.contactStatus}</Typography>
                </Box>
              </>
            )}

            {/* Last Contacted */}
            {voter.lastContactedAt && (
              <>
                <Divider />
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      יצירת קשר אחרונה
                    </Typography>
                  </Stack>
                  <Typography variant="body1">{formatDate(voter.lastContactedAt)}</Typography>
                </Box>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Notes Card */}
      {voter.notes && (
        <Card sx={{ mb: 3, borderRadius: { xs: 2, sm: 3 } }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              📝 הערות
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {voter.notes}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Metadata Card */}
      <Card sx={{ borderRadius: { xs: 2, sm: 3 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            נוצר בתאריך: {formatDate(voter.insertedAt)}
          </Typography>
          {voter.updatedAt && voter.updatedAt.getTime() !== voter.insertedAt.getTime() && (
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              עודכן לאחרונה: {formatDate(voter.updatedAt)}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
