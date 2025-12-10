'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Box, Paper, Typography, Chip, IconButton, Tooltip, Fade } from '@mui/material';
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

interface LeafletMapProps {
  neighborhoods: Site[];
  onSiteSelect?: (siteId: string | null) => void;
  selectedSiteId?: string | null;
}

export default function LeafletMap({ neighborhoods, onSiteSelect, selectedSiteId }: LeafletMapProps) {
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

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Handle external site selection (from sidebar)
  useEffect(() => {
    if (!map.current || !selectedSiteId) return;

    const site = neighborhoods.find((s) => s.id === selectedSiteId);
    if (!site || !site.latitude || !site.longitude) return;

    // Focus on the site
    map.current.setView([site.latitude, site.longitude], 15, {
      animate: true,
      duration: 1.5,
    });

    // Update selected site for details panel
    setSelectedSite(site);

    // Open the marker popup if it exists
    const marker = markersRef.current.get(site.id);
    if (marker) {
      marker.openPopup();
    }
  }, [selectedSiteId, neighborhoods]);

  // State to track hover tooltip
  const [hoveredSite, setHoveredSite] = useState<Site | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!map.current || !markersLayer.current) return;

    // Clear existing markers
    markersLayer.current.clearLayers();
    markersRef.current.clear();

    // Create color map for corporations
    const corpColors: Record<string, string> = {};
    const colorPalette = [
      colors.primary.main,
      colors.status.green,
      colors.pastel.purple,
      colors.pastel.orange,
      colors.pastel.pink,
      colors.pastel.blue,
    ];

    neighborhoods.forEach((site) => {
      if (!site.latitude || !site.longitude) return;

      // Assign color to city
      if (!corpColors[site.city.id]) {
        const colorIndex = Object.keys(corpColors).length % colorPalette.length;
        corpColors[site.city.id] = colorPalette[colorIndex];
      }

      // Create custom icon
      const markerColor = corpColors[site.city.id];
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            position: relative;
            width: 40px;
            height: 40px;
          ">
            <div style="
              width: 100%;
              height: 100%;
              background: ${markerColor};
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
                font-size: 20px;
              ">📍</div>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });

      // Create marker
      const marker = L.marker([site.latitude, site.longitude], {
        icon: customIcon,
      });

      // Create popup content
      const popupContent = `
        <div style="
          font-family: 'Roboto', sans-serif;
          direction: rtl;
          min-width: 200px;
        ">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700;">
            ${site.name}
          </h3>
          <p style="
            margin: 0 0 8px 0;
            padding: 4px 8px;
            background: ${colors.pastel.blue};
            border-radius: 4px;
            font-size: 12px;
            display: inline-block;
          ">
            ${site.city.name}
          </p>
          <p style="margin: 4px 0; font-size: 13px; color: #555;">
            📍 ${site.address || 'אין כתובת'}
          </p>
          <p style="margin: 4px 0; font-size: 13px; color: #555;">
            👥 ${site.activists.active} פעילים פעילים
          </p>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Store marker reference
      markersRef.current.set(site.id, marker);

      // Add click handler to show details panel
      marker.on('click', () => {
        setSelectedSite(site);
        onSiteSelect?.(site.id);
        map.current?.setView([site.latitude, site.longitude], 12, {
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

      // Add to cluster layer
      markersLayer.current?.addLayer(marker);
    });

    // Store city colors for legend
    (window as any).__corpColors = corpColors;

    // Fit bounds to show all markers
    if (neighborhoods.length > 0 && markersLayer.current.getBounds().isValid()) {
      map.current.fitBounds(markersLayer.current.getBounds(), {
        padding: [50, 50],
        maxZoom: 12,
      });
    }
  }, [neighborhoods]);

  // Get unique corporations with their colors for legend
  const corporationsWithColors = React.useMemo(() => {
    const corpMap = new Map<string, { id: string; name: string; color: string }>();
    const colorPalette = [
      colors.primary.main,
      colors.status.green,
      colors.pastel.purple,
      colors.pastel.orange,
      colors.pastel.pink,
      colors.pastel.blue,
    ];

    neighborhoods.forEach((site) => {
      if (!corpMap.has(site.city.id)) {
        const colorIndex = corpMap.size % colorPalette.length;
        corpMap.set(site.city.id, {
          id: site.city.id,
          name: site.city.name,
          color: colorPalette[colorIndex],
        });
      }
    });

    return Array.from(corpMap.values());
  }, [neighborhoods]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', margin: 0, padding: 0 }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }} />

      {/* Site Details Panel - Modern 2025 Design */}
      {selectedSite && (
        <Paper
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
            <IconButton onClick={() => setSelectedSite(null)} size="small">
              <CloseIcon />
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
                  רכזי פעילים
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

      {/* Hover Tooltip */}
      {hoveredSite && hoverPosition && (
        <Paper
          sx={{
            position: 'fixed',
            left: hoverPosition.x,
            top: hoverPosition.y - 10,
            transform: 'translate(-50%, -100%)',
            p: 2,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            direction: 'rtl',
            minWidth: '220px',
            maxWidth: '320px',
            pointerEvents: 'none',
            border: `2px solid ${colors.neutral[0]}`,
            animation: 'fadeIn 0.2s ease',
          }}
        >
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
                👨‍💼 {hoveredSite.activistCoordinators.length} רכזי פעילים
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
            לחץ לפרטים מלאים
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
          מקרא צבעים
        </Typography>

        {/* Corporation Colors */}
        <Box mb={2}>
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              fontSize: { xs: '11px', sm: '12px' },
              color: colors.neutral[700],
              display: 'block',
              mb: 1,
            }}
          >
            ערים ({corporationsWithColors.length})
          </Typography>
          {corporationsWithColors.map((corp) => (
            <Tooltip
              key={corp.id}
              title={`${neighborhoods.filter((s) => s.city.id === corp.id).length} שכונות`}
              placement="left"
              arrow
            >
              <Box
                display="flex"
                alignItems="center"
                gap={1.5}
                mb={1}
                sx={{
                  p: 1,
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    background: colors.neutral[50],
                    transform: 'translateX(-2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 16, sm: 18 },
                    height: { xs: 16, sm: 18 },
                    borderRadius: '50%',
                    background: corp.color,
                    flexShrink: 0,
                    boxShadow: `0 2px 6px ${corp.color}40`,
                    border: `2px solid ${colors.neutral[0]}`,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: { xs: '12px', sm: '13px' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: 500,
                    color: colors.neutral[800],
                  }}
                >
                  {corp.name}
                </Typography>
              </Box>
            </Tooltip>
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
        }

        .leaflet-popup-content {
          margin: 12px !important;
        }

        .leaflet-popup-tip {
          background: white !important;
        }
      `}</style>
    </Box>
  );
}
