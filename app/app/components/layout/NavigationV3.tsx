'use client';

import { useState, useMemo, useCallback, memo, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  IconButton,
  Collapse,
  Badge,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
  Fade,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import RuleIcon from '@mui/icons-material/Rule';
import MapIcon from '@mui/icons-material/Map';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddTaskIcon from '@mui/icons-material/AddTask';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublicIcon from '@mui/icons-material/Public';
import HistoryIcon from '@mui/icons-material/History';
import HowToVoteIcon from '@mui/icons-material/HowToVote';

import LanguageSwitcher from './LanguageSwitcher';
import HeaderNotificationToggle from './HeaderNotificationToggle';
import { useUnreadTaskCount } from '@/app/hooks/useUnreadTaskCount';
import { useRecentPages } from '@/app/hooks/useRecentPages';
import { useLogout } from '@/app/hooks/useLogout';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export type NavigationV3Props = {
  role: 'SUPERADMIN' | 'AREA_MANAGER' | 'MANAGER' | 'SUPERVISOR';
  userEmail?: string;
  stats?: {
    pendingInvites?: number;
    activeWorkers?: number;
    activeSites?: number;
  };
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

type NavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

// ============================================
// PERFORMANCE OPTIMIZATION: Memoized Sub-Components
// ============================================

const NavItemComponent = memo(
  ({
    item,
    isActive,
    isRTL,
    closeDrawerOnClick,
    isSubItem = false,
    onNavigate,
  }: {
    item: NavItem;
    isActive: boolean;
    isRTL: boolean;
    closeDrawerOnClick?: () => void;
    isSubItem?: boolean;
    onNavigate?: (path: string) => void;
  }) => {
    const isTaskInbox = item.path === '/tasks/inbox';
    const hasUnreadTasks = isTaskInbox && item.badge && item.badge > 0;

    const handleClick = (e: React.MouseEvent) => {
      if (onNavigate) {
        e.preventDefault();
        onNavigate(item.path);
      }
      closeDrawerOnClick?.();
    };

    return (
      <ListItem disablePadding sx={{ mb: 0.5 }}>
        <Link
          href={item.path}
          prefetch={true}
          style={{ textDecoration: 'none', width: '100%' }}
          onClick={handleClick}
        >
          <ListItemButton
            data-testid={`nav-link-${item.path.replace('/', '')}`}
            sx={{
              borderRadius: borderRadius.md,
              backgroundColor: isActive ? `${colors.primary}10` : 'transparent',
              border: isActive ? `2px solid ${colors.primary}` : '2px solid transparent',
              direction: isRTL ? 'rtl' : 'ltr',
              py: 1.2,
              px: 2,
              ...(isSubItem && {
                px: 3,
                py: 1,
              }),
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: isActive ? `${colors.primary}15` : colors.neutral[50],
                transform: 'translateX(-2px)',
                boxShadow: shadows.soft,
              },
              '&:active': {
                transform: 'translateX(0)',
              },
            }}
          >
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: isSubItem ? '13px' : '14px',
                fontWeight: isActive ? 700 : 600,
                color: isActive ? colors.primary.main : colors.neutral[700],
                textAlign: isRTL ? 'right' : 'left',
              }}
            />
            <ListItemIcon
              sx={{
                minWidth: 'auto',
                color: isActive ? colors.primary.main : colors.neutral[600],
                marginLeft: isRTL ? 0 : 1.5,
                marginRight: isRTL ? 1.5 : 0,
              }}
            >
              {item.badge !== undefined && item.badge > 0 ? (
                <Tooltip
                  title={
                    isTaskInbox
                      ? `${item.badge} משימות חדשות`
                      : `${item.badge} פריטים פעילים`
                  }
                  arrow
                  placement="left"
                >
                  <Badge
                    badgeContent={item.badge}
                    color="error"
                    max={99}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '10px',
                        fontWeight: 700,
                        minWidth: '18px',
                        height: '18px',
                        transition: 'transform 0.2s ease',
                        ...(hasUnreadTasks && {
                          animation: 'badge-pulse 2s ease-in-out infinite',
                          boxShadow: `0 0 0 0 ${colors.error}`,
                        }),
                      },
                    }}
                  >
                    {item.icon}
                  </Badge>
                </Tooltip>
              ) : (
                item.icon
              )}
            </ListItemIcon>
          </ListItemButton>
        </Link>
      </ListItem>
    );
  }
);

