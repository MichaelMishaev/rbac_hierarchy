'use client';

import { createTheme } from '@mui/material/styles';
import { colors, typography, borderRadius, shadows } from './design-system';

export const lightTheme = createTheme({
  direction: 'ltr',
  palette: {
    mode: 'light',
    primary: {
      main: colors.pastel.blue,
      light: colors.pastel.blueLight,
      dark: '#5789E8',
      contrastText: '#fff',
    },
    secondary: {
      main: colors.pastel.purple,
      light: colors.pastel.purpleLight,
      dark: '#8785E8',
      contrastText: '#fff',
    },
    success: {
      main: colors.success,
      light: colors.pastel.greenLight,
    },
    warning: {
      main: colors.warning,
      light: colors.pastel.orangeLight,
    },
    error: {
      main: colors.error,
      light: colors.pastel.redLight,
    },
    info: {
      main: colors.info,
    },
    background: {
      default: colors.neutral[50],
      paper: colors.neutral[0],
    },
    text: {
      primary: colors.neutral[800],
      secondary: colors.neutral[500],
    },
  },
  typography: {
    fontFamily: typography.fontFamily.sans,
    fontSize: 16,
    h1: {
      fontSize: typography.fontSize['5xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      color: colors.neutral[900],
    },
    h2: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      color: colors.neutral[900],
    },
    h3: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: 1.3,
      color: colors.neutral[800],
    },
    h4: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: 1.4,
      color: colors.neutral[800],
    },
    h5: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: typography.fontSize.base,
      lineHeight: 1.6,
      color: colors.neutral[700],
    },
    body2: {
      fontSize: typography.fontSize.sm,
      lineHeight: 1.6,
      color: colors.neutral[600],
    },
    button: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 20, // Extra round!
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
          padding: '12px 24px',
          fontWeight: typography.fontWeight.medium,
          boxShadow: shadows.soft,
          textTransform: 'none',
          transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: shadows.medium,
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          background: colors.gradients.primary,
          border: 'none',
          boxShadow: shadows.soft,
          '&:hover': {
            background: colors.gradients.primary,
            boxShadow: shadows.glowBlue,
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: colors.neutral[200],
          backgroundColor: colors.neutral[0],
          '&:hover': {
            borderWidth: '2px',
            borderColor: colors.pastel.blue,
            backgroundColor: colors.pastel.blueLight,
          },
        },
        sizeLarge: {
          padding: '14px 32px',
          fontSize: typography.fontSize.lg,
          borderRadius: borderRadius.xl,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius['2xl'], // Extra thick!
          boxShadow: shadows.soft,
          border: `1px solid ${colors.neutral[200]}`,
          backgroundColor: colors.neutral[0],
          transition: 'all 250ms ease',
          '&:hover': {
            boxShadow: shadows.medium,
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: borderRadius.lg,
            backgroundColor: colors.neutral[0],
            boxShadow: shadows.inner,
            transition: 'all 250ms ease',
            '& fieldset': {
              borderColor: colors.neutral[200],
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: colors.pastel.blue,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.pastel.blue,
              borderWidth: '2px',
              boxShadow: `0 0 0 3px ${colors.pastel.blueLight}`,
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: typography.fontWeight.medium,
            color: colors.neutral[600],
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: borderRadius.xl,
        },
        elevation1: {
          boxShadow: shadows.soft,
        },
        elevation2: {
          boxShadow: shadows.medium,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.full,
          fontWeight: typography.fontWeight.medium,
          boxShadow: shadows.soft,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
          boxShadow: shadows.soft,
          border: `1px solid`,
        },
        standardSuccess: {
          backgroundColor: colors.pastel.greenLight,
          borderColor: colors.pastel.green,
          color: colors.neutral[800],
        },
        standardError: {
          backgroundColor: colors.pastel.redLight,
          borderColor: colors.error,
          color: colors.neutral[800],
        },
        standardWarning: {
          backgroundColor: colors.pastel.orangeLight,
          borderColor: colors.warning,
          color: colors.neutral[800],
        },
        standardInfo: {
          backgroundColor: colors.pastel.blueLight,
          borderColor: colors.info,
          color: colors.neutral[800],
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  ...lightTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: colors.pastel.blue,
      light: colors.pastel.blueLight,
      dark: '#5789E8',
    },
    background: {
      default: colors.neutral[900],
      paper: colors.neutral[800],
    },
    text: {
      primary: colors.neutral[50],
      secondary: colors.neutral[400],
    },
  },
});
