/**
 * PWA Install Prompt Component - Smart Detection
 *
 * Prompts users to install the app on their device with intelligent filtering.
 * Uses beforeinstallprompt event (Chrome, Edge, Samsung Internet).
 * Shows custom UI instead of browser default.
 *
 * Smart Detection Criteria (all must pass):
 * 1. Not already installed (standalone mode check)
 * 2. Not iOS device (beforeinstallprompt not supported)
 * 3. Not dismissed in last 90 days (was 7 days)
 * 4. User has visited 3+ times (engagement check)
 * 5. Session duration 30+ seconds (not a bounce)
 *
 * This prevents popup flooding while reaching engaged users.
 */

'use client';

import { useState, useEffect } from 'react';
import { Box, Button, IconButton, Paper, Typography, Slide } from '@mui/material';
import { colors, shadows } from '@/lib/design-system';
import CloseIcon from '@mui/icons-material/Close';
import GetAppIcon from '@mui/icons-material/GetApp';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import RtlButton from '@/app/components/ui/RtlButton';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration issues - only run after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Wait for client-side mount to avoid hydration mismatch
    if (!mounted || typeof window === 'undefined') return;

    // 1. Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // 2. Check if iOS device (doesn't support beforeinstallprompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      console.log('[PWA] iOS device detected - beforeinstallprompt not supported');
      return;
    }

    // 3. Check if user dismissed prompt before (90 days cooldown)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysSinceDismissed = Math.floor((now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24));

      // Don't show again for 90 days (was 7)
      if (daysSinceDismissed < 90) {
        return;
      }
    }

    // 4. Check visit count (show only after 3+ visits)
    const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0', 10);
    const newVisitCount = visitCount + 1;
    localStorage.setItem('pwa-visit-count', newVisitCount.toString());

    if (newVisitCount < 3) {
      console.log(`[PWA] Visit ${newVisitCount}/3 - not showing prompt yet`);
      return;
    }

    // 5. Track session duration (show only if user stays 30+ seconds)
    const sessionStart = Date.now();
    let sessionValid = false;

    const checkSessionDuration = () => {
      const sessionDuration = (Date.now() - sessionStart) / 1000; // seconds
      if (sessionDuration >= 30) {
        sessionValid = true;
      }
    };

    const sessionTimer = setTimeout(() => {
      checkSessionDuration();
      if (!sessionValid) {
        console.log('[PWA] Session too short (< 30s) - not showing prompt');
      }
    }, 30000); // Check after 30 seconds

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing
      e.preventDefault();

      // Save the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show our custom prompt only if session is valid (30+ seconds)
      setTimeout(() => {
        if (sessionValid) {
          console.log('[PWA] All checks passed - showing install prompt');
          setShowPrompt(true);
        }
      }, 32000); // Wait 32 seconds (30s session + 2s buffer)
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect if app was installed
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-visit-count'); // Reset visit counter
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(sessionTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [mounted]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`[PWA] User response: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }

    // Clear the prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <Slide direction="up" in={showPrompt}>
      <Paper
        data-testid="pwa-install-prompt"
        sx={{
          position: 'fixed',
          bottom: { xs: 80, md: 24 }, // Above bottom nav on mobile
          left: { xs: 16, md: 24 },
          right: { xs: 16, md: 'auto' },
          maxWidth: { xs: '100%', md: 400 },
          zIndex: 1200,
          p: 3,
          borderRadius: '16px',
          boxShadow: shadows.xl,
          background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
          color: 'white',
        }}
      >
        <IconButton
          onClick={handleDismiss}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
          size="small"
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <PhoneAndroidIcon sx={{ fontSize: 40, color: 'white' }} />
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
              התקן את האפליקציה
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              קבל גישה מהירה והתראות בזמן אמת
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
          <Typography variant="caption" sx={{ opacity: 0.8, mb: 1 }}>
            ✓ עבודה במצב לא מקוון
            <br />
            ✓ התראות בזמן אמת
            <br />
            ✓ פתיחה מהירה מהמסך הראשי
          </Typography>

          <RtlButton
            variant="contained"
            onClick={handleInstall}
            startIcon={<GetAppIcon />}
            sx={{
              bgcolor: 'white',
              color: colors.primary.main,
              fontWeight: 700,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            התקן עכשיו
          </RtlButton>

          <Button
            variant="text"
            onClick={handleDismiss}
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            אולי מאוחר יותר
          </Button>
        </Box>
      </Paper>
    </Slide>
  );
}
