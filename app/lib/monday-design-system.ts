/**
 * Monday.com Design System
 *
 * Based on research from:
 * - https://vibe.monday.com/ (Vibe Design System)
 * - https://mobbin.com/colors/brand/monday-com
 * - Visual analysis of monday.com application
 */

export const mondayColors = {
  // Primary Brand Colors
  primary: {
    main: '#6161FF',        // Cornflower Blue - Main brand color
    dark: '#5034FF',        // Darker blue for hover states
    light: '#7F7FFF',       // Lighter blue for backgrounds
    ultraLight: '#F5F5FF',  // Very light blue for subtle backgrounds
  },

  // Secondary Colors
  secondary: {
    mirage: '#181B34',      // Dark navy - Primary text and headers
    arsenic: '#434343',     // Dark gray - Secondary text
    white: '#FFFFFF',       // Pure white
  },

  // Status Colors (monday.com's colorful status system)
  status: {
    red: '#E44258',         // Sizzling Red
    orange: '#FDAB3D',      // Orange
    yellow: '#FFCB00',      // Philippine Yellow
    green: '#00C875',       // Malachite Green - Success
    lightGreen: '#9CD326',  // Light green
    blue: '#0086C0',        // Info blue
    purple: '#A25DDC',      // Purple
    pink: '#FF158A',        // Hot pink
    darkBlue: '#225091',    // Dark blue
    gray: '#C4C4C4',        // Neutral gray
  },

  // UI Colors
  ui: {
    background: '#F6F7FB',  // Light grayish-blue background
    surface: '#FFFFFF',     // Card/surface white
    border: '#D0D4E4',      // Border gray-blue
    divider: '#E6E9EF',     // Lighter divider
    hover: '#F5F6F8',       // Hover state background
    selected: '#EFF0F5',    // Selected state background
  },

  // Text Colors
  text: {
    primary: '#323338',     // Primary text (dark gray)
    secondary: '#676879',   // Secondary text (medium gray)
    tertiary: '#9699A6',    // Tertiary text (light gray)
    disabled: '#C5C7D0',    // Disabled text
    inverse: '#FFFFFF',     // White text on dark backgrounds
  },

  // Semantic Colors
  semantic: {
    success: '#00C875',     // Green
    error: '#E44258',       // Red
    warning: '#FFCB00',     // Yellow
    info: '#0086C0',        // Blue
  },
};

export const mondayTypography = {
  fontFamily: {
    primary: '"Figtree", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    secondary: '"Poppins", sans-serif',
    mono: '"Roboto Mono", monospace',
  },

  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const mondaySpacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  '4xl': '48px',
  '5xl': '64px',
};

export const mondayBorderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px',
};

export const mondayShadows = {
  none: 'none',
  xs: '0px 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0px 2px 4px rgba(0, 0, 0, 0.06)',
  md: '0px 4px 8px rgba(0, 0, 0, 0.08)',
  lg: '0px 8px 16px rgba(0, 0, 0, 0.1)',
  xl: '0px 12px 24px rgba(0, 0, 0, 0.12)',
  '2xl': '0px 16px 32px rgba(0, 0, 0, 0.14)',

  // Colored shadows for emphasis
  primary: '0px 4px 12px rgba(97, 97, 255, 0.2)',
  success: '0px 4px 12px rgba(0, 200, 117, 0.2)',
  error: '0px 4px 12px rgba(228, 66, 88, 0.2)',
};

export const mondayComponents = {
  button: {
    primary: {
      background: mondayColors.primary.main,
      color: mondayColors.text.inverse,
      hover: mondayColors.primary.dark,
      active: mondayColors.primary.dark,
      shadow: mondayShadows.primary,
      borderRadius: mondayBorderRadius.md,
      padding: '8px 16px',
      fontSize: mondayTypography.fontSize.sm,
      fontWeight: mondayTypography.fontWeight.medium,
    },
    secondary: {
      background: mondayColors.ui.surface,
      color: mondayColors.text.primary,
      border: `1px solid ${mondayColors.ui.border}`,
      hover: mondayColors.ui.hover,
      active: mondayColors.ui.selected,
      borderRadius: mondayBorderRadius.md,
      padding: '8px 16px',
    },
  },

  card: {
    background: mondayColors.ui.surface,
    border: `1px solid ${mondayColors.ui.border}`,
    borderRadius: mondayBorderRadius.lg,
    shadow: mondayShadows.sm,
    padding: mondaySpacing.xl,
    hover: {
      shadow: mondayShadows.md,
      transform: 'translateY(-2px)',
      transition: 'all 0.2s ease-in-out',
    },
  },

  input: {
    background: mondayColors.ui.surface,
    border: `1px solid ${mondayColors.ui.border}`,
    borderRadius: mondayBorderRadius.md,
    padding: '8px 12px',
    fontSize: mondayTypography.fontSize.sm,
    color: mondayColors.text.primary,
    placeholder: mondayColors.text.tertiary,
    focus: {
      border: `1px solid ${mondayColors.primary.main}`,
      shadow: `0 0 0 2px ${mondayColors.primary.ultraLight}`,
    },
  },

  table: {
    header: {
      background: mondayColors.ui.background,
      color: mondayColors.text.secondary,
      fontSize: mondayTypography.fontSize.xs,
      fontWeight: mondayTypography.fontWeight.semibold,
      textTransform: 'uppercase',
      padding: '12px 16px',
      borderBottom: `2px solid ${mondayColors.ui.divider}`,
    },
    row: {
      background: mondayColors.ui.surface,
      hover: mondayColors.ui.hover,
      selected: mondayColors.ui.selected,
      borderBottom: `1px solid ${mondayColors.ui.divider}`,
      padding: '12px 16px',
    },
  },

  statusBadge: {
    padding: '4px 12px',
    borderRadius: mondayBorderRadius.full,
    fontSize: mondayTypography.fontSize.xs,
    fontWeight: mondayTypography.fontWeight.medium,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },

  navigation: {
    sidebar: {
      width: '260px',
      background: mondayColors.ui.surface,
      borderRight: `1px solid ${mondayColors.ui.border}`,
      padding: mondaySpacing.lg,
    },
    item: {
      padding: '10px 12px',
      borderRadius: mondayBorderRadius.md,
      fontSize: mondayTypography.fontSize.sm,
      fontWeight: mondayTypography.fontWeight.medium,
      color: mondayColors.text.secondary,
      hover: {
        background: mondayColors.ui.hover,
        color: mondayColors.text.primary,
      },
      active: {
        background: mondayColors.primary.ultraLight,
        color: mondayColors.primary.main,
        fontWeight: mondayTypography.fontWeight.semibold,
      },
    },
  },
};

// Monday.com style animations
export const mondayAnimations = {
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },
};

// Export complete design system
export const mondayDesignSystem = {
  colors: mondayColors,
  typography: mondayTypography,
  spacing: mondaySpacing,
  borderRadius: mondayBorderRadius,
  shadows: mondayShadows,
  components: mondayComponents,
  animations: mondayAnimations,
};

export default mondayDesignSystem;
