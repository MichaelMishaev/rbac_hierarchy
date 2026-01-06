'use client';

/**
 * Session Expired Error Component
 *
 * Shows user-friendly error when JWT session is stale (after DB reset/seed)
 * Provides clear logout button to resolve the issue
 *
 * Design: Monday.com style with Hebrew/RTL
 */

import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline as ErrorIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import { signOut } from 'next-auth/react';

interface SessionExpiredErrorProps {
  errorMessage?: string;
  isRTL?: boolean;
}

export default function SessionExpiredError({
  errorMessage,
  isRTL = true,
}: SessionExpiredErrorProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <Box
      sx={{
        p: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
      lang="he"
    >
      <Paper
        sx={{
          p: 6,
          maxWidth: 500,
          borderRadius: borderRadius['2xl'],
          boxShadow: shadows.large,
          textAlign: 'center',
          border: `2px solid ${colors.status.orange}30`,
          background: `linear-gradient(135deg, ${colors.neutral[0]} 0%, ${colors.pastel.orangeLight} 100%)`,
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: colors.pastel.orangeLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            boxShadow: shadows.glowOrange,
          }}
        >
          <ErrorIcon sx={{ fontSize: 48, color: colors.status.orange }} />
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: colors.neutral[900],
            mb: 2,
          }}
        >
          הזמן-קצוב פג תוקפו
        </Typography>

        {/* Message */}
        <Typography
          variant="body1"
          sx={{
            color: colors.neutral[700],
            mb: 1,
            lineHeight: 1.6,
          }}
        >
          ההתחברות שלך אינה תקפה עקב שינויים במערכת.
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: colors.neutral[700],
            mb: 4,
            lineHeight: 1.6,
          }}
        >
          אנא התנתק והתחבר מחדש כדי להמשיך.
        </Typography>

        {/* Error details (if provided) */}
        {errorMessage && (
          <Box
            sx={{
              p: 2,
              mb: 3,
              borderRadius: borderRadius.lg,
              backgroundColor: colors.neutral[100],
              border: `1px solid ${colors.neutral[300]}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: colors.neutral[600],
                fontFamily: 'monospace',
                fontSize: '0.75rem',
              }}
            >
              {errorMessage}
            </Typography>
          </Box>
        )}

        {/* Logout Button */}
        <Button
          variant="contained"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            background: colors.gradients.primary,
            color: colors.neutral[0],
            px: 4,
            py: 1.75,
            fontSize: '17px',
            borderRadius: borderRadius['2xl'],
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: shadows.soft,
            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: colors.primary.dark,
              boxShadow: shadows.glowBlue,
              transform: 'translateY(-2px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          }}
        >
          התנתק והתחבר מחדש
        </Button>

        {/* Help Text */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 3,
            color: colors.neutral[500],
            fontSize: '0.875rem',
          }}
        >
          אם הבעיה נמשכת, צור קשר עם מנהל המערכת
        </Typography>
      </Paper>
    </Box>
  );
}
