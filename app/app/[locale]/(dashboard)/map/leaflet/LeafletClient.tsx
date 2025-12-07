'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar,
  Collapse,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  SupervisorAccount as ManagerIcon,
  SupervisorAccount,
  Person as PersonIcon,
  ExpandLess,
  ExpandMore,
  Map as MapIcon,
} from '@mui/icons-material';
import { colors } from '@/lib/design-system';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet to avoid SSR issues
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <CircularProgress />
    </Box>
  ),
});

interface MapData {
  sites: any[];
  corporations: any[];
  areaManagers: any[];
  managers: any[];
  supervisors: any[];
  stats: any;
  user: any;
}

export default function LeafletClient() {
  const [data, setData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    corporations: true,
    managers: false,
    supervisors: false,
    areaManagers: false,
  });

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/map-data', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch map data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  const sitesWithGPS = data.sites.filter((s) => s.latitude && s.longitude);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100%', position: 'relative' }}>
      {/* Top Stats Bar - Modern 2025 Card Design */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: sidebarOpen ? '400px' : '0',
          right: 0,
          zIndex: 1100,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${colors.neutral[200]}`,
          px: { xs: 2, sm: 3, md: 4 },
          py: 2.5,
          transition: 'left 0.3s ease',
          direction: 'rtl',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(5, 1fr)',
            },
            gap: { xs: 1.5, sm: 2, md: 2.5 },
            maxWidth: '100%',
          }}
        >
          {/* Active Sites */}
          <Box
            sx={{
              background: colors.neutral[50],
              borderRadius: '12px',
              p: { xs: 1.5, sm: 2 },
              border: `1px solid ${colors.neutral[200]}`,
              transition: 'all 0.2s ease',
              cursor: 'default',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 16px ${colors.neutral[300]}`,
                borderColor: colors.primary,
              },
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <MapIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: colors.primary, opacity: 0.7 }} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: '11px', sm: '12px' },
                  color: colors.neutral[600],
                  fontWeight: 500,
                }}
              >
                אתרים פעילים
              </Typography>
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '24px', sm: '28px', md: '32px' },
                fontWeight: 700,
                color: colors.neutral[900],
                lineHeight: 1,
              }}
            >
              {data.stats.activeSites}
            </Typography>
          </Box>

          {/* Active Workers */}
          <Box
            sx={{
              background: colors.neutral[50],
              borderRadius: '12px',
              p: { xs: 1.5, sm: 2 },
              border: `1px solid ${colors.neutral[200]}`,
              transition: 'all 0.2s ease',
              cursor: 'default',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 16px ${colors.neutral[300]}`,
                borderColor: colors.status.green,
              },
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <PersonIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: colors.status.green, opacity: 0.7 }} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: '11px', sm: '12px' },
                  color: colors.neutral[600],
                  fontWeight: 500,
                }}
              >
                עובדים
              </Typography>
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '24px', sm: '28px', md: '32px' },
                fontWeight: 700,
                color: colors.neutral[900],
                lineHeight: 1,
              }}
            >
              {data.stats.activeWorkers}
            </Typography>
          </Box>

          {/* Managers */}
          <Box
            sx={{
              background: colors.neutral[50],
              borderRadius: '12px',
              p: { xs: 1.5, sm: 2 },
              border: `1px solid ${colors.neutral[200]}`,
              transition: 'all 0.2s ease',
              cursor: 'default',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 16px ${colors.neutral[300]}`,
                borderColor: '#9333EA',
              },
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <ManagerIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: '#9333EA', opacity: 0.7 }} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: '11px', sm: '12px' },
                  color: colors.neutral[600],
                  fontWeight: 500,
                }}
              >
                מנהלים
              </Typography>
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '24px', sm: '28px', md: '32px' },
                fontWeight: 700,
                color: colors.neutral[900],
                lineHeight: 1,
              }}
            >
              {data.stats.totalManagers}
            </Typography>
          </Box>

          {/* Supervisors */}
          <Box
            sx={{
              background: colors.neutral[50],
              borderRadius: '12px',
              p: { xs: 1.5, sm: 2 },
              border: `1px solid ${colors.neutral[200]}`,
              transition: 'all 0.2s ease',
              cursor: 'default',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 16px ${colors.neutral[300]}`,
                borderColor: '#F59E0B',
              },
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <ManagerIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: '#F59E0B', opacity: 0.7 }} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: '11px', sm: '12px' },
                  color: colors.neutral[600],
                  fontWeight: 500,
                }}
              >
                מפקחים
              </Typography>
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '24px', sm: '28px', md: '32px' },
                fontWeight: 700,
                color: colors.neutral[900],
                lineHeight: 1,
              }}
            >
              {data.stats.totalSupervisors}
            </Typography>
          </Box>

          {/* Corporations */}
          <Box
            sx={{
              background: colors.neutral[50],
              borderRadius: '12px',
              p: { xs: 1.5, sm: 2 },
              border: `1px solid ${colors.neutral[200]}`,
              transition: 'all 0.2s ease',
              cursor: 'default',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 16px ${colors.neutral[300]}`,
                borderColor: '#10B981',
              },
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <BusinessIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: '#10B981', opacity: 0.7 }} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: '11px', sm: '12px' },
                  color: colors.neutral[600],
                  fontWeight: 500,
                }}
              >
                תאגידים
              </Typography>
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '24px', sm: '28px', md: '32px' },
                fontWeight: 700,
                color: colors.neutral[900],
                lineHeight: 1,
              }}
            >
              {data.stats.activeCorporations}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Sidebar */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
        sx={{
          width: 400,
          flexShrink: 0,
          zIndex: 1200,
          '& .MuiDrawer-paper': {
            width: 400,
            boxSizing: 'border-box',
            background: colors.neutral[0],
            borderRight: `1px solid ${colors.neutral[200]}`,
            pt: 10,
            zIndex: 1200,
          },
        }}
      >
        <Box sx={{ p: 3, overflowY: 'auto', height: '100%', direction: 'rtl' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight={700}>
              פרטי מערכת
            </Typography>
            <IconButton onClick={() => setSidebarOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* User Info */}
          <Box
            sx={{
              p: 2.5,
              mb: 3,
              background: colors.neutral[50],
              borderRadius: '12px',
              border: `1px solid ${colors.neutral[200]}`,
            }}
          >
            <Typography variant="subtitle2" color={colors.neutral[600]} sx={{ mb: 0.5 }}>
              משתמש מחובר
            </Typography>
            <Typography variant="h6" fontWeight={700} color={colors.neutral[900]} sx={{ mb: 1 }}>
              {data.user.name}
            </Typography>
            <Chip
              label={data.user.role}
              size="small"
              sx={{
                mt: 0.5,
                background: colors.primary,
                color: colors.neutral[0],
                fontWeight: 600,
              }}
            />
          </Box>

          <List>
            {/* Corporations */}
            <ListItem
              button
              onClick={() => toggleSection('corporations')}
              sx={{
                background: colors.pastel.greenLight,
                borderRadius: '8px',
                mb: 1,
              }}
            >
              <BusinessIcon sx={{ mr: 2, color: colors.status.green }} />
              <ListItemText
                primary={`תאגידים (${data.corporations.length})`}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              {expandedSections.corporations ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={expandedSections.corporations} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {data.corporations.map((corp: any) => (
                  <ListItem key={corp.id} sx={{ pl: 2, pr: 1 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        mr: 1.5,
                        background: colors.pastel.blue,
                        fontSize: '12px',
                      }}
                    >
                      {corp.name.charAt(0)}
                    </Avatar>
                    <ListItemText
                      primary={corp.name}
                      secondary={`${corp._count.sites} אתרים, ${corp._count.managers} מנהלים`}
                      secondaryTypographyProps={{ fontSize: '12px' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>

            {/* Managers */}
            <ListItem
              button
              onClick={() => toggleSection('managers')}
              sx={{
                background: colors.pastel.purpleLight,
                borderRadius: '8px',
                mb: 1,
              }}
            >
              <ManagerIcon sx={{ mr: 2, color: colors.pastel.purple }} />
              <ListItemText
                primary={`מנהלים (${data.managers.length})`}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              {expandedSections.managers ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={expandedSections.managers} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {data.managers.map((manager: any) => (
                  <ListItem key={manager.id} sx={{ pl: 2, pr: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 1.5, background: colors.pastel.purple }}>
                      {manager.user.fullName.charAt(0)}
                    </Avatar>
                    <ListItemText
                      primary={manager.user.fullName}
                      secondary={manager.corporation.name}
                      secondaryTypographyProps={{ fontSize: '12px' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>

            {/* Supervisors */}
            <ListItem
              button
              onClick={() => toggleSection('supervisors')}
              sx={{
                background: colors.pastel.orangeLight,
                borderRadius: '8px',
                mb: 1,
              }}
            >
              <ManagerIcon sx={{ mr: 2, color: colors.pastel.orange }} />
              <ListItemText
                primary={`מפקחים (${data.supervisors.length})`}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              {expandedSections.supervisors ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={expandedSections.supervisors} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {data.supervisors.map((supervisor: any) => (
                  <ListItem key={supervisor.id} sx={{ pl: 2, pr: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 1.5, background: colors.pastel.orange }}>
                      {supervisor.user.fullName.charAt(0)}
                    </Avatar>
                    <ListItemText
                      primary={supervisor.user.fullName}
                      secondary={`${supervisor.siteAssignments.length} אתרים`}
                      secondaryTypographyProps={{ fontSize: '12px' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>

            {/* Area Managers (SuperAdmin only) */}
            {data.user.isSuperAdmin && data.areaManagers.length > 0 && (
              <>
                <ListItem
                  button
                  onClick={() => toggleSection('areaManagers')}
                  sx={{
                    background: colors.pastel.blueLight,
                    borderRadius: '8px',
                    mb: 1,
                  }}
                >
                  <SupervisorAccount sx={{ mr: 2, color: colors.primary }} />
                  <ListItemText
                    primary={`מנהלי אזור (${data.areaManagers.length})`}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  {expandedSections.areaManagers ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={expandedSections.areaManagers} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {data.areaManagers.map((am: any) => (
                      <ListItem key={am.id} sx={{ pl: 2, pr: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1.5, background: colors.primary }}>
                          {am.user.fullName.charAt(0)}
                        </Avatar>
                        <ListItemText
                          primary={am.user.fullName}
                          secondary={`${am.corporations.length} תאגידים`}
                          secondaryTypographyProps={{ fontSize: '12px' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      {/* Toggle Sidebar Button */}
      {!sidebarOpen && (
        <IconButton
          onClick={() => setSidebarOpen(true)}
          sx={{
            position: 'absolute',
            top: 80,
            left: 16,
            zIndex: 1000,
            background: colors.neutral[0],
            boxShadow: `0 4px 12px ${colors.neutral[300]}`,
            '&:hover': {
              background: colors.neutral[100],
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Map */}
      <Box
        sx={{
          flexGrow: 1,
          height: '100vh',
          width: sidebarOpen ? 'calc(100% - 400px)' : '100%',
          transition: 'width 0.3s ease',
          position: 'relative',
        }}
      >
        <LeafletMap sites={sitesWithGPS} />
      </Box>
    </Box>
  );
}
