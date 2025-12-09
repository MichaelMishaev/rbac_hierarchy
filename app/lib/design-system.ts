/**
 * Monday.com Design System
 * Official monday.com brand colors and styling
 * Research from: vibe.monday.com & mobbin.com/colors/brand/monday-com
 */

export const colors = {
  // Monday.com Primary Brand Colors
  primary: {
    main: '#6161FF',        // Cornflower Blue - Main brand color
    dark: '#5034FF',        // Darker blue for hover states
    light: '#7F7FFF',       // Lighter blue
    ultraLight: '#F5F5FF',  // Very light blue backgrounds
  },

  // Monday.com Secondary Colors
  secondary: {
    mirage: '#181B34',      // Dark navy - Primary text and headers
    arsenic: '#434343',     // Dark gray - Secondary text
    white: '#FFFFFF',       // Pure white
  },

  // Monday.com Status Colors (their famous colorful system)
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

  // Pastel versions for backgrounds
  pastel: {
    blue: '#6161FF',
    blueLight: '#F5F5FF',
    purple: '#A25DDC',
    purpleLight: '#F8F5FF',
    green: '#00C875',
    greenLight: '#E5FFF3',
    pink: '#FF158A',
    pinkLight: '#FFE8F5',
    orange: '#FDAB3D',
    orangeLight: '#FFF8E8',
    yellow: '#FFCB00',
    yellowLight: '#FFFACC',
    red: '#E44258',
    redLight: '#FFE8EC',
  },

  // UI Colors
  neutral: {
    0: '#FFFFFF',           // Surface white
    50: '#F6F7FB',          // Light grayish-blue background
    100: '#F5F6F8',         // Hover state
    200: '#E6E9EF',         // Divider
    300: '#D0D4E4',         // Border
    400: '#9699A6',         // Tertiary text
    500: '#676879',         // Secondary text
    600: '#323338',         // Primary text
    700: '#181B34',         // Dark headers
    800: '#1F2937',         // Darker
    900: '#111827',         // Black
  },

  // Semantic Colors
  success: '#00C875',
  warning: '#FFCB00',
  error: '#E44258',
  info: '#0086C0',

  // Monday.com Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #6161FF 0%, #5034FF 100%)',
    secondary: 'linear-gradient(135deg, #A25DDC 0%, #8B4BCF 100%)',
    success: 'linear-gradient(135deg, #00C875 0%, #00A661 100%)',
    warning: 'linear-gradient(135deg, #FDAB3D 0%, #E89B2A 100%)',
    error: 'linear-gradient(135deg, #E44258 0%, #D12F45 100%)',
    info: 'linear-gradient(135deg, #0086C0 0%, #0073A8 100%)',
    soft: 'linear-gradient(135deg, #F6F7FB 0%, #F5F6F8 100%)',
    pastelBlue: 'linear-gradient(135deg, #F5F5FF 0%, #E8E8FF 100%)',
    pastelGreen: 'linear-gradient(135deg, #E5FFF3 0%, #CCFFE6 100%)',
  },
};

export const typography = {
  fontFamily: {
    sans: '"Figtree", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    rounded: '"Poppins", "Figtree", -apple-system, sans-serif',
  },

  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px - Big KPI numbers
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
};

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

// Monday.com Border Radius
export const borderRadius = {
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px - Monday.com standard
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.25rem',// 20px - Larger cards
  '3xl': '1.5rem', // 24px
  full: '9999px',  // Pills
};

// Monday.com Shadows
export const shadows = {
  // Subtle shadows
  soft: '0px 2px 4px rgba(0, 0, 0, 0.06)',
  medium: '0px 4px 8px rgba(0, 0, 0, 0.08)',
  large: '0px 8px 16px rgba(0, 0, 0, 0.1)',
  xl: '0px 12px 24px rgba(0, 0, 0, 0.12)',

  // Inner shadows
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  innerMedium: 'inset 0 4px 8px rgba(0, 0, 0, 0.1)',

  // Neo-morphic (kept for compatibility)
  neomorph: '0px 4px 8px rgba(0, 0, 0, 0.08)',
  neomorphInset: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',

  // Monday.com colored glows (for hover)
  glowBlue: '0 0 20px rgba(97, 97, 255, 0.3)',
  glowPurple: '0 0 20px rgba(162, 93, 220, 0.3)',
  glowGreen: '0 0 20px rgba(0, 200, 117, 0.3)',
  glowOrange: '0 0 20px rgba(253, 171, 61, 0.3)',
  glowRed: '0 0 20px rgba(228, 66, 88, 0.3)',
  glowPink: '0 0 20px rgba(255, 21, 138, 0.3)',
};

export const animations = {
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  spring: {
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  },
};

export const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  laptop: '1024px',
  desktop: '1280px',
  wide: '1536px',
};

// Monday.com KPI Card Configurations
export const kpiCards = {
  colors: {
    blue: {
      bg: colors.pastel.blueLight,
      text: colors.primary.main,
      border: '#E8E8FF',
    },
    purple: {
      bg: colors.pastel.purpleLight,
      text: colors.status.purple,
      border: '#F0EBFF',
    },
    green: {
      bg: colors.pastel.greenLight,
      text: colors.status.green,
      border: '#CCF8E6',
    },
    pink: {
      bg: colors.pastel.pinkLight,
      text: colors.status.pink,
      border: '#FFD6EB',
    },
    orange: {
      bg: colors.pastel.orangeLight,
      text: colors.status.orange,
      border: '#FFEBD6',
    },
    yellow: {
      bg: colors.pastel.yellowLight,
      text: colors.status.yellow,
      border: '#FFF5B8',
    },
  },
};
