'use client';

import { usePathname, useRouter } from 'next/navigation';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { logout } from '@/app/actions/auth';

export function ActivistBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Determine current tab based on pathname
  const getCurrentTab = () => {
    if (pathname.includes('/voters')) return 'voters';
    if (pathname.includes('/profile')) return 'profile';
    return 'voters';
  };

  const handleChange = async (_event: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'logout') {
      await logout();
      return;
    }
    router.push(`/${newValue}`);
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
      elevation={3}
    >
      <BottomNavigation
        value={getCurrentTab()}
        onChange={handleChange}
        showLabels
        sx={{
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
          },
        }}
      >
        <BottomNavigationAction
          label="בוחרים"
          value="voters"
          icon={<GroupIcon />}
          data-testid="activist-nav-voters"
        />
        <BottomNavigationAction
          label="פרופיל"
          value="profile"
          icon={<PersonIcon />}
          data-testid="activist-nav-profile"
        />
        <BottomNavigationAction
          label="יציאה"
          value="logout"
          icon={<LogoutIcon />}
          data-testid="activist-nav-logout"
        />
      </BottomNavigation>
    </Paper>
  );
}
