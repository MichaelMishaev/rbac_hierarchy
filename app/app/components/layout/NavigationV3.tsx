'use client';

import { useState, useMemo, useCallback, memo } from 'react';
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
  Chip,
} from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import MailIcon from '@mui/icons-material/Mail';
import LogoutIcon from '@mui/icons-material/Logout';
import RuleIcon from '@mui/icons-material/Rule';
import MapIcon from '@mui/icons-material/Map';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddTaskIcon from '@mui/icons-material/AddTask';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublicIcon from '@mui/icons-material/Public';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';

import LanguageSwitcher from './LanguageSwitcher';
import { signOut } from 'next-auth/react';
import { useUnreadTaskCount } from '@/app/hooks/useUnreadTaskCount';
import { useRecentPages } from '@/app/hooks/useRecentPages';

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
  }: {
    item: NavItem;
    isActive: boolean;
    isRTL: boolean;
    closeDrawerOnClick?: () => void;
    isSubItem?: boolean;
  }) => {
    const isTaskInbox = item.path === '/tasks/inbox';
    const hasUnreadTasks = isTaskInbox && item.badge && item.badge > 0;

    return (
      <ListItem disablePadding sx={{ mb: 0.5 }}>
        <Link
          href={item.path}
          prefetch={true}
          style={{ textDecoration: 'none', width: '100%' }}
          onClick={closeDrawerOnClick}
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
  const isRTL = locale === 'he';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Mobile drawer state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    primary: true,
    management: true,
    system: true,
    tasks: true,
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
    signOut({ callbackUrl: '/login' });
  }, []);

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
          { path: '/users', label: t('users'), icon: <PeopleIcon /> },
        ],
      },
      {
        id: 'system',
        label: t('groupSystem'),
        items: [{ path: '/system-rules', label: t('systemRules'), icon: <RuleIcon /> }],
      },
    ],
    [t, stats?.activeSites, stats?.activeWorkers]
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
          { path: '/users', label: t('users'), icon: <PeopleIcon /> },
        ],
      },
      {
        id: 'system',
        label: t('groupSystem'),
        items: [{ path: '/system-rules', label: t('systemRules'), icon: <RuleIcon /> }],
      },
    ],
    [t, stats?.activeSites, stats?.activeWorkers]
  );

  const tasksSubmenu = useMemo<NavItem[]>(
    () => [
      {
        path: '/tasks/inbox',
        label: t('taskInbox'),
        icon: <AssignmentIcon />,
        badge: unreadCount,
      },
      { path: '/tasks/new', label: t('newTask'), icon: <AddTaskIcon /> },
    ],
    [t, unreadCount]
  );

  const managerItems = useMemo<NavItem[]>(
    () => [
      { path: '/dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
      { path: '/attendance', label: 'נוכחות', icon: <CheckCircleIcon /> },
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
      { path: '/users', label: t('users'), icon: <PeopleIcon /> },
    ],
    [t, stats?.activeSites, stats?.activeWorkers]
  );

  const supervisorItems = useMemo<NavItem[]>(
    () => [
      { path: '/dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
      { path: '/attendance', label: 'נוכחות', icon: <CheckCircleIcon /> },
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
      { path: '/users', label: t('users'), icon: <PeopleIcon /> },
    ],
    [t, stats?.activeSites, stats?.activeWorkers]
  );

  // Remove locale from pathname for comparison
  const currentPath = pathname.replace(/^\/(he|en)/, '') || '/';

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
        />
      );
    },
    [currentPath, isRTL]
  );

  const renderTasksSubmenu = useCallback(
    (closeDrawerOnClick = false) => {
      const hasTasksActive = currentPath.startsWith('/tasks');
      const totalTaskBadges = unreadCount;

      return (
        <Box sx={{ mb: 1 }}>
          {/* Parent Tasks Button with Color Coding - Styled like other group headers */}
          <Box
            onClick={() => handleSectionToggle('tasks')}
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
              borderRight: isRTL ? `4px solid ${sectionColors.tasks}` : 'none',
              borderLeft: isRTL ? 'none' : `4px solid ${sectionColors.tasks}`,
              backgroundColor: `${sectionColors.tasks}08`,
              position: 'relative',
              zIndex: 1,
              pointerEvents: 'auto',
              mb: 1,
              '&:hover': {
                backgroundColor: `${sectionColors.tasks}12`,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: sectionColors.tasks,
                  textAlign: isRTL ? 'right' : 'left',
                  pointerEvents: 'none',
                  opacity: 0.95,
                }}
              >
                משימות
              </Typography>
              {totalTaskBadges > 0 && (
                <Tooltip title={`${totalTaskBadges} משימות חדשות`} arrow placement="left">
                  <Badge
                    badgeContent={totalTaskBadges}
                    color="error"
                    max={99}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '9px',
                        fontWeight: 700,
                        height: '16px',
                        minWidth: '16px',
                      },
                    }}
                  />
                </Tooltip>
              )}
            </Box>
            <IconButton size="small" sx={{ p: 0, pointerEvents: 'none' }}>
              <ExpandMoreIcon
                fontSize="small"
                sx={{
                  color: colors.neutral[400],
                  transform: expandedSections['tasks'] ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </IconButton>
          </Box>

          {/* Submenu Items */}
          <Collapse in={expandedSections['tasks']} timeout="auto">
            <List sx={{ pt: 0.5, pb: 0 }}>
              {tasksSubmenu.map((item) => renderNavItem(item, closeDrawerOnClick, true))}

              {/* Empty State when no unread tasks */}
              {unreadCount === 0 && (
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    mx: 1,
                    mt: 0.5,
                    textAlign: 'center',
                    backgroundColor: colors.neutral[50],
                    borderRadius: borderRadius.md,
                  }}
                >
                  <CheckCircleIcon
                    sx={{
                      fontSize: 32,
                      color: colors.success,
                      opacity: 0.4,
                      mb: 0.5,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: colors.neutral[500],
                      display: 'block',
                      fontSize: '11px',
                    }}
                  >
                    כל המשימות טופלו ✓
                  </Typography>
                </Box>
              )}
            </List>
          </Collapse>
        </Box>
      );
    },
    [currentPath, unreadCount, isRTL, expandedSections, tasksSubmenu, renderNavItem, handleSectionToggle, sectionColors]
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

            {/* Insert Tasks submenu AFTER primary section */}
            {group.id === 'primary' && (
              <>
                <Divider sx={{ my: 2, borderColor: colors.neutral[100] }} />
                <Box sx={{ mb: 0, px: 0 }}>{renderTasksSubmenu(closeDrawerOnClick)}</Box>
              </>
            )}

            {/* Divider between groups (except after primary since tasks has divider) */}
            {groupIndex < groups.length - 1 && group.id !== 'primary' && (
              <Divider sx={{ my: 2, borderColor: colors.neutral[100] }} />
            )}
          </Box>
        ))}
      </>
    ),
    [renderTasksSubmenu, isRTL, expandedSections, renderNavItem, handleSectionToggle, sectionColors]
  );

  const renderFlatNav = useCallback(
    (items: NavItem[], closeDrawerOnClick = false) => {
      // Find index of map or attendance item to insert tasks after it
      const mapIndex = items.findIndex((item) => item.path === '/map');
      const attendanceIndex = items.findIndex((item) => item.path === '/attendance');
      const insertAfterIndex = mapIndex >= 0 ? mapIndex : attendanceIndex;
      const shouldInsertTasks = insertAfterIndex >= 0;

      return (
        <List sx={{ py: 1 }}>
          {/* Render items up to and including map/attendance */}
          {items.slice(0, shouldInsertTasks ? insertAfterIndex + 1 : items.length).map((item) =>
            renderNavItem(item, closeDrawerOnClick)
          )}

          {/* Tasks submenu after map/attendance */}
          {shouldInsertTasks && (
            <>
              <Divider sx={{ my: 2, borderColor: colors.neutral[100] }} />
              {renderTasksSubmenu(closeDrawerOnClick)}
              <Divider sx={{ my: 2, borderColor: colors.neutral[100] }} />
            </>
          )}

          {/* Render remaining items after map/attendance */}
          {shouldInsertTasks &&
            items.slice(insertAfterIndex + 1).map((item) => renderNavItem(item, closeDrawerOnClick))}

          {/* If no map/attendance item exists, render tasks at the top (fallback) */}
          {!shouldInsertTasks && renderTasksSubmenu(closeDrawerOnClick)}
        </List>
      );
    },
    [renderTasksSubmenu, renderNavItem]
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
                background: `linear-gradient(135deg, ${colors.primary} 0%, #1565c0 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '20px',
                boxShadow: shadows.medium,
              }}
            >
              <BusinessIcon sx={{ fontSize: '24px' }} />
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

        {/* Language Switcher */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${colors.neutral[100]}` }}>
          <LanguageSwitcher />
        </Box>

        {/* Recent Pages */}
        {recentPages.length > 0 && (
          <Box sx={{ px: 2, py: 2, borderBottom: `1px solid ${colors.neutral[100]}` }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <HistoryIcon
                  sx={{ fontSize: '14px', color: colors.neutral[500] }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.neutral[500],
                    fontWeight: 700,
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  אחרונים
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: colors.neutral[400],
                  fontSize: '10px',
                }}
              >
                {recentPages.length} עמודים
              </Typography>
            </Box>
            <List sx={{ p: 0 }}>
              {recentPages.slice(0, 5).map((page) => (
                <ListItem key={page.path} disablePadding sx={{ mb: 0.5 }}>
                  <Link
                    href={`/${locale}${page.path}`}
                    style={{ textDecoration: 'none', width: '100%' }}
                    onClick={isMobile ? handleDrawerToggle : undefined}
                  >
                    <ListItemButton
                      sx={{
                        borderRadius: borderRadius.sm,
                        py: 0.8,
                        px: 1.5,
                        backgroundColor: 'transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: colors.neutral[50],
                          transform: 'translateX(-2px)',
                        },
                      }}
                    >
                      <ListItemText
                        primary={page.label}
                        primaryTypographyProps={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: colors.neutral[700],
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                      />
                      <HistoryIcon
                        sx={{
                          fontSize: '14px',
                          color: colors.neutral[400],
                          marginLeft: isRTL ? 0 : 1,
                          marginRight: isRTL ? 1 : 0,
                        }}
                      />
                    </ListItemButton>
                  </Link>
                </ListItem>
              ))}
            </List>
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
