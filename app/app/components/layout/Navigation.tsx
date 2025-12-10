'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import MailIcon from '@mui/icons-material/Mail';

export type NavigationProps = {
  role: 'SUPERADMIN' | 'MANAGER' | 'SUPERVISOR';
};

export default function Navigation({ role }: NavigationProps) {
  const pathname = usePathname();

  const superAdminRoutes = [
    { path: '/dashboard', label: 'Dashboard / לוח בקרה', icon: <DashboardIcon /> },
    { path: '/cities', label: 'Corporations / תאגידים', icon: <BusinessIcon /> },
    { path: '/users', label: 'Users / משתמשים', icon: <PeopleIcon /> },
    { path: '/neighborhoods', label: 'Sites / אתרים', icon: <LocationOnIcon /> },
    { path: '/activists', label: 'Workers / עובדים', icon: <GroupIcon /> },
    { path: '/invitations', label: 'Invitations / הזמנות', icon: <MailIcon /> },
  ];

  const managerRoutes = [
    { path: '/dashboard', label: 'Dashboard / לוח בקרה', icon: <DashboardIcon /> },
    { path: '/neighborhoods', label: 'Sites / אתרים', icon: <LocationOnIcon /> },
    { path: '/activists', label: 'Workers / עובדים', icon: <GroupIcon /> },
    { path: '/users', label: 'Users / משתמשים', icon: <PeopleIcon /> },
  ];

  const supervisorRoutes = [
    { path: '/dashboard', label: 'Dashboard / לוח בקרה', icon: <DashboardIcon /> },
    { path: '/activists', label: 'Workers / עובדים', icon: <GroupIcon /> },
  ];

  const routes =
    role === 'SUPERADMIN'
      ? superAdminRoutes
      : role === 'MANAGER'
      ? managerRoutes
      : supervisorRoutes;

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 260 },
        height: { xs: 'auto', md: '100vh' },
        background: colors.neutral[0],
        borderRight: { md: `1px solid ${colors.neutral[200]}` },
        borderBottom: { xs: `1px solid ${colors.neutral[200]}`, md: 'none' },
        position: { xs: 'sticky', md: 'fixed' },
        top: 0,
        left: 0,
        overflowY: 'auto',
        boxShadow: shadows.soft,
        zIndex: 10,
      }}
    >
      {/* Logo/Brand */}
      <Box
        sx={{
          p: 3,
          borderBottom: `1px solid ${colors.neutral[200]}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: borderRadius.lg,
              background: colors.gradients.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.neutral[0],
              fontWeight: 700,
              fontSize: '18px',
            }}
          >
            C
          </Box>
          <Box>
            <Box
              sx={{
                fontWeight: 700,
                fontSize: '16px',
                color: colors.neutral[900],
              }}
            >
              Corporations
            </Box>
            <Box
              sx={{
                fontSize: '12px',
                color: colors.neutral[500],
              }}
            >
              {role}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Navigation Links */}
      <List sx={{ p: 2 }}>
        {routes.map((route) => {
          const isActive = pathname === route.path;
          return (
            <ListItem key={route.path} disablePadding sx={{ mb: 1 }}>
              <Link href={route.path} style={{ textDecoration: 'none', width: '100%' }}>
                <ListItemButton
                  sx={{
                    borderRadius: borderRadius.lg,
                    backgroundColor: isActive ? colors.pastel.blueLight : 'transparent',
                    border: isActive ? `2px solid ${colors.pastel.blue}` : '2px solid transparent',
                    '&:hover': {
                      backgroundColor: isActive ? colors.pastel.blueLight : colors.neutral[50],
                    },
                    py: 1.5,
                    px: 2,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isActive ? colors.pastel.blue : colors.neutral[600],
                    }}
                  >
                    {route.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={route.label}
                    primaryTypographyProps={{
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? colors.neutral[900] : colors.neutral[700],
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
