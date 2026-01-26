'use client';

// 🚀 PERFORMANCE: Dynamic import of framer-motion saves ~350KB from initial bundle
import { MotionDiv } from '@/app/components/ui/DynamicMotion';
import { Box, Button } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import SettingsIcon from '@mui/icons-material/Settings';
import Link from 'next/link';
import { colors, borderRadius, shadows } from '@/lib/design-system';

interface QuickAction {
  label: string;
  icon: React.ElementType;
  href?: string;
  onClick?: () => void;
  gradient: string;
  testId: string;
}

// Haptic feedback helper
const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(10); // 10ms subtle vibration
  }
};

export function QuickActions() {
  const handleCheckIn = () => {
    triggerHaptic();
    // TODO: Implement quick check-in functionality
    alert('פונקציונליות נוכחות מהירה תתווסף בקרוב');
  };

  const quickActions: QuickAction[] = [
    {
      label: 'הוסף בוחר',
      icon: PersonAddIcon,
      href: '/voters/new',
      gradient: colors.gradients.primary,
      testId: 'quick-add-voter',
    },
    {
      label: 'נוכחות',
      icon: CheckIcon,
      onClick: handleCheckIn,
      gradient: colors.gradients.success,
      testId: 'quick-check-in',
    },
    {
      label: 'הגדרות',
      icon: SettingsIcon,
      href: '/profile/settings',
      gradient: colors.gradients.soft,
      testId: 'quick-settings',
    },
  ];

  return (
    <Box
      sx={{
        // Horizontal scroll container
        display: 'flex',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        gap: 2,
        pb: 1,
        // Hide scrollbar
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
      dir="rtl"
    >
      {quickActions.map((action, index) => {
        const Icon = action.icon;

        const buttonContent = (
          <MotionDiv
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            whileHover={{
              scale: 1.05,
              transition: { type: 'spring', stiffness: 300, damping: 20 },
            }}
            whileTap={{ scale: 0.95 }}
            style={{ scrollSnapAlign: 'start' }}
          >
            <Button
              variant="contained"
              size="large"
              endIcon={<Icon />}
              data-testid={action.testId}
              onClick={() => {
                triggerHaptic();
                action.onClick?.();
              }}
              sx={{
                minWidth: { xs: '160px', md: '180px' },
                borderRadius: borderRadius.xl,
                padding: '16px 24px',
                background: action.gradient,
                boxShadow: shadows.soft,
                fontWeight: 600,
                fontSize: { xs: '1rem', md: '1.125rem' },
                textTransform: 'none',
                color:
                  action.gradient === colors.gradients.soft
                    ? colors.neutral[700]
                    : colors.neutral[0],
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                '&:hover': {
                  background: action.gradient,
                  boxShadow: shadows.medium,
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '& .MuiButton-endIcon': {
                  marginLeft: 0,
                  marginRight: '8px',
                },
              }}
            >
              {action.label}
            </Button>
          </MotionDiv>
        );

        // Wrap with Link if href is provided
        if (action.href) {
          return (
            <Link
              key={action.label}
              href={action.href}
              style={{ textDecoration: 'none', scrollSnapAlign: 'start' }}
            >
              {buttonContent}
            </Link>
          );
        }

        return <Box key={action.label}>{buttonContent}</Box>;
      })}
    </Box>
  );
}
