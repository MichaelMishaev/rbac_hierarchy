/**
 * Mobile Bottom Navigation Bar (< 768px screens)
 * Following 2025 mobile-first design patterns:
 * - Bottom placement for thumb reach
 * - Maximum 5 items for optimal recognition
 * - Badge notifications for real-time updates
 * - RTL support for Hebrew locale
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { BottomNavigation, BottomNavigationAction, Paper, Badge } from '@mui/material';
import { colors } from '@/lib/design-system';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MapIcon from '@mui/icons-material/Map';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useUnreadTaskCount } from '@/app/hooks/useUnreadTaskCount';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: unreadData } = useUnreadTaskCount();
  const unreadCount = unreadData?.unread_count || 0;

  // Remove locale from path for comparison
  const currentPath = pathname.replace(/^\/(he|en)/, '') || '/';

  const getActiveIndex = () => {
    if (currentPath === '/dashboard') return 0;
    if (currentPath.startsWith('/activists')) return 1;
    if (currentPath.startsWith('/tasks')) return 2;
    if (currentPath.startsWith('/map')) return 3;
    return 4; // More
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const paths = ['/dashboard', '/activists', '/tasks', '/map', '/more'];
    router.push(paths[newValue]);
  };

  return (
    <Paper
      data-testid="mobile-bottom-nav"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        display: { xs: 'block', md: 'none' }, // Mobile only
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        borderTop: `1px solid ${colors.neutral[200]}`,
      }}
      elevation={3}
    >
      <BottomNavigation
        value={getActiveIndex()}
        onChange={handleChange}
        showLabels
        sx={{
          height: 64,
          direction: 'rtl',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 64,
            minHeight: 48, // WCAG 2.1 minimum touch target
            color: colors.neutral[600],
            transition: 'all 0.2s ease',
            '&.Mui-selected': {
              color: colors.primary.main,
              fontWeight: 700,
            },
            '&:hover': {
              bgcolor: colors.neutral[50],
            },
          },
        }}
      >
        <BottomNavigationAction
          data-testid="bottom-nav-dashboard"
          label="לוח בקרה"
          icon={<DashboardIcon />}
        />
        <BottomNavigationAction
          data-testid="bottom-nav-activists"
          label="פעילים"
          icon={<GroupIcon />}
        />
        <BottomNavigationAction
          data-testid="bottom-nav-tasks"
          label="משימות"
          icon={
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <AssignmentIcon />
            </Badge>
          }
        />
        <BottomNavigationAction
          data-testid="bottom-nav-map"
          label="מפה"
          icon={<MapIcon />}
        />
        <BottomNavigationAction
          data-testid="bottom-nav-more"
          label="עוד"
          icon={<MoreHorizIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
}
