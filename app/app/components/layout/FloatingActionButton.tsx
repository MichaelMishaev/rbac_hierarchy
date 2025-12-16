/**
 * Context-Aware Floating Action Button (FAB)
 * Highlights the most important action on each page
 * Following Material Design 3 guidelines:
 * - 56x56px size for primary actions (larger than minimum 48px)
 * - Positioned above bottom navigation
 * - Changes based on current route
 * - Smooth transitions between states
 */

'use client';

import { usePathname } from 'next/navigation';
import { Fab, Zoom, Tooltip } from '@mui/material';
import { shadows } from '@/lib/design-system';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';

interface FABConfig {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  color: 'primary' | 'success' | 'secondary';
}

export default function ContextAwareFAB() {
  const pathname = usePathname();
  const isVisible = true; // Always visible

  // Remove locale from path
  const currentPath = pathname.replace(/^\/(he|en)/, '') || '/';

  const getFABConfig = (): FABConfig | null => {
    if (currentPath.startsWith('/activists')) {
      return {
        icon: <AddIcon />,
        label: 'הוסף פעיל',
        action: () => {
          // TODO: Open activist modal
          console.log('Add activist');
        },
        color: 'primary',
      };
    }

    if (currentPath.startsWith('/tasks')) {
      return {
        icon: <AddIcon />,
        label: 'צור משימה',
        action: () => {
          // TODO: Open task creation modal
          console.log('Create task');
        },
        color: 'primary',
      };
    }

    if (currentPath.startsWith('/attendance')) {
      return {
        icon: <CheckIcon />,
        label: 'רישום נוכחות',
        action: () => {
          // TODO: Open quick check-in modal
          console.log('Quick check-in');
        },
        color: 'success',
      };
    }

    // No FAB for other pages
    return null;
  };

  const fabConfig = getFABConfig();

  if (!fabConfig) return null;

  return (
    <Zoom in={isVisible}>
      <Tooltip title={fabConfig.label} placement="left" arrow>
        <Fab
          data-testid="context-aware-fab"
          color={fabConfig.color}
          aria-label={fabConfig.label}
          onClick={fabConfig.action}
          sx={{
            position: 'fixed',
            bottom: { xs: 80, md: 24 }, // Above bottom nav on mobile
            right: { xs: 16, md: 24 },
            left: 'auto',
            width: 56,
            height: 56,
            boxShadow: shadows.large,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: { xs: 'flex', md: 'flex' }, // Show on all screens
            zIndex: 1000,
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: shadows.xl,
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
        >
          {fabConfig.icon}
        </Fab>
      </Tooltip>
    </Zoom>
  );
}
