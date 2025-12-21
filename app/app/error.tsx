'use client';

/**
 * Next.js Error Boundary - Catches React component errors
 *
 * This file automatically catches all errors thrown in:
 * - React components (render errors)
 * - Event handlers
 * - useEffect hooks
 * - Server Components
 *
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

import { useEffect } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console (server logs will be visible in Railway)
    console.error('[Error Boundary] Error caught:', error);

    // Send to our error logging API (client-side)
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    }).catch((fetchError) => {
      console.error('[Error Boundary] Failed to log error:', fetchError);
    });
  }, [error]);

  return (
    <Container dir="rtl" lang="he" maxWidth="sm" sx={{ mt: 8 }}>
      <Box
        sx={{
          textAlign: 'center',
          p: 4,
          borderRadius: 4,
          bgcolor: 'background.paper',
          boxShadow: 3,
        }}
      >
        <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />

        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          משהו השתבש
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          אירעה שגיאה לא צפויה. השגיאה נשמרה ונטפל בה בהקדם.
        </Typography>

        {process.env.NODE_ENV === 'development' && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 2,
              textAlign: 'right',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            <Typography variant="caption" color="error">
              {error.message}
            </Typography>
            {error.digest && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Digest: {error.digest}
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={reset}
            sx={{ minWidth: 120 }}
          >
            נסה שוב
          </Button>

          <Button
            variant="outlined"
            href="/"
            sx={{ minWidth: 120 }}
          >
            חזור לדף הבית
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