NavItemComponent.displayName = 'NavItemComponent';

// ============================================
// Main Navigation Component (Memoized)
// ============================================

function NavigationV3Component({ role, userEmail, stats }: NavigationV3Props) {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const isRTL = locale === 'he';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 🚀 REACT 19: useTransition for smooth navigation
  const [isPending, startTransition] = useTransition();

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    primary: true,
    management: true,
    system: true,
    tasks: true,
    recent: true, // Recent pages section
  });

  // ============================================
  // PERFORMANCE OPTIMIZATION: Fetch unread count with proper caching
  // ============================================
  const { data: unreadData } = useUnreadTaskCount();
  const unreadCount = unreadData?.unread_count || 0;

  // ============================================
  // RECENT PAGES TRACKING
  // ============================================
  const { recentPages } = useRecentPages();

  // ============================================
  // CRITICAL: Secure logout that clears ALL caches
  // ============================================
  const { logout } = useLogout();

  // ============================================
  // PUSH NOTIFICATIONS: Check if supported
  // ============================================
  const { isSupported: isPushSupported } = usePushNotifications();

  // ============================================
  // PERFORMANCE OPTIMIZATION: Memoize callbacks
  // ============================================
  const handleDrawerToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleSectionToggle = useCallback((sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // ============================================
  // PERFORMANCE OPTIMIZATION: Memoize navigation groups
  // These only rebuild when translations or stats change
  // ============================================
  // Define section colors for visual hierarchy
  const sectionColors = {
    primary: '#2196F3',      // Blue
    tasks: '#FF9800',        // Orange
    management: '#9C27B0',   // Purple
    system: '#757575',       // Gray
  };

  const superAdminGroups = useMemo<NavGroup[]>(
    () => [
      {
        id: 'primary',
        label: t('groupPrimary'),
        items: [
          { path: '/dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
          { path: '/attendance', label: 'נוכחות', icon: <CheckCircleIcon /> },
          { path: '/map', label: t('map'), icon: <MapIcon /> },
        ],
      },
      {
        id: 'management',
        label: t('groupManagement'),
        items: [
          {
            path: '/tasks/inbox',
            label: t('taskInbox'),
            icon: <AssignmentIcon />,
            badge: unreadCount,
          },
          { path: '/tasks/new', label: t('newTask'), icon: <AddTaskIcon /> },
          { path: '/areas', label: t('areas'), icon: <PublicIcon /> },
          { path: '/cities', label: t('citys'), icon: <BusinessIcon /> },
          {
            path: '/neighborhoods',
            label: t('sites'),
            icon: <LocationOnIcon />,
            badge: stats?.activeSites,
          },
          {
            path: '/activists',
            label: t('workers'),
            icon: <GroupIcon />,
            badge: stats?.activeWorkers,
          },
          { path: '/voters', label: 'בוחרים', icon: <HowToVoteIcon /> },
          { path: '/users', label: t('users'), icon: <PeopleIcon /> },
        ],
      },
      {
        id: 'system',
        label: t('groupSystem'),
        items: [{ path: '/system-rules', label: t('systemRules'), icon: <RuleIcon /> }],
      },
    ],
    [t, stats?.activeSites, stats?.activeWorkers, unreadCount]
  );

  const areaManagerGroups = useMemo<NavGroup[]>(
    () => [
      {
        id: 'primary',
        label: t('groupPrimary'),
        items: [
          { path: '/dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
          { path: '/attendance', label: 'נוכחות', icon: <CheckCircleIcon /> },
          { path: '/map', label: t('map'), icon: <MapIcon /> },
        ],
      },
      {
        id: 'management',
        label: t('groupManagement'),
        items: [
          {
            path: '/tasks/inbox',
            label: t('taskInbox'),
            icon: <AssignmentIcon />,
            badge: unreadCount,
          },
          { path: '/tasks/new', label: t('newTask'), icon: <AddTaskIcon /> },
          { path: '/areas', label: t('areas'), icon: <PublicIcon /> },
          { path: '/cities', label: t('citys'), icon: <BusinessIcon /> },
          {
            path: '/neighborhoods',
            label: t('sites'),
            icon: <LocationOnIcon />,
            badge: stats?.activeSites,
          },
          {
            path: '/activists',
            label: t('workers'),
            icon: <GroupIcon />,
            badge: stats?.activeWorkers,
          },
          { path: '/voters', label: 'בוחרים', icon: <HowToVoteIcon /> },
          { path: '/users', label: t('users'), icon: <PeopleIcon /> },
        ],
      },
      {
        id: 'system',
        label: t('groupSystem'),
        items: [{ path: '/system-rules', label: t('systemRules'), icon: <RuleIcon /> }],
      },
    ],
    [t, stats?.activeSites, stats?.activeWorkers, unreadCount]
  );

  const managerItems = useMemo<NavItem[]>(
    () => [
      { path: '/dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
      { path: '/attendance', label: 'נוכחות', icon: <CheckCircleIcon /> },
      {
        path: '/tasks/inbox',
        label: t('taskInbox'),
        icon: <AssignmentIcon />,
        badge: unreadCount,
      },
      { path: '/tasks/new', label: t('newTask'), icon: <AddTaskIcon /> },
      {
        path: '/neighborhoods',
        label: t('sites'),
        icon: <LocationOnIcon />,
        badge: stats?.activeSites,
      },
      {
        path: '/activists',
        label: t('workers'),
        icon: <GroupIcon />,
        badge: stats?.activeWorkers,
      },
      { path: '/voters', label: 'בוחרים', icon: <HowToVoteIcon /> },
      { path: '/users', label: t('users'), icon: <PeopleIcon /> },
    ],
    [t, stats?.activeSites, stats?.activeWorkers, unreadCount]
  );

  const supervisorItems = useMemo<NavItem[]>(
    () => [
      { path: '/dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
      { path: '/attendance', label: 'נוכחות', icon: <CheckCircleIcon /> },
      {
        path: '/tasks/inbox',
        label: t('taskInbox'),
        icon: <AssignmentIcon />,
        badge: unreadCount,
      },
      { path: '/tasks/new', label: t('newTask'), icon: <AddTaskIcon /> },
      {
        path: '/neighborhoods',
        label: t('sites'),
        icon: <LocationOnIcon />,
        badge: stats?.activeSites,
      },
      {
        path: '/activists',
        label: t('workers'),
        icon: <GroupIcon />,
        badge: stats?.activeWorkers,
      },
      { path: '/voters', label: 'בוחרים', icon: <HowToVoteIcon /> },
      { path: '/users', label: t('users'), icon: <PeopleIcon /> },
    ],
    [t, stats?.activeSites, stats?.activeWorkers, unreadCount]
  );

  // Remove locale from pathname for comparison
  const currentPath = pathname.replace(/^\/(he|en)/, '') || '/';

  // ============================================
  // REACT 19: Smooth navigation with transitions
  // ============================================
  const handleNavigate = useCallback(
    (path: string) => {
      startTransition(() => {
        router.push(`/${locale}${path}`);
      });
    },
    [router, locale]
  );

  // ============================================
  // PERFORMANCE OPTIMIZATION: Memoize render functions
  // ============================================
  const renderNavItem = useCallback(
    (item: NavItem, closeDrawerOnClick = false, isSubItem = false) => {
      const isActive = currentPath === item.path;
      return (
        <NavItemComponent
          key={item.path}
          item={item}
          isActive={isActive}
          isRTL={isRTL}
          closeDrawerOnClick={closeDrawerOnClick ? () => setMobileOpen(false) : undefined}
          isSubItem={isSubItem}
          onNavigate={handleNavigate}
        />
      );
    },
    [currentPath, isRTL, handleNavigate]
  );

  const renderGroupedNav = useCallback(
    (groups: NavGroup[], closeDrawerOnClick = false) => (
      <>
        {groups.map((group, groupIndex) => (
          <Box key={group.id} sx={{ mb: 2 }}>
            {/* Section Header with Color Coding */}
            <Box
              onClick={() => handleSectionToggle(group.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
                cursor: 'pointer',
                borderRadius: borderRadius.md,
                direction: isRTL ? 'rtl' : 'ltr',
                transition: 'all 0.2s ease',
                borderRight: isRTL ? `4px solid ${sectionColors[group.id as keyof typeof sectionColors] || colors.neutral[300]}` : 'none',
                borderLeft: isRTL ? 'none' : `4px solid ${sectionColors[group.id as keyof typeof sectionColors] || colors.neutral[300]}`,
                backgroundColor: `${sectionColors[group.id as keyof typeof sectionColors] || colors.neutral[300]}08`,
                position: 'relative',
                zIndex: 1,
                pointerEvents: 'auto',
                mb: 1,
                '&:hover': {
                  backgroundColor: `${sectionColors[group.id as keyof typeof sectionColors] || colors.neutral[300]}12`,
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: sectionColors[group.id as keyof typeof sectionColors] || colors.neutral[700],
                  textAlign: isRTL ? 'right' : 'left',
                  pointerEvents: 'none',
                  opacity: 0.95,
                }}
              >
                {group.label}
              </Typography>
              <IconButton size="small" sx={{ p: 0, pointerEvents: 'none' }}>
                <ExpandMoreIcon
                  fontSize="small"
                  sx={{
                    color: colors.neutral[400],
                    transform: expandedSections[group.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </IconButton>
            </Box>

            {/* Section Items */}
            <Collapse in={expandedSections[group.id]} timeout="auto">
              <List sx={{ pt: 1, position: 'relative', zIndex: 2 }}>
                {group.items.map((item) => renderNavItem(item, closeDrawerOnClick))}
              </List>
            </Collapse>

            {/* Divider between groups */}
            {groupIndex < groups.length - 1 && (
              <Divider sx={{ my: 2, borderColor: colors.neutral[100] }} />
            )}
          </Box>
        ))}
      </>
    ),
    [isRTL, expandedSections, renderNavItem, handleSectionToggle, sectionColors]
  );

  const renderFlatNav = useCallback(
    (items: NavItem[], closeDrawerOnClick = false) => {
      return (
        <List sx={{ py: 1 }}>
          {items.map((item) => renderNavItem(item, closeDrawerOnClick))}
        </List>
      );
    },
    [renderNavItem]
  );

  // ============================================
  // PERFORMANCE OPTIMIZATION: Memoize drawer content
  // ============================================
  const drawerContent = useMemo(
    () => (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: colors.neutral[0],
          direction: isRTL ? 'rtl' : 'ltr',
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
                width: 44,
                height: 44,
                borderRadius: borderRadius.lg,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: shadows.medium,
              }}
            >
              <Image
                src="/logo.png"
                alt="מערכת ניהול"
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: '16px',
                  color: colors.neutral[900],
                  lineHeight: 1.2,
                }}
              >
                מערכת ניהול
              </Typography>
              <Typography
                sx={{
                  fontSize: '12px',
                  color: colors.neutral[500],
                  fontWeight: 500,
                }}
              >
                {role === 'SUPERADMIN'
                  ? 'מנהל על'
                  : role === 'AREA_MANAGER'
                  ? 'מנהל מחוז'
                  : role === 'MANAGER'
                  ? 'מנהל'
                  : role === 'SUPERVISOR'
                  ? 'רכז שכונתי'
                  : role}
              </Typography>
              {userEmail && (
                <Typography
                  sx={{
                    fontSize: '11px',
                    color: colors.neutral[400],
                    fontWeight: 400,
                    mt: 0.5,
                  }}
                >
                  {userEmail}
                </Typography>
              )}
            </Box>

            {/* Close button for mobile */}
            {isMobile && (
              <IconButton
                onClick={handleDrawerToggle}
                sx={{
                  marginLeft: isRTL ? 0 : 'auto',
                  marginRight: isRTL ? 'auto' : 0,
                  color: colors.neutral[600],
                }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Notification Controls - Only show if push notifications are supported */}
        {isPushSupported && (
          <Box
            sx={{
              px: 2,
              py: 2,
              borderBottom: `1px solid ${colors.neutral[200]}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {/* Notification Toggle */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: 'space-between',
                px: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: colors.neutral[600],
                  fontWeight: 600,
                }}
              >
                התראות דחיפה
              </Typography>
              <HeaderNotificationToggle />
            </Box>
          </Box>
        )}

        {/* Language Switcher */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${colors.neutral[100]}` }}>
          <LanguageSwitcher />
        </Box>

        {/* Recent Pages - Redesigned with 2025 Best Practices */}
        {recentPages.length > 0 && (
          <Box sx={{ px: 2, py: 2.5, borderBottom: `1px solid ${colors.neutral[100]}` }}>
            {/* Card Container with distinct background */}
            <Box
              sx={{
                backgroundColor: colors.neutral[50],
                borderRadius: borderRadius.lg,
                border: `1px solid ${colors.neutral[200]}`,
                overflow: 'hidden',
              }}
            >
              {/* Prominent Section Header */}
              <Box
                onClick={() => handleSectionToggle('recent')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  backgroundColor: colors.neutral[100],
                  borderBottom: `1px solid ${colors.neutral[200]}`,
                  direction: isRTL ? 'rtl' : 'ltr',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: colors.neutral[100],
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: borderRadius.sm,
                      backgroundColor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: shadows.soft,
                    }}
                  >
                    <HistoryIcon
                      sx={{ fontSize: '16px', color: colors.neutral[600] }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.neutral[800],
                        fontWeight: 700,
                        fontSize: '12px',
                        display: 'block',
                        lineHeight: 1.2,
                      }}
                    >
                      עמודים אחרונים
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.neutral[500],
                        fontSize: '10px',
                        fontWeight: 500,
                      }}
                    >
                      {recentPages.length} ביקורים אחרונים
                    </Typography>
                  </Box>
                </Box>
                <IconButton size="small" sx={{ p: 0 }}>
                  <ExpandMoreIcon
                    fontSize="small"
                    sx={{
                      color: colors.neutral[400],
                      transform: expandedSections['recent'] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </IconButton>
              </Box>

              {/* Collapsible Recent Pages List */}
              <Collapse in={expandedSections['recent']} timeout="auto">
                <List sx={{ p: 1.5, pt: 1 }}>
                  {recentPages.slice(0, 5).map((page, index) => (
                    <ListItem key={page.path} disablePadding sx={{ mb: 0.5 }}>
                      <Link
                        href={`/${locale}${page.path}`}
                        style={{ textDecoration: 'none', width: '100%' }}
                        onClick={isMobile ? handleDrawerToggle : undefined}
                      >
                        <ListItemButton
                          sx={{
                            borderRadius: borderRadius.md,
                            py: 1,
                            px: 1.5,
                            backgroundColor: '#fff',
                            border: `1px solid ${colors.neutral[200]}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#fff',
                              borderColor: colors.primary,
                              transform: 'translateX(-2px)',
                              boxShadow: shadows.soft,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              backgroundColor: colors.neutral[100],
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginLeft: isRTL ? 0 : 1,
                              marginRight: isRTL ? 1 : 0,
                              flexShrink: 0,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: colors.neutral[600],
                              }}
                            >
                              {index + 1}
                            </Typography>
                          </Box>
                          <ListItemText
                            primary={page.label}
                            primaryTypographyProps={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: colors.neutral[700],
                              textAlign: isRTL ? 'right' : 'left',
                              noWrap: true,
                            }}
                          />
                          <HistoryIcon
                            sx={{
                              fontSize: '14px',
                              color: colors.neutral[300],
                              marginLeft: isRTL ? 0 : 1,
                              marginRight: isRTL ? 1 : 0,
                              flexShrink: 0,
                            }}
                          />
                        </ListItemButton>
                      </Link>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          </Box>
        )}

        {/* Navigation Links */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}>
          {role === 'SUPERADMIN' && renderGroupedNav(superAdminGroups, isMobile)}
          {role === 'AREA_MANAGER' && renderGroupedNav(areaManagerGroups, isMobile)}
          {role === 'MANAGER' && renderFlatNav(managerItems, isMobile)}
          {role === 'SUPERVISOR' && renderFlatNav(supervisorItems, isMobile)}
        </Box>

        {/* Logout Button */}
        <Box sx={{ p: 2, borderTop: `1px solid ${colors.neutral[200]}` }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: borderRadius.md,
              backgroundColor: 'transparent',
              border: `2px solid transparent`,
              direction: isRTL ? 'rtl' : 'ltr',
              py: 1.2,
              px: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: `${colors.error}10`,
                borderColor: colors.error,
                transform: 'translateX(-2px)',
              },
              '&:active': {
                transform: 'translateX(0)',
              },
            }}
          >
            <ListItemText
              primary={tCommon('signOut')}
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: 600,
                color: colors.error,
                textAlign: isRTL ? 'right' : 'left',
              }}
            />
            <ListItemIcon
              sx={{
                minWidth: 'auto',
                color: colors.error,
                marginLeft: isRTL ? 0 : 1.5,
                marginRight: isRTL ? 1.5 : 0,
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
          </ListItemButton>
        </Box>
      </Box>
    ),
    [
      isRTL,
      role,
      userEmail,
      isMobile,
      locale,
      sectionColors,
      recentPages,
      handleDrawerToggle,
      renderGroupedNav,
      superAdminGroups,
      areaManagerGroups,
      renderFlatNav,
      managerItems,
      supervisorItems,
      handleLogout,
      tCommon,
      isPushSupported,
    ]
  );

  return (
    <>
      {/* Global CSS for badge pulse animation */}
      <style jsx global>{`
        @keyframes badge-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(244, 67, 54, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
          }
        }
      `}</style>

      {/* 🚀 REACT 19: Navigation Loading Indicator */}
      {isPending && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
          }}
        >
          <LinearProgress color="primary" />
        </Box>
      )}

      {/* Mobile Hamburger Button */}
      {isMobile && (
        <Fade in>
          <Box
            sx={{
              position: 'fixed',
              top: 16,
              [isRTL ? 'right' : 'left']: 16,
              zIndex: 1300,
            }}
          >
            <IconButton
              onClick={handleDrawerToggle}
              sx={{
                backgroundColor: colors.primary,
                color: '#fff',
                boxShadow: shadows.large,
                '&:hover': {
                  backgroundColor: colors.primary,
                  filter: 'brightness(0.95)',
                  transform: 'scale(1.05)',
                },
                width: 48,
                height: 48,
                transition: 'all 0.2s ease',
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Fade>
      )}

      {/* Mobile Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          anchor={isRTL ? 'right' : 'left'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        // Desktop Sidebar
        <Box
          component="nav"
          data-testid="navigation-sidebar"
          sx={{
            width: 280,
            height: '100vh',
            position: 'fixed',
            top: 0,
            [isRTL ? 'right' : 'left']: 0,
            overflowY: 'auto',
            boxShadow: shadows.soft,
            zIndex: 1100,
            borderRight: isRTL ? 'none' : `1px solid ${colors.neutral[200]}`,
            borderLeft: isRTL ? `1px solid ${colors.neutral[200]}` : 'none',
          }}
        >
          {drawerContent}
        </Box>
      )}
    </>
  );
}

// ============================================
// PERFORMANCE OPTIMIZATION: Export memoized component
// Prevents unnecessary re-renders when props don't change
// ============================================
export default memo(NavigationV3Component, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if these change
  return (
    prevProps.role === nextProps.role &&
    prevProps.userEmail === nextProps.userEmail &&
    prevProps.stats?.pendingInvites === nextProps.stats?.pendingInvites &&
    prevProps.stats?.activeWorkers === nextProps.stats?.activeWorkers &&
    prevProps.stats?.activeSites === nextProps.stats?.activeSites
  );
});
