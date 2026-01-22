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
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  SupervisorAccount as ManagerIcon,
  SupervisorAccount,
  ExpandLess,
  ExpandMore,
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

interface AreaManager {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  cities: Array<{ id: string; name: string }>;
  latitude: number;
  longitude: number;
  type: 'area_manager';
}

interface CityCoordinator {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  city: { id: string; name: string };
  latitude: number;
  longitude: number;
  type: 'city_coordinator';
}

interface ActivistCoordinator {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  city: { id: string; name: string };
  neighborhoods: Array<{ id: string; name: string; address: string | null }>;
  latitude: number;
  longitude: number;
  type: 'activist_coordinator';
}

interface MapData {
  neighborhoods: any[];
  cities: any[];
  areaManagers: AreaManager[];
  managers: CityCoordinator[];
  activistCoordinators: ActivistCoordinator[];
  stats: any;
  user: any;
}

export default function LeafletClient() {
  const [data, setData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<{
    id: string;
    type: 'neighborhood' | 'area_manager' | 'city_coordinator' | 'activist_coordinator';
  } | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    cities: true,
    neighborhoods: false,
    managers: false,
    activistCoordinators: false,
    areaManagers: false,
  });

  useEffect(() => {
    fetchMapData();
  }, []);

  // Trigger map resize when sidebar opens/closes
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 350); // Wait for transition to complete
    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  // Keyboard shortcut support (M key or Escape to toggle menu)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'm' || event.key === 'M') {
        setSidebarOpen((prev) => !prev);
      } else if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [sidebarOpen]);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/map-data', {
        credentials: 'include',
      });

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          const errorData = await response.json();

          // If session is invalid, redirect to signout
          if (errorData.code === 'SESSION_INVALID') {
            setError('ההפעלה פגה תוקף. מפנה לדף כניסה מחדש...');
            setTimeout(() => {
              window.location.href = errorData.redirectTo || '/api/auth/signout';
            }, 1500);
            return;
          }

          throw new Error(errorData.error || 'לא מורשה - נא להתחבר מחדש');
        }

        throw new Error('שגיאה בטעינת נתוני מפה');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
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

  const handleEntityClick = (
    id: string,
    type: 'neighborhood' | 'area_manager' | 'city_coordinator' | 'activist_coordinator'
  ) => {
    setSelectedEntity({ id, type });
    // Auto-close sidebar on mobile after selection
    if (window.innerWidth < 600) {
      setSidebarOpen(false);
    }
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

  const sitesWithGPS = data.neighborhoods.filter((s) => s.latitude && s.longitude);

  return (
    <Box sx={{ height: '100vh', width: '100%', position: 'relative', margin: 0, padding: 0, overflow: 'hidden' }}>
      {/* Sidebar */}
      <Drawer
        variant="persistent"
        anchor="right"
        open={sidebarOpen}
        sx={{
          width: { xs: '100%', sm: 400 },
          flexShrink: 0,
          zIndex: 1300,
          margin: 0,
          padding: 0,
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 400 },
            height: '100vh',
            boxSizing: 'border-box',
            background: colors.neutral[0],
            borderLeft: { xs: 'none', sm: `1px solid ${colors.neutral[200]}` },
            pt: 2,
            px: 0,
            pb: 0,
            zIndex: 1300,
            right: 0,
            left: 'auto',
            top: 0,
            position: 'fixed',
            margin: 0,
            boxShadow: { xs: 'none', sm: '-4px 0 12px rgba(0,0,0,0.08)' },
          },
        }}
      >
        <Box 
          sx={{ 
            p: 3, 
            pb: 6,
            overflowY: 'auto', 
            height: '100%', 
            direction: 'rtl',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: colors.neutral[100],
            },
            '&::-webkit-scrollbar-thumb': {
              background: colors.neutral[300],
              borderRadius: '4px',
              '&:hover': {
                background: colors.neutral[400],
              },
            },
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight={700} color={colors.neutral[900]}>
              פרטי מערכת
            </Typography>
            <IconButton 
              onClick={() => setSidebarOpen(false)}
              sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: colors.neutral[100],
                  transform: 'rotate(90deg)',
                },
              }}
            >
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
              component="div"
              onClick={() => toggleSection('cities')}
              sx={{
                background: colors.pastel.greenLight,
                borderRadius: '8px',
                mb: 1,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: colors.pastel.green,
                  transform: 'translateX(-4px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
              }}
            >
              <BusinessIcon sx={{ mr: 2, color: colors.status.green }} />
              <ListItemText
                primary={`ערים (${data.cities.length})`}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              {expandedSections.cities ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={expandedSections.cities} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ mt: 1 }}>
                {data.cities.map((corp: any) => (
                  <ListItem 
                    key={corp.id} 
                    sx={{ 
                      pl: 2, 
                      pr: 1,
                      py: 1.5,
                      transition: 'all 0.2s ease',
                      borderRadius: '8px',
                      mx: 1,
                      '&:hover': {
                        background: colors.neutral[50],
                        transform: 'translateX(-2px)',
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        mr: 1.5,
                        background: colors.pastel.blue,
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {corp.name.charAt(0)}
                    </Avatar>
                    <ListItemText
                      primary={corp.name}
                      secondary={`${corp._count.neighborhoods} שכונות, ${corp._count.coordinators} רכזי עיר`}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '14px' }}
                      secondaryTypographyProps={{ fontSize: '12px', color: colors.neutral[600] }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>

            {/* Sites */}
            <ListItem
              component="div"
              onClick={() => toggleSection('neighborhoods')}
              sx={{
                background: colors.pastel.blueLight,
                borderRadius: '8px',
                mb: 1,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: colors.pastel.blue,
                  transform: 'translateX(-4px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
              }}
            >
              <LocationIcon sx={{ mr: 2, color: colors.primary }} />
              <ListItemText
                primary={`שכונות (${data.neighborhoods.length})`}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              {expandedSections.neighborhoods ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={expandedSections.neighborhoods} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ mt: 1 }}>
                {data.neighborhoods.map((neighborhood: any) => (
                  <ListItem
                    key={neighborhood.id}
                    component="button"
                    onClick={() => handleEntityClick(neighborhood.id, 'neighborhood')}
                    disabled={!neighborhood.latitude || !neighborhood.longitude}
                    sx={{
                      pl: 2,
                      pr: 1,
                      py: 1.5,
                      transition: 'all 0.2s ease',
                      borderRadius: '8px',
                      mx: 1,
                      cursor: neighborhood.latitude && neighborhood.longitude ? 'pointer' : 'not-allowed',
                      opacity: neighborhood.latitude && neighborhood.longitude ? 1 : 0.5,
                      background:
                        selectedEntity?.id === neighborhood.id && selectedEntity?.type === 'neighborhood'
                          ? colors.pastel.blueLight
                          : 'transparent',
                      border:
                        selectedEntity?.id === neighborhood.id && selectedEntity?.type === 'neighborhood'
                          ? `2px solid ${colors.primary}`
                          : '2px solid transparent',
                      '&:hover': {
                        background: neighborhood.latitude && neighborhood.longitude
                          ? selectedEntity?.id === neighborhood.id && selectedEntity?.type === 'neighborhood'
                            ? colors.pastel.blue
                            : colors.neutral[50]
                          : 'transparent',
                        transform: neighborhood.latitude && neighborhood.longitude ? 'translateX(-2px)' : 'none',
                      },
                      '&:disabled': {
                        cursor: 'not-allowed',
                        opacity: 0.5,
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        mr: 1.5,
                        background: colors.primary,
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {neighborhood.name.charAt(0)}
                    </Avatar>
                    <ListItemText
                      primary={neighborhood.name}
                      secondary={
                        neighborhood.latitude && neighborhood.longitude
                          ? `${neighborhood.cityRelation?.name || ''} • ${neighborhood.activists?.length || 0} פעילים`
                          : `${neighborhood.cityRelation?.name || ''} • אין נתוני מיקום`
                      }
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '14px' }}
                      secondaryTypographyProps={{ fontSize: '12px', color: colors.neutral[600] }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>

            {/* Managers */}
            <ListItem
              component="div"
              onClick={() => toggleSection('managers')}
              sx={{
                background: colors.pastel.purpleLight,
                borderRadius: '8px',
                mb: 1,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: colors.pastel.purple,
                  transform: 'translateX(-4px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
              }}
            >
              <ManagerIcon sx={{ mr: 2, color: colors.pastel.purple }} />
              <ListItemText
                primary={`רכזי עיר (${data.managers.length})`}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              {expandedSections.managers ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={expandedSections.managers} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ mt: 1 }}>
                {data.managers.map((manager: any) => (
                  <ListItem
                    key={manager.id}
                    component="button"
                    onClick={() => handleEntityClick(manager.id, 'city_coordinator')}
                    sx={{
                      pl: 2,
                      pr: 1,
                      py: 1.5,
                      transition: 'all 0.2s ease',
                      borderRadius: '8px',
                      mx: 1,
                      cursor: 'pointer',
                      background:
                        selectedEntity?.id === manager.id && selectedEntity?.type === 'city_coordinator'
                          ? colors.pastel.purpleLight
                          : 'transparent',
                      border:
                        selectedEntity?.id === manager.id && selectedEntity?.type === 'city_coordinator'
                          ? `2px solid ${colors.pastel.purple}`
                          : '2px solid transparent',
                      '&:hover': {
                        background:
                          selectedEntity?.id === manager.id && selectedEntity?.type === 'city_coordinator'
                            ? colors.pastel.purple
                            : colors.neutral[50],
                        transform: 'translateX(-2px)',
                      },
                    }}
                  >
                    <Avatar sx={{
                      width: 32,
                      height: 32,
                      mr: 1.5,
                      background: colors.pastel.purple,
                      fontWeight: 600,
                      fontSize: '12px',
                    }}>
                      {manager.fullName.charAt(0)}
                    </Avatar>
                    <ListItemText
                      primary={manager.fullName}
                      secondary={manager.city.name}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '14px' }}
                      secondaryTypographyProps={{ fontSize: '12px', color: colors.neutral[600] }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>

            {/* Supervisors */}
            <ListItem
              component="div"
              onClick={() => toggleSection('activistCoordinators')}
              sx={{
                background: colors.pastel.orangeLight,
                borderRadius: '8px',
                mb: 1,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: colors.pastel.orange,
                  transform: 'translateX(-4px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
              }}
            >
              <ManagerIcon sx={{ mr: 2, color: colors.pastel.orange }} />
              <ListItemText
                primary={`רכזי שכונות (${data.activistCoordinators.length})`}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              {expandedSections.activistCoordinators ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={expandedSections.activistCoordinators} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ mt: 1 }}>
                {data.activistCoordinators.map((activistCoordinator: any) => (
                  <ListItem
                    key={activistCoordinator.id}
                    component="button"
                    onClick={() => handleEntityClick(activistCoordinator.id, 'activist_coordinator')}
                    sx={{
                      pl: 2,
                      pr: 1,
                      py: 1.5,
                      transition: 'all 0.2s ease',
                      borderRadius: '8px',
                      mx: 1,
                      cursor: 'pointer',
                      background:
                        selectedEntity?.id === activistCoordinator.id &&
                        selectedEntity?.type === 'activist_coordinator'
                          ? colors.pastel.orangeLight
                          : 'transparent',
                      border:
                        selectedEntity?.id === activistCoordinator.id &&
                        selectedEntity?.type === 'activist_coordinator'
                          ? `2px solid ${colors.pastel.orange}`
                          : '2px solid transparent',
                      '&:hover': {
                        background:
                          selectedEntity?.id === activistCoordinator.id &&
                          selectedEntity?.type === 'activist_coordinator'
                            ? colors.pastel.orange
                            : colors.neutral[50],
                        transform: 'translateX(-2px)',
                      },
                    }}
                  >
                    <Avatar sx={{
                      width: 32,
                      height: 32,
                      mr: 1.5,
                      background: colors.pastel.orange,
                      fontWeight: 600,
                      fontSize: '12px',
                    }}>
                      {activistCoordinator.fullName.charAt(0)}
                    </Avatar>
                    <ListItemText
                      primary={activistCoordinator.fullName}
                      secondary={`${activistCoordinator.neighborhoods.length} שכונות`}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '14px' }}
                      secondaryTypographyProps={{ fontSize: '12px', color: colors.neutral[600] }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>

            {/* Area Managers (SuperAdmin only) */}
            {data.user.isSuperAdmin && data.areaManagers.length > 0 && (
              <>
                <ListItem
                  component="div"
                  onClick={() => toggleSection('areaManagers')}
                  sx={{
                    background: colors.pastel.blueLight,
                    borderRadius: '8px',
                    mb: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: colors.pastel.blue,
                      transform: 'translateX(-4px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  <SupervisorAccount sx={{ mr: 2, color: colors.primary }} />
                  <ListItemText
                    primary={`מנהלי מחוז (${data.areaManagers.length})`}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  {expandedSections.areaManagers ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={expandedSections.areaManagers} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ mt: 1 }}>
                    {data.areaManagers.map((am: any) => (
                      <ListItem
                        key={am.id}
                        component="button"
                        onClick={() => handleEntityClick(am.id, 'area_manager')}
                        sx={{
                          pl: 2,
                          pr: 1,
                          py: 1.5,
                          transition: 'all 0.2s ease',
                          borderRadius: '8px',
                          mx: 1,
                          cursor: 'pointer',
                          background:
                            selectedEntity?.id === am.id && selectedEntity?.type === 'area_manager'
                              ? colors.pastel.blueLight
                              : 'transparent',
                          border:
                            selectedEntity?.id === am.id && selectedEntity?.type === 'area_manager'
                              ? `2px solid ${colors.primary}`
                              : '2px solid transparent',
                          '&:hover': {
                            background:
                              selectedEntity?.id === am.id && selectedEntity?.type === 'area_manager'
                                ? colors.pastel.blue
                                : colors.neutral[50],
                            transform: 'translateX(-2px)',
                          },
                        }}
                      >
                        <Avatar sx={{
                          width: 32,
                          height: 32,
                          mr: 1.5,
                          background: colors.primary,
                          fontWeight: 600,
                          fontSize: '12px',
                        }}>
                          {am.fullName.charAt(0)}
                        </Avatar>
                        <ListItemText
                          primary={am.fullName}
                          secondary={`${am.cities.length} ערים`}
                          primaryTypographyProps={{ fontWeight: 600, fontSize: '14px' }}
                          secondaryTypographyProps={{ fontSize: '12px', color: colors.neutral[600] }}
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

      {/* Toggle Sidebar Button - Clean & Minimal */}
      {!sidebarOpen && (
        <Tooltip
          title="תפריט"
          placement="left"
          arrow
          sx={{
            '& .MuiTooltip-tooltip': {
              fontSize: '12px',
              fontWeight: 500,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(8px)',
              borderRadius: '6px',
              padding: '6px 10px',
            },
          }}
        >
          <IconButton
            onClick={() => setSidebarOpen(true)}
            aria-label="פתח תפריט"
            sx={{
              position: 'fixed',
              top: { xs: 16, sm: 20 },
              right: { xs: 16, sm: 20 },
              zIndex: 9999,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              width: { xs: 48, sm: 52 },
              height: { xs: 48, sm: 52 },
              boxShadow: '0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
              border: `1px solid ${colors.neutral[200]}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                background: colors.neutral[0],
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
                borderColor: colors.neutral[300],
              },
              '&:active': {
                transform: 'translateY(0px)',
                boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
              },
            }}
          >
            <MenuIcon
              sx={{
                fontSize: 24,
                color: colors.neutral[700],
              }}
            />
          </IconButton>
        </Tooltip>
      )}

      {/* Map */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: {
            xs: sidebarOpen ? '100%' : 0,
            sm: sidebarOpen ? '400px' : 0
          },
          bottom: 0,
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1,
          pointerEvents: 'auto',
        }}
      >
        <LeafletMap
          neighborhoods={sitesWithGPS}
          areaManagers={data.areaManagers}
          cityCoordinators={data.managers}
          activistCoordinators={data.activistCoordinators}
          selectedEntity={selectedEntity}
          onEntitySelect={setSelectedEntity}
        />
      </Box>
    </Box>
  );
}
