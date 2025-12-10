/**
 * Offline Banner Component
 * Displays a banner when the user loses internet connection
 * Auto-hides when connection is restored
 */

'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Slide } from '@mui/material';
import { colors, shadows } from '@/lib/design-system';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import CloudDoneIcon from '@mui/icons-material/CloudDone';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      setJustCameOnline(true);

      // Hide "back online" message after 3 seconds
      setTimeout(() => {
        setJustCameOnline(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustCameOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show "back online" message
  if (justCameOnline && !isOffline) {
    return (
      <Slide direction="down" in={true}>
        <Box
          data-testid="online-banner"
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bgcolor: colors.status.green,
            color: 'white',
            p: 1.5,
            textAlign: 'center',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            boxShadow: shadows.medium,
          }}
        >
          <CloudDoneIcon />
          <Typography variant="body2" fontWeight={600}>
            חזרת למצב מקוון - כל השינויים סונכרנו בהצלחה
          </Typography>
        </Box>
      </Slide>
    );
  }

  // Show offline banner
  if (!isOffline) return null;

  return (
    <Slide direction="down" in={isOffline}>
      <Box
        data-testid="offline-banner"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bgcolor: colors.status.orange,
          color: 'white',
          p: 1.5,
          textAlign: 'center',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          boxShadow: shadows.medium,
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.9 },
          },
        }}
      >
        <WifiOffIcon />
        <Typography variant="body2" fontWeight={600}>
          אתה במצב לא מקוון - השינויים יישמרו ויסונכרנו כשהחיבור יחזור
        </Typography>
      </Box>
    </Slide>
  );
}
