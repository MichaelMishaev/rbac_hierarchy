'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Collapse,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { colors, borderRadius, shadows } from '@/lib/design-system';

type KeyboardShortcutsHelpProps = {
  isRTL: boolean;
};

export default function KeyboardShortcutsHelp({ isRTL }: KeyboardShortcutsHelpProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissedPermanently, setIsDismissedPermanently] = useState(false);

  // Check if user has dismissed this before (localStorage)
  useEffect(() => {
    const dismissed = localStorage.getItem('activists-keyboard-help-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
      setIsDismissedPermanently(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleDismissPermanently = () => {
    setIsVisible(false);
    setIsDismissedPermanently(true);
    localStorage.setItem('activists-keyboard-help-dismissed', 'true');
  };

  // If permanently dismissed, don't render
  if (isDismissedPermanently) {
    return null;
  }

  const shortcuts = [
    { key: 'לחץ פעמיים', action: 'עריכת שדה' },
    { key: 'Enter', action: 'שמירת שינויים' },
    { key: 'Esc', action: 'ביטול עריכה' },
    { key: 'Tab', action: 'מעבר בין שדות' },
  ];

  return (
    <Collapse in={isVisible}>
      <Box
        sx={{
          mb: 3,
          p: 3,
          borderRadius: borderRadius.xl,
          background: `linear-gradient(135deg, ${colors.pastel.purpleLight} 0%, ${colors.pastel.pinkLight} 100%)`,
          border: `2px solid ${colors.pastel.purple}40`,
          boxShadow: shadows.soft,
          position: 'relative',
          animation: 'slideDown 400ms ease-out',
          '@keyframes slideDown': {
            from: { opacity: 0, transform: 'translateY(-20px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={handleDismiss}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            [isRTL ? 'left' : 'right']: 12,
            backgroundColor: colors.neutral[0],
            '&:hover': {
              backgroundColor: colors.neutral[200],
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: borderRadius.lg,
              background: `linear-gradient(135deg, ${colors.pastel.purple} 0%, ${colors.pastel.pink} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.neutral[0],
              boxShadow: shadows.soft,
            }}
          >
            <KeyboardIcon fontSize="medium" />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, color: colors.neutral[900], mb: 0.5, fontSize: '1.1rem' }}>
              ⚡ קיצורי דרך מהירים
            </Typography>
            <Typography variant="body2" sx={{ color: colors.neutral[700], mb: 2 }}>
              עבוד מהר יותר עם קיצורי מקלדת
            </Typography>

            {/* Shortcuts Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 2,
              }}
            >
              {shortcuts.map((shortcut, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Chip
                    label={shortcut.key}
                    size="small"
                    sx={{
                      backgroundColor: colors.neutral[0],
                      color: colors.neutral[800],
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      minWidth: 80,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: `1px solid ${colors.neutral[300]}`,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: colors.neutral[700], flex: 1 }}>
                    {shortcut.action}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Dismiss Permanently Link */}
        <Box sx={{ mt: 2, textAlign: isRTL ? 'left' : 'right' }}>
          <Typography
            component="button"
            onClick={handleDismissPermanently}
            variant="caption"
            sx={{
              color: colors.neutral[600],
              textDecoration: 'underline',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              fontWeight: 500,
              '&:hover': {
                color: colors.neutral[800],
              },
            }}
          >
            הסתר לצמיתות
          </Typography>
        </Box>
      </Box>
    </Collapse>
  );
}
