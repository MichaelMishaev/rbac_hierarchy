'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, LinearProgress } from '@mui/material';
import { Warning as WarningIcon, Refresh as RefreshIcon } from '@mui/icons-material';

/**
 * Critical Update Banner
 * Shows a non-dismissible red banner with countdown for critical security updates
 *
 * Features:
 * - Hebrew RTL layout
 * - Non-dismissible (highest priority)
 * - 30-second countdown with progress bar
 * - Auto-reloads when countdown ends
 * - "Update Now" button to skip countdown
 */

interface CriticalUpdateBannerProps {
  serverBuildId: string;
  countdownSeconds?: number;
  onRefresh?: () => void;
}

const DEFAULT_COUNTDOWN = 30; // 30 seconds

export function CriticalUpdateBanner({
  serverBuildId,
  countdownSeconds = DEFAULT_COUNTDOWN,
  onRefresh,
}: CriticalUpdateBannerProps) {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);

  useEffect(() => {
    // Reset countdown when serverBuildId changes
    setSecondsLeft(countdownSeconds);
  }, [serverBuildId, countdownSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      handleRefresh();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

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

  const progress = ((countdownSeconds - secondsLeft) / countdownSeconds) * 100;

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999, // Highest priority
        backgroundColor: '#d83a52', // Monday.com red
        color: 'white',
        borderRadius: 0,
        boxShadow: '0 4px 16px rgba(216, 58, 82, 0.5)',
      }}
      dir="rtl"
      lang="he"
    >
      <Box>
        {/* Main Content */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            gap: 2,
          }}
        >
          {/* Message */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <WarningIcon sx={{ fontSize: 32, animation: 'pulse 1.5s ease-in-out infinite' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, marginBottom: 0.5 }}>
                עדכון קריטי
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.95 }}>
                הדף ירוענן בעוד {secondsLeft} שניות
              </Typography>
            </Box>
          </Box>

          {/* Action Button */}
          <Button
            variant="contained"
            size="large"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            sx={{
              backgroundColor: 'white',
              color: '#d83a52',
              fontWeight: 700,
              borderRadius: '24px',
              paddingX: 4,
              paddingY: 1.5,
              fontSize: '1rem',
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
            }}
          >
            עדכן עכשיו
          </Button>
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: 'white',
            },
          }}
        />
      </Box>

      {/* Pulse animation for warning icon */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </Paper>
  );
}
