'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Box, Paper, Typography, Chip, IconButton } from '@mui/material';
import { Close as CloseIcon, LocationOn, Person, SupervisorAccount } from '@mui/icons-material';
import { colors } from '@/lib/design-system';

interface Site {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  city: {
    id: string;
    name: string;
  };
  activists: {
    active: number;
    inactive: number;
    total: number;
  };
  activistCoordinators: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  isActive: boolean;
}

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

interface LeafletMapProps {
  neighborhoods: Site[];
  areaManagers: AreaManager[];
  cityCoordinators: CityCoordinator[];
  activistCoordinators: ActivistCoordinator[];
  onEntitySelect?: (entity: {
    id: string;
    type: 'neighborhood' | 'area_manager' | 'city_coordinator' | 'activist_coordinator';
  } | null) => void;
  selectedEntity?: {
    id: string;
    type: 'neighborhood' | 'area_manager' | 'city_coordinator' | 'activist_coordinator';
  } | null;
}

export default function LeafletMap({
  neighborhoods,
  areaManagers,
  cityCoordinators,
  activistCoordinators,
  onEntitySelect,
  selectedEntity,
}: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.MarkerClusterGroup | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map centered on Israel
    map.current = L.map(mapContainer.current).setView([31.0461, 34.8516], 7);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // Initialize marker cluster group
    markersLayer.current = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
    });

    map.current.addLayer(markersLayer.current);

    // Fix for map size - invalidate size after mount
    setTimeout(() => {
      map.current?.invalidateSize();
    }, 100);

    // Handle window resize and sidebar toggle
    const handleResize = () => {
      setTimeout(() => {
        map.current?.invalidateSize();
      }, 100);
    };

    // Click anywhere on map to dismiss hover tooltip
    map.current.on('click', () => {
      setHoveredSite(null);
      setHoverPosition(null);
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Handle external entity selection (from sidebar)
  useEffect(() => {
    if (!map.current || !selectedEntity) return;

    let latitude: number | undefined;
    let longitude: number | undefined;
    let markerKey: string | undefined;

    // Find the entity based on type
    switch (selectedEntity.type) {
      case 'neighborhood': {
        const site = neighborhoods.find((s) => s.id === selectedEntity.id);
        if (site && site.latitude && site.longitude) {
          latitude = site.latitude;
          longitude = site.longitude;
          markerKey = site.id;
          setSelectedSite(site);
        }
        break;
      }
      case 'area_manager': {
        const am = areaManagers.find((a) => a.id === selectedEntity.id);
        if (am && am.latitude && am.longitude) {
          latitude = am.latitude;
          longitude = am.longitude;
          markerKey = `am-${am.id}`;
          setSelectedSite(null); // Clear neighborhood selection
        }
        break;
      }
      case 'city_coordinator': {
        const cc = cityCoordinators.find((c) => c.id === selectedEntity.id);
        if (cc && cc.latitude && cc.longitude) {
          latitude = cc.latitude;
          longitude = cc.longitude;
          markerKey = `cc-${cc.id}`;
          setSelectedSite(null); // Clear neighborhood selection
        }
        break;
      }
      case 'activist_coordinator': {
        const ac = activistCoordinators.find((a) => a.id === selectedEntity.id);
        if (ac && ac.latitude && ac.longitude) {
          latitude = ac.latitude;
          longitude = ac.longitude;
          markerKey = `ac-${ac.id}`;
          setSelectedSite(null); // Clear neighborhood selection
        }
        break;
      }
    }

    // Navigate to the entity if found
    if (latitude && longitude) {
      map.current.setView([latitude, longitude], 15, {
        animate: true,
        duration: 1.5,
      });

      // Open the marker popup if it exists
      if (markerKey) {
        const marker = markersRef.current.get(markerKey);
        if (marker) {
          marker.openPopup();
        }
      }
    }
  }, [selectedEntity, neighborhoods, areaManagers, cityCoordinators, activistCoordinators]);

  // Handle Escape key to close details panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedSite) {
        setSelectedSite(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSite]);

  // State to track hover tooltip
  const [hoveredSite, setHoveredSite] = useState<Site | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  // Auto-hide hover tooltip after 5 seconds
  useEffect(() => {
    if (!hoveredSite) return;

    const timeout = setTimeout(() => {
      setHoveredSite(null);
      setHoverPosition(null);
    }, 5000); // 5 seconds

    return () => clearTimeout(timeout);
  }, [hoveredSite]);

  useEffect(() => {
    if (!map.current || !markersLayer.current) return;

    // Clear existing markers
    markersLayer.current.clearLayers();
    markersRef.current.clear();

    // Define entity-specific colors (UX-optimized for clarity)
    const entityColors = {
      area_manager: '#3B82F6', // Blue - top-level leadership
      city_coordinator: '#10B981', // Green - city-level management
      activist_coordinator: '#F59E0B', // Orange - neighborhood organizers
      neighborhood: '#A855F7', // Purple - locations
    };

    // Helper function to create custom marker icon
    const createMarkerIcon = (color: string, emoji: string, size: number = 40) => {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            position: relative;
            width: ${size}px;
            height: ${size}px;
          ">
            <div style="
              width: 100%;
              height: 100%;
              background: ${color};
              border: 3px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s ease;
            ">
              <div style="
                transform: rotate(45deg);
                font-size: ${size * 0.5}px;
              ">${emoji}</div>
            </div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
      });
    };

    // 1. Add Area Managers (Blue)
    areaManagers.forEach((am) => {
      const marker = L.marker([am.latitude, am.longitude], {
        icon: createMarkerIcon(entityColors.area_manager, '👔', 50),
      });

      const citiesList = am.cities.map((c) => `<li>${c.name}</li>`).join('');
      const popupContent = `
        <div style="font-family: 'Roboto', sans-serif; direction: rtl; min-width: 220px;">
          <h3 style="margin: 0 0 8px 0; font-size: 17px; font-weight: 700; color: ${entityColors.area_manager};">
            👔 מנהל אזור
          </h3>
          <p style="margin: 4px 0; font-size: 15px; font-weight: 600;">
            ${am.fullName}
          </p>
          <p style="margin: 4px 0; font-size: 13px; color: #555;">
            📧 ${am.email}
          </p>
          ${am.phone ? `<p style="margin: 4px 0; font-size: 13px; color: #555;">📞 ${am.phone}</p>` : ''}
          <p style="margin: 8px 0 4px 0; font-size: 13px; font-weight: 600;">
            ערים באחריות (${am.cities.length}):
          </p>
          <ul style="margin: 0; padding-inline-start: 20px; font-size: 12px;">
            ${citiesList}
          </ul>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.set(`am-${am.id}`, marker);
      markersLayer.current?.addLayer(marker);
    });

    // 2. Add City Coordinators (Green)
    cityCoordinators.forEach((cc) => {
      const marker = L.marker([cc.latitude, cc.longitude], {
        icon: createMarkerIcon(entityColors.city_coordinator, '🏛️', 45),
      });

      const popupContent = `
        <div style="font-family: 'Roboto', sans-serif; direction: rtl; min-width: 220px;">
          <h3 style="margin: 0 0 8px 0; font-size: 17px; font-weight: 700; color: ${entityColors.city_coordinator};">
            🏛️ רכז עיר
          </h3>
          <p style="margin: 4px 0; font-size: 15px; font-weight: 600;">
            ${cc.fullName}
          </p>
          <p style="margin: 4px 0; font-size: 13px; color: #555;">
            📧 ${cc.email}
          </p>
          ${cc.phone ? `<p style="margin: 4px 0; font-size: 13px; color: #555;">📞 ${cc.phone}</p>` : ''}
          <p style="
            margin: 8px 0 4px 0;
            padding: 6px 10px;
            background: ${entityColors.city_coordinator}20;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            border-right: 3px solid ${entityColors.city_coordinator};
          ">
            🌆 ${cc.city.name}
          </p>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.set(`cc-${cc.id}`, marker);
      markersLayer.current?.addLayer(marker);
    });

    // 3. Add Activist Coordinators (Orange)
    activistCoordinators.forEach((ac) => {
      const marker = L.marker([ac.latitude, ac.longitude], {
        icon: createMarkerIcon(entityColors.activist_coordinator, '👥', 42),
      });

      const neighborhoodsList = ac.neighborhoods
        .map((n) => `<li>${n.name}${n.address ? ` - ${n.address}` : ''}</li>`)
        .join('');

      const popupContent = `
        <div style="font-family: 'Roboto', sans-serif; direction: rtl; min-width: 220px;">
          <h3 style="margin: 0 0 8px 0; font-size: 17px; font-weight: 700; color: ${entityColors.activist_coordinator};">
            👥 רכז שכונות
          </h3>
          <p style="margin: 4px 0; font-size: 15px; font-weight: 600;">
            ${ac.fullName}
          </p>
          <p style="margin: 4px 0; font-size: 13px; color: #555;">
            📧 ${ac.email}
          </p>
          ${ac.phone ? `<p style="margin: 4px 0; font-size: 13px; color: #555;">📞 ${ac.phone}</p>` : ''}
          <p style="margin: 4px 0; font-size: 13px; color: #888;">
            🌆 ${ac.city.name}
          </p>
          <p style="margin: 8px 0 4px 0; font-size: 13px; font-weight: 600;">
            שכונות באחריות (${ac.neighborhoods.length}):
          </p>
          <ul style="margin: 0; padding-inline-start: 20px; font-size: 12px; max-height: 150px; overflow-y: auto;">
            ${neighborhoodsList}
          </ul>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.set(`ac-${ac.id}`, marker);
      markersLayer.current?.addLayer(marker);
    });

    // 4. Add Neighborhoods (Purple)
    neighborhoods.forEach((site) => {
      if (!site.latitude || !site.longitude) return;

      const marker = L.marker([site.latitude, site.longitude], {
        icon: createMarkerIcon(entityColors.neighborhood, '📍', 38),
      });

      const popupContent = `
        <div style="font-family: 'Roboto', sans-serif; direction: rtl; min-width: 220px;">
          <h3 style="margin: 0 0 8px 0; font-size: 17px; font-weight: 700; color: ${entityColors.neighborhood};">
            📍 ${site.name}
          </h3>
          <p style="
            margin: 0 0 8px 0;
            padding: 6px 10px;
            background: ${entityColors.neighborhood}20;
            border-radius: 6px;
            font-size: 13px;
            display: inline-block;
            font-weight: 600;
          ">
            🌆 ${site.city.name}
          </p>
          <p style="margin: 4px 0; font-size: 13px; color: #555;">
            📍 ${site.address || 'אין כתובת'}
          </p>
          <p style="margin: 8px 0 4px 0; font-size: 13px; font-weight: 600;">
            👥 פעילים: ${site.activists.active} פעילים (${site.activists.inactive} לא פעילים)
          </p>
          ${
            site.activistCoordinators.length > 0
              ? `
            <p style="margin: 8px 0 4px 0; font-size: 13px; font-weight: 600;">
              רכזי שכונות:
            </p>
            <ul style="margin: 0; padding-inline-start: 20px; font-size: 12px;">
              ${site.activistCoordinators.map((ac) => `<li>${ac.name} (${ac.email})</li>`).join('')}
            </ul>
          `
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.set(site.id, marker);

      // Add click handler to show details panel
      marker.on('click', () => {
        setSelectedSite(site);
        onEntitySelect?.({ id: site.id, type: 'neighborhood' });
        map.current?.setView([site.latitude, site.longitude], 14, {
          animate: true,
          duration: 1.5,
        });
      });

      // Add hover handlers for tooltip
      marker.on('mouseover', (e: any) => {
        setHoveredSite(site);
        const markerElement = e.target.getElement();
        if (markerElement) {
          const rect = markerElement.getBoundingClientRect();
          setHoverPosition({
            x: rect.left + rect.width / 2,
            y: rect.top,
          });
        }
      });

      marker.on('mouseout', () => {
        setHoveredSite(null);
        setHoverPosition(null);
      });

      markersLayer.current?.addLayer(marker);
    });

    // Fit bounds to show all markers
    const allMarkers = [
      ...areaManagers,
      ...cityCoordinators,
      ...activistCoordinators,
      ...neighborhoods.filter((n) => n.latitude && n.longitude),
    ];

    if (allMarkers.length > 0 && markersLayer.current.getBounds().isValid()) {
      map.current.fitBounds(markersLayer.current.getBounds(), {
        padding: [50, 50],
        maxZoom: 12,
      });
    }
  }, [neighborhoods, areaManagers, cityCoordinators, activistCoordinators]);

  // Entity types for legend
  const entityTypes = React.useMemo(
    () => [
      {
        type: 'area_manager',
        label: 'מנהלי אזור',
        emoji: '👔',
        color: '#3B82F6',
        count: areaManagers.length,
      },
      {
        type: 'city_coordinator',
        label: 'רכזי עיר',
        emoji: '🏛️',
        color: '#10B981',
        count: cityCoordinators.length,
      },
      {
        type: 'activist_coordinator',
        label: 'רכזי שכונות',
        emoji: '👥',
        color: '#F59E0B',
        count: activistCoordinators.length,
      },
      {
        type: 'neighborhood',
        label: 'שכונות',
        emoji: '📍',
        color: '#A855F7',
        count: neighborhoods.filter((n) => n.latitude && n.longitude).length,
      },
    ],
    [areaManagers.length, cityCoordinators.length, activistCoordinators.length, neighborhoods]
  );

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', margin: 0, padding: 0 }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }} />

      {/* Backdrop for closing details panel */}
      {selectedSite && (
        <Box
          onClick={() => {
            setSelectedSite(null);
            onEntitySelect?.(null); // Clear parent state too
          }}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            zIndex: 999,
            cursor: 'pointer',
          }}
        />
      )}

      {/* Site Details Panel - Modern 2025 Design */}
      {selectedSite && (
        <Paper
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: 'absolute',
            bottom: { xs: 16, sm: 32 },
            left: '50%',
            transform: 'translateX(-50%)',
            width: { xs: '94%', sm: '90%', md: '520px' },
            maxHeight: { xs: '60vh', sm: '500px' },
            overflowY: 'auto',
            p: { xs: 2.5, sm: 3 },
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            boxShadow: `0 12px 40px ${colors.neutral[400]}`,
            direction: 'rtl',
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {selectedSite.name}
              </Typography>
              <Chip
                label={selectedSite.city.name}
                size="small"
                sx={{
                  background: colors.pastel.blue,
                  color: colors.neutral[0],
                  fontWeight: 600,
                  mb: 1
                }}
              />
            </Box>
            <IconButton
              onClick={() => {
                setSelectedSite(null);
                onEntitySelect?.(null); // Clear parent state to prevent reopening
              }}
              size="large"
              sx={{
                background: colors.neutral[100],
                border: `2px solid ${colors.neutral[300]}`,
                width: 44,
                height: 44,
                '&:hover': {
                  background: colors.neutral[200],
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <CloseIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </Box>

          {/* Address */}
          <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
            <LocationOn sx={{ color: colors.neutral[600], fontSize: 20 }} />
            <Typography variant="body2" color={colors.neutral[700]}>
              {selectedSite.address || 'אין כתובת'}
            </Typography>
          </Box>

          {/* Workers */}
          <Box
            sx={{
              p: 2,
              background: colors.pastel.yellowLight,
              borderRadius: '8px',
              mb: 2,
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Person sx={{ color: colors.neutral[700] }} />
              <Typography variant="subtitle2" fontWeight={600}>
                פעילים באתר
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={700}>
              {selectedSite.activists.active}
            </Typography>
            <Typography variant="caption" color={colors.neutral[600]}>
              {selectedSite.activists.total} סה&quot;כ ({selectedSite.activists.inactive} לא פעילים)
            </Typography>
          </Box>

          {/* Supervisors */}
          {selectedSite.activistCoordinators.length > 0 && (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <SupervisorAccount sx={{ color: colors.neutral[700] }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  רכזי שכונות
                </Typography>
              </Box>
              {selectedSite.activistCoordinators.map((activistCoordinator) => (
                <Box
                  key={activistCoordinator.id}
                  sx={{
                    p: 1.5,
                    background: colors.neutral[50],
                    borderRadius: '8px',
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {activistCoordinator.name}
                  </Typography>
                  <Typography variant="caption" color={colors.neutral[600]}>
                    {activistCoordinator.email}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Hover Tooltip - hide when details panel is showing */}
      {hoveredSite && hoverPosition && !selectedSite && (
        <Paper
          onClick={() => {
            setHoveredSite(null);
            setHoverPosition(null);
          }}
          sx={{
            position: 'fixed',
            left: hoverPosition.x,
            top: hoverPosition.y - 10,
            transform: 'translate(-50%, -100%)',
            p: 2,
            pt: 3,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            direction: 'rtl',
            minWidth: '220px',
            maxWidth: '320px',
            border: `2px solid ${colors.neutral[0]}`,
            animation: 'fadeIn 0.2s ease',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              background: 'rgba(0, 0, 0, 0.95)',
              transform: 'translate(-50%, -100%) scale(1.02)',
            },
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setHoveredSite(null);
              setHoverPosition(null);
            }}
            size="small"
            sx={{
              position: 'absolute',
              top: 4,
              left: 4,
              width: 24,
              height: 24,
              background: 'rgba(255, 255, 255, 0.2)',
              color: colors.neutral[0],
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>

          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ color: colors.neutral[0], mb: 0.5 }}
          >
            {hoveredSite.name}
          </Typography>
          <Chip
            label={hoveredSite.city.name}
            size="small"
            sx={{
              background: colors.pastel.blue,
              color: colors.neutral[0],
              fontWeight: 600,
              fontSize: '11px',
              height: '20px',
              mb: 1,
            }}
          />
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Typography variant="caption" sx={{ color: colors.neutral[200], fontSize: '12px' }}>
              📍 {hoveredSite.address || 'אין כתובת'}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.neutral[200], fontSize: '12px' }}>
              👥 {hoveredSite.activists.active} פעילים פעילים
            </Typography>
            {hoveredSite.activistCoordinators.length > 0 && (
              <Typography variant="caption" sx={{ color: colors.neutral[200], fontSize: '12px' }}>
                👨‍💼 {hoveredSite.activistCoordinators.length} רכזי שכונות
              </Typography>
            )}
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: colors.neutral[400],
              fontSize: '10px',
              mt: 1,
              display: 'block',
              fontStyle: 'italic',
            }}
          >
            לחץ על הסמן לפרטים מלאים • לחץ כאן לסגירה
          </Typography>
        </Paper>
      )}

      {/* Legend - Enhanced with Corporation Colors */}
      <Paper
        sx={{
          position: 'absolute',
          top: { xs: 90, sm: 80 },
          left: { xs: 8, sm: 16 },
          p: 2.5,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          boxShadow: `0 8px 24px ${colors.neutral[300]}`,
          direction: 'rtl',
          minWidth: { xs: '200px', sm: '260px' },
          maxWidth: { xs: '280px', sm: '320px' },
          maxHeight: { xs: '60vh', sm: '70vh' },
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: colors.neutral[100],
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: colors.neutral[300],
            borderRadius: '3px',
            '&:hover': {
              background: colors.neutral[400],
            },
          },
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
          mb={2}
          sx={{
            fontSize: { xs: '14px', sm: '15px' },
            color: colors.neutral[900],
            borderBottom: `2px solid ${colors.neutral[200]}`,
            pb: 1,
          }}
        >
          מקרא סוגי גורמים
        </Typography>

        {/* Entity Types */}
        <Box mb={2}>
          {entityTypes.map((entity) => (
            <Box
              key={entity.type}
              display="flex"
              alignItems="center"
              gap={1.5}
              mb={1.5}
              sx={{
                p: 1.5,
                borderRadius: '10px',
                transition: 'all 0.2s ease',
                background: colors.neutral[50],
                border: `2px solid ${entity.color}30`,
                '&:hover': {
                  background: `${entity.color}10`,
                  transform: 'translateX(-3px)',
                  boxShadow: `0 2px 8px ${entity.color}30`,
                },
              }}
            >
              <Box
                sx={{
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  borderRadius: '50%',
                  background: entity.color,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: { xs: '18px', sm: '20px' },
                  boxShadow: `0 2px 8px ${entity.color}40`,
                  border: `2px solid ${colors.neutral[0]}`,
                }}
              >
                {entity.emoji}
              </Box>
              <Box flex={1}>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: { xs: '13px', sm: '14px' },
                    fontWeight: 600,
                    color: colors.neutral[900],
                    display: 'block',
                    lineHeight: 1.2,
                  }}
                >
                  {entity.label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: { xs: '11px', sm: '12px' },
                    color: colors.neutral[600],
                    display: 'block',
                    mt: 0.3,
                  }}
                >
                  {entity.count} ברשימה
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Instructions */}
        <Box
          sx={{
            p: 1.5,
            background: colors.pastel.blueLight,
            borderRadius: '8px',
            mt: 2,
          }}
        >
          <Typography
            variant="caption"
            color={colors.neutral[700]}
            sx={{
              fontSize: { xs: '11px', sm: '12px' },
              display: 'block',
              lineHeight: 1.5,
              mb: 0.5,
            }}
          >
            💡 <strong>הוראות שימוש:</strong>
          </Typography>
          <Typography
            variant="caption"
            color={colors.neutral[600]}
            sx={{
              fontSize: { xs: '10px', sm: '11px' },
              display: 'block',
              lineHeight: 1.4,
              mb: 0.3,
            }}
          >
            • הרחף מעל סמן לתצוגה מהירה
          </Typography>
          <Typography
            variant="caption"
            color={colors.neutral[600]}
            sx={{
              fontSize: { xs: '10px', sm: '11px' },
              display: 'block',
              lineHeight: 1.4,
              mb: 0.3,
            }}
          >
            • לחץ על סמן לפרטים מלאים
          </Typography>
          <Typography
            variant="caption"
            color={colors.neutral[600]}
            sx={{
              fontSize: { xs: '10px', sm: '11px' },
              display: 'block',
              lineHeight: 1.4,
            }}
          >
            • ⚡ צבירה אוטומטית בזום-אאוט
          </Typography>
        </Box>
      </Paper>

      {/* Global styles for Leaflet markers */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%) scale(1);
          }
        }

        .custom-leaflet-marker {
          background: transparent !important;
          border: none !important;
        }

        .custom-leaflet-marker > div:hover > div {
          transform: rotate(-45deg) scale(1.2) !important;
          z-index: 1000 !important;
        }

        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 0 !important;
          padding-top: 32px !important;
          position: relative !important;
          overflow: visible !important;
        }

        .leaflet-popup-content {
          margin: 12px !important;
          margin-top: 0 !important;
          width: auto !important;
        }

        .leaflet-popup-tip {
          background: white !important;
        }

        /* Fix close button positioning - keep it inside popup */
        .leaflet-popup-close-button {
          position: absolute !important;
          top: 8px !important;
          right: 8px !important;
          left: auto !important;
          width: 24px !important;
          height: 24px !important;
          padding: 0 !important;
          border-radius: 50% !important;
          background: rgba(0, 0, 0, 0.05) !important;
          color: #666 !important;
          font-size: 18px !important;
          line-height: 24px !important;
          text-align: center !important;
          border: none !important;
          transition: all 0.2s ease !important;
          z-index: 10 !important;
        }

        .leaflet-popup-close-button:hover {
          background: rgba(0, 0, 0, 0.1) !important;
          color: #333 !important;
          transform: scale(1.1) !important;
        }

        /* RTL support for close button */
        .leaflet-container[dir='rtl'] .leaflet-popup-close-button {
          right: auto !important;
          left: 8px !important;
        }
      `}</style>
    </Box>
  );
}
