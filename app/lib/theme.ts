'use client';

import { createTheme } from '@mui/material/styles';
import { colors, typography, borderRadius, shadows } from './design-system';

// Base theme configuration that supports both RTL and LTR
const createBaseTheme = (direction: 'rtl' | 'ltr' = 'rtl') => createTheme({
  direction, // Hebrew-first system uses RTL by default
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
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
    borderRadius: parseInt(borderRadius.lg.replace('rem', '')) * 16, // Convert rem to px (12px)
  },
  spacing: 8, // MUI default spacing unit (1 = 8px)
  components: {
    // ========================================
    // DIALOG COMPONENTS (Modals)
    // ========================================
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: borderRadius['2xl'],
          boxShadow: shadows.xl,
          padding: 0,
          backgroundImage: 'none',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: typography.fontWeight.bold,
          fontSize: typography.fontSize['3xl'],
          color: colors.neutral[900],
          paddingBottom: '8px',
          paddingTop: '32px',
          paddingLeft: '32px',
          paddingRight: '32px',
          letterSpacing: '-0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          paddingTop: '24px !important',
          paddingLeft: '32px',
          paddingRight: '32px',
          paddingBottom: '24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '24px 32px 32px 32px',
          gap: '12px',
          borderTop: `1px solid ${colors.neutral[100]}`,
          backgroundColor: colors.neutral[50],
        },
      },
    },

    // ========================================
    // BUTTON COMPONENTS
    // ========================================
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
          borderColor: colors.neutral[300],
          color: colors.neutral[700],
          backgroundColor: colors.neutral[0],
          '&:hover': {
            borderWidth: '2px',
            borderColor: colors.neutral[400],
            backgroundColor: colors.neutral[50],
          },
        },
        sizeLarge: {
          padding: '14px 32px',
          fontSize: typography.fontSize.lg,
          borderRadius: borderRadius.xl,
        },
      },
    },

    // ========================================
    // FORM COMPONENTS
    // ========================================
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: borderRadius.xl,
            backgroundColor: colors.neutral[0],
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            fontSize: typography.fontSize.base,
            '& fieldset': {
              borderColor: colors.neutral[200],
              borderWidth: '1.5px',
              transition: 'all 300ms ease',
            },
            '&:hover fieldset': {
              borderColor: colors.primary.main,
              borderWidth: '1.5px',
            },
            '&.Mui-focused': {
              backgroundColor: colors.neutral[0],
              '& fieldset': {
                borderColor: colors.primary.main,
                borderWidth: '2px',
                boxShadow: `0 0 0 4px ${colors.pastel.blueLight}`,
              },
            },
            '& input': {
              padding: '14px 16px',
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: typography.fontWeight.semibold,
            color: colors.neutral[600],
            fontSize: typography.fontSize.sm,
            '&.Mui-focused': {
              color: colors.primary.main,
              fontWeight: typography.fontWeight.bold,
            },
          },
          '& .MuiInputAdornment-root': {
            color: colors.neutral[500],
          },
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
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
          },
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
          margin: '4px 8px',
          '&:hover': {
            backgroundColor: colors.pastel.blueLight,
          },
          '&.Mui-selected': {
            backgroundColor: colors.pastel.blueLight,
            '&:hover': {
              backgroundColor: colors.pastel.blueLight,
            },
          },
        },
      },
    },

    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            fontWeight: typography.fontWeight.medium,
            color: colors.neutral[600],
          },
        },
      },
    },

    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          marginLeft: 0,
          marginRight: 0,
        },
        label: {
          fontWeight: typography.fontWeight.medium,
          color: colors.neutral[700],
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: colors.pastel.green,
          },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: colors.pastel.green,
          },
        },
      },
    },

    // ========================================
    // AUTOCOMPLETE (for tags in WorkerModal)
    // ========================================
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: borderRadius.lg,
          },
        },
        listbox: {
          '& .MuiAutocomplete-option': {
            borderRadius: borderRadius.md,
            margin: '4px 8px',
            '&:hover': {
              backgroundColor: colors.pastel.blueLight,
            },
            '&[aria-selected="true"]': {
              backgroundColor: colors.pastel.blueLight,
            },
          },
        },
      },
    },

    // ========================================
    // CARD & PAPER COMPONENTS
    // ========================================
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius['2xl'],
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
        elevation3: {
          boxShadow: shadows.large,
        },
      },
    },

    // ========================================
    // CHIP COMPONENTS (for tags)
    // ========================================
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.full,
          fontWeight: typography.fontWeight.medium,
          backgroundColor: colors.pastel.blueLight,
          color: colors.pastel.blue,
        },
        sizeSmall: {
          fontSize: typography.fontSize.xs,
        },
      },
    },

    // ========================================
    // ALERT COMPONENTS
    // ========================================
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

    // ========================================
    // INPUT LABEL
    // ========================================
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: typography.fontWeight.medium,
          color: colors.neutral[600],
          '&.Mui-focused': {
            color: colors.pastel.blue,
          },
        },
      },
    },
  },
});

// Export themed versions
export const lightTheme = createBaseTheme('rtl'); // Hebrew-first, RTL by default
export const darkTheme = createTheme({
  ...createBaseTheme('rtl'),
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
