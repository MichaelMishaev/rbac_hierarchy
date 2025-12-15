'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Typography,
} from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import MailIcon from '@mui/icons-material/Mail';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import LanguageSwitcher from './LanguageSwitcher';
import { signOut } from 'next-auth/react';

export type NavigationClientV2Props = {
  role: 'SUPERADMIN' | 'MANAGER' | 'SUPERVISOR';
  stats?: {
    corporations?: number;
    managers?: number;
    supervisors?: number;
    sites?: number;
    activeSites?: number;
    workers?: number;
    activeWorkers?: number;
    pendingInvites?: number;
  };
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

type NavigationItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

export default function NavigationClientV2({ role, stats = {} }: NavigationClientV2Props) {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const isRTL = locale === 'he';

  const handleLogout = () => {
    signOut({ callbackUrl: `/${locale}/login` });
  };

  // Navigation structure for SuperAdmin
  const superAdminNavigation: NavigationGroup[] = [
    {
      label: t('groupPrimary'),
      items: [
        {
          path: `/${locale}/dashboard`,
          label: t('dashboard'),
          icon: <DashboardIcon />,
        },
        {
          path: `/${locale}/cities`,
          label: t('corporations'),
          icon: <BusinessIcon />,
          badge: stats.corporations,
        },
      ],
    },
    {
      label: t('groupManagement'),
      items: [
        {
          path: `/${locale}/managers`,
          label: t('managers'),
          icon: <PeopleIcon />,
          badge: stats.managers,
        },
        {
          path: `/${locale}/supervisors`,
          label: t('supervisors'),
          icon: <SupervisorAccountIcon />,
          badge: stats.supervisors,
        },
        {
          path: `/${locale}/neighborhoods`,
          label: t('sites'),
          icon: <LocationOnIcon />,
          badge: stats.activeSites,
        },
        {
          path: `/${locale}/activists`,
          label: t('workers'),
          icon: <GroupIcon />,
          badge: stats.activeWorkers,
        },
      ],
    },
    {
      label: t('groupSystem'),
      items: [
        {
          path: `/${locale}/invitations`,
          label: t('invitations'),
          icon: <MailIcon />,
          badge: stats.pendingInvites,
        },
      ],
    },
  ];

  // Navigation structure for Manager
  const managerNavigation: NavigationGroup[] = [
    {
      label: t('groupPrimary'),
      items: [
        {
          path: `/${locale}/dashboard`,
          label: t('dashboard'),
          icon: <DashboardIcon />,
        },
      ],
    },
    {
      label: t('groupManagement'),
      items: [
        {
          path: `/${locale}/supervisors`,
          label: t('supervisors'),
          icon: <SupervisorAccountIcon />,
          badge: stats.supervisors,
        },
        {
          path: `/${locale}/neighborhoods`,
          label: t('sites'),
          icon: <LocationOnIcon />,
          badge: stats.activeSites,
        },
        {
          path: `/${locale}/activists`,
          label: t('workers'),
          icon: <GroupIcon />,
          badge: stats.activeWorkers,
        },
      ],
    },
  ];

  // Navigation structure for Supervisor
  const supervisorNavigation: NavigationGroup[] = [
    {
      label: t('groupPrimary'),
      items: [
        {
          path: `/${locale}/dashboard`,
          label: t('dashboard'),
          icon: <DashboardIcon />,
        },
        {
          path: `/${locale}/activists`,
          label: t('workers'),
          icon: <GroupIcon />,
          badge: stats.activeWorkers,
        },
      ],
    },
  ];

  const navigationGroups =
    role === 'SUPERADMIN'
      ? superAdminNavigation
      : role === 'MANAGER'
      ? managerNavigation
      : supervisorNavigation;

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
              {role === 'SUPERADMIN'
                ? 'מנהל על'
                : role === 'MANAGER'
                ? 'מנהל'
                : role === 'SUPERVISOR'
                ? 'רכז שכונתי'
                : role}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Language Switcher */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${colors.neutral[200]}` }}>
        <LanguageSwitcher />
      </Box>

      {/* Grouped Navigation Links */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {navigationGroups.map((group, groupIndex) => (
          <Box key={groupIndex}>
            {/* Group Label */}
            <Typography
              variant="caption"
              sx={{
                px: 2,
                pt: groupIndex === 0 ? 2 : 3,
                pb: 1,
                display: 'block',
                fontWeight: 600,
                color: colors.neutral[500],
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                letterSpacing: '0.5px',
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              {group.label}
            </Typography>

            {/* Group Items */}
            <List sx={{ px: 2, pb: 0 }}>
              {group.items.map((item) => {
                const isActive = currentPath === item.path.replace(/^\/(he|en)/, '');
                return (
                  <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                    <Link href={item.path} style={{ textDecoration: 'none', width: '100%' }}>
                      <ListItemButton
                        sx={{
                          borderRadius: borderRadius.lg,
                          backgroundColor: isActive ? colors.pastel.blueLight : 'transparent',
                          border: isActive
                            ? `2px solid ${colors.pastel.blue}`
                            : '2px solid transparent',
                          '&:hover': {
                            backgroundColor: isActive
                              ? colors.pastel.blueLight
                              : colors.neutral[50],
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
                          {item.badge !== undefined && item.badge > 0 ? (
                            <Badge
                              badgeContent={item.badge}
                              color="error"
                              sx={{
                                '& .MuiBadge-badge': {
                                  fontSize: '0.6rem',
                                  height: 16,
                                  minWidth: 16,
                                  padding: '0 4px',
                                },
                              }}
                            >
                              {item.icon}
                            </Badge>
                          ) : (
                            item.icon
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
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

            {/* Divider between groups (except last) */}
            {groupIndex < navigationGroups.length - 1 && (
              <Divider sx={{ mx: 2, borderColor: colors.neutral[200] }} />
            )}
          </Box>
        ))}
      </Box>

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
