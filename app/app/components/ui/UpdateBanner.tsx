'use client';

import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Typography, Paper } from '@mui/material';
import { Close as CloseIcon, Refresh as RefreshIcon } from '@mui/icons-material';

/**
 * Soft Update Banner
 * Shows a dismissible blue banner when a new version is available
 *
 * Features:
 * - Hebrew RTL layout
 * - Dismissible (stores in localStorage)
 * - Reappears after 5 minutes
 * - Refresh button to reload immediately
 * - Close button to dismiss
 */

interface UpdateBannerProps {
  serverBuildId: string;
  onRefresh?: () => void;
}

const DISMISS_KEY = 'update-banner-dismissed';
const DISMISS_DURATION = 5 * 60 * 1000; // 5 minutes

export function UpdateBanner({ serverBuildId, onRefresh }: UpdateBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Check if banner was dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION) {
        setIsDismissed(true);
        return;
      }
    }

    // Show banner
    setIsDismissed(false);
  }, [serverBuildId]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsDismissed(true);
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      // Send SKIP_WAITING message to service worker if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }

      // Hard reload to get new version
      window.location.reload();
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        backgroundColor: '#0073ea', // Monday.com blue
        color: 'white',
        borderRadius: 0,
        boxShadow: '0 4px 12px rgba(0, 115, 234, 0.3)',
      }}
      dir="rtl"
      lang="he"
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          gap: 2,
        }}
      >
        {/* Message */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <RefreshIcon sx={{ fontSize: 24 }} />
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            גרסה חדשה זמינה! רענן את הדף כדי לקבל את העדכון.
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleRefresh}
            sx={{
              backgroundColor: 'white',
              color: '#0073ea',
              fontWeight: 600,
              borderRadius: '20px',
              paddingX: 3,
              paddingY: 0.75,
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
            }}
          >
            רענן עכשיו
          </Button>

          <IconButton
            size="small"
            onClick={handleDismiss}
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
            aria-label="סגור"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
}
