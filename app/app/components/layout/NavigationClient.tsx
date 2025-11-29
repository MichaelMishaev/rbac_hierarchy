'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import MailIcon from '@mui/icons-material/Mail';
import LogoutIcon from '@mui/icons-material/Logout';
import LanguageSwitcher from './LanguageSwitcher';
import { signOut } from 'next-auth/react';

export type NavigationClientProps = {
  role: 'SUPERADMIN' | 'MANAGER' | 'SUPERVISOR';
};

export default function NavigationClient({ role }: NavigationClientProps) {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const isRTL = locale === 'he';

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  const superAdminRoutes = [
    { path: '/dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
    { path: '/corporations', label: t('corporations'), icon: <BusinessIcon /> },
    { path: '/users', label: t('users'), icon: <PeopleIcon /> },
    { path: '/sites', label: t('sites'), icon: <LocationOnIcon /> },
    { path: '/workers', label: t('workers'), icon: <GroupIcon /> },
    { path: '/invitations', label: t('invitations'), icon: <MailIcon /> },
  ];

  const managerRoutes = [
    { path: '/dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
    { path: '/sites', label: t('sites'), icon: <LocationOnIcon /> },
    { path: '/workers', label: t('workers'), icon: <GroupIcon /> },
    { path: '/users', label: t('users'), icon: <PeopleIcon /> },
  ];

  const supervisorRoutes = [
    { path: '/dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
    { path: '/workers', label: t('workers'), icon: <GroupIcon /> },
  ];

  const routes =
    role === 'SUPERADMIN'
      ? superAdminRoutes
      : role === 'MANAGER'
      ? managerRoutes
      : supervisorRoutes;

  // Remove locale from pathname for comparison
  const currentPath = pathname.replace(/^\/(he|en)/, '') || '/';

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 260 },
        height: { xs: 'auto', md: '100vh' },
        background: colors.neutral[0],
        borderRight: { md: isRTL ? 'none' : `1px solid ${colors.neutral[200]}` },
        borderLeft: { md: isRTL ? `1px solid ${colors.neutral[200]}` : 'none' },
        borderBottom: { xs: `1px solid ${colors.neutral[200]}`, md: 'none' },
        position: { xs: 'sticky', md: 'fixed' },
        top: 0,
        left: isRTL ? 'auto' : 0,
        right: isRTL ? 0 : 'auto',
        overflowY: 'auto',
        boxShadow: shadows.soft,
        zIndex: 10,
        direction: isRTL ? 'rtl' : 'ltr',
        display: 'flex',
        flexDirection: 'column',
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
            direction: isRTL ? 'rtl' : 'ltr',
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
            ת
          </Box>
          <Box>
            <Box
              sx={{
                fontWeight: 700,
                fontSize: '16px',
                color: colors.neutral[900],
              }}
            >
              תאגידים
            </Box>
            <Box
              sx={{
                fontSize: '12px',
                color: colors.neutral[500],
              }}
            >
              {role === 'SUPERADMIN' ? 'מנהל על' :
               role === 'MANAGER' ? 'מנהל' :
               role === 'SUPERVISOR' ? 'מפקח' : role}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Language Switcher */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${colors.neutral[200]}` }}>
        <LanguageSwitcher />
      </Box>

      {/* Navigation Links */}
      <List sx={{ p: 2, flex: 1 }}>
        {routes.map((route) => {
          const isActive = currentPath === route.path;
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
                    direction: isRTL ? 'rtl' : 'ltr',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isActive ? colors.pastel.blue : colors.neutral[600],
                      marginLeft: isRTL ? 2 : 0,
                      marginRight: isRTL ? 0 : 2,
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
                      textAlign: isRTL ? 'right' : 'left',
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
          );
        })}
      </List>

      {/* Logout Button */}
      <Box sx={{ p: 2, borderTop: `1px solid ${colors.neutral[200]}` }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: borderRadius.lg,
            backgroundColor: 'transparent',
            border: '2px solid transparent',
            '&:hover': {
              backgroundColor: colors.pastel.redLight || colors.neutral[100],
              borderColor: colors.pastel.red || colors.error,
            },
            py: 1.5,
            px: 2,
            direction: isRTL ? 'rtl' : 'ltr',
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 40,
              color: colors.error,
              marginLeft: isRTL ? 2 : 0,
              marginRight: isRTL ? 0 : 2,
            }}
          >
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary={tCommon('signOut')}
            primaryTypographyProps={{
              fontSize: '14px',
              fontWeight: 500,
              color: colors.error,
              textAlign: isRTL ? 'right' : 'left',
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );
}
