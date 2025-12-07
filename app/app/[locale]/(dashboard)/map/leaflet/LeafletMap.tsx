'use client';

import { useEffect, useRef, useState } from 'react';
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
  city: string | null;
  latitude: number;
  longitude: number;
  corporation: {
    id: string;
    name: string;
  };
  workers: {
    active: number;
    inactive: number;
    total: number;
  };
  supervisors: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  isActive: boolean;
}

interface LeafletMapProps {
  sites: Site[];
}

export default function LeafletMap({ sites }: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.MarkerClusterGroup | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

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

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !markersLayer.current) return;

    // Clear existing markers
    markersLayer.current.clearLayers();

    // Create color map for corporations
    const corpColors: Record<string, string> = {};
    const colorPalette = [
      colors.primary,
      colors.status.green,
      colors.pastel.purple,
      colors.pastel.orange,
      colors.pastel.pink,
      colors.pastel.blue,
    ];

    sites.forEach((site) => {
      if (!site.latitude || !site.longitude) return;

      // Assign color to corporation
      if (!corpColors[site.corporation.id]) {
        const colorIndex = Object.keys(corpColors).length % colorPalette.length;
        corpColors[site.corporation.id] = colorPalette[colorIndex];
      }

      // Create custom icon
      const markerColor = corpColors[site.corporation.id];
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
            ${site.corporation.name}
          </p>
          <p style="margin: 4px 0; font-size: 13px; color: #555;">
            📍 ${site.address || 'אין כתובת'}${site.city ? `, ${site.city}` : ''}
          </p>
          <p style="margin: 4px 0; font-size: 13px; color: #555;">
            👥 ${site.workers.active} עובדים פעילים
          </p>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler to show details panel
      marker.on('click', () => {
        setSelectedSite(site);
        map.current?.setView([site.latitude, site.longitude], 12, {
          animate: true,
          duration: 1.5,
        });
      });

      // Add to cluster layer
      markersLayer.current?.addLayer(marker);
    });

    // Fit bounds to show all markers
    if (sites.length > 0 && markersLayer.current.getBounds().isValid()) {
      map.current.fitBounds(markersLayer.current.getBounds(), {
        padding: [50, 50],
        maxZoom: 12,
      });
    }
  }, [sites]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', paddingTop: { xs: '140px', sm: '120px', md: '100px' } }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0 }} />

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
                label={selectedSite.corporation.name}
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
              {selectedSite.city && `, ${selectedSite.city}`}
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
                עובדים באתר
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={700}>
              {selectedSite.workers.active}
            </Typography>
            <Typography variant="caption" color={colors.neutral[600]}>
              {selectedSite.workers.total} סה"כ ({selectedSite.workers.inactive} לא פעילים)
            </Typography>
          </Box>

          {/* Supervisors */}
          {selectedSite.supervisors.length > 0 && (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <SupervisorAccount sx={{ color: colors.neutral[700] }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  מפקחים
                </Typography>
              </Box>
              {selectedSite.supervisors.map((supervisor) => (
                <Box
                  key={supervisor.id}
                  sx={{
                    p: 1.5,
                    background: colors.neutral[50],
                    borderRadius: '8px',
                    mb: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {supervisor.name}
                  </Typography>
                  <Typography variant="caption" color={colors.neutral[600]}>
                    {supervisor.email}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Legend - Modern 2025 Design */}
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
          minWidth: { xs: '180px', sm: '240px' },
          maxWidth: { xs: '200px', sm: '260px' },
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
          mb={1.5}
          sx={{
            fontSize: { xs: '13px', sm: '14px' },
            color: colors.neutral[900],
          }}
        >
          מקרא
        </Typography>
        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
          <Box
            sx={{
              width: { xs: 14, sm: 16 },
              height: { xs: 14, sm: 16 },
              borderRadius: '50%',
              background: colors.primary,
              flexShrink: 0,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontSize: { xs: '12px', sm: '13px' },
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            אתרים פעילים
          </Typography>
        </Box>
        <Typography
          variant="caption"
          color={colors.neutral[600]}
          sx={{
            fontSize: { xs: '11px', sm: '12px' },
            display: 'block',
            lineHeight: 1.4,
          }}
        >
          לחץ על סמן לפרטים נוספים
        </Typography>
        <Typography
          variant="caption"
          display="block"
          mt={1}
          color={colors.neutral[600]}
          sx={{
            fontSize: { xs: '11px', sm: '12px' },
            lineHeight: 1.4,
          }}
        >
          ⚡ צבירת סמנים אוטומטית בזום-אאוט
        </Typography>
      </Paper>

      {/* Global styles for Leaflet markers */}
      <style jsx global>{`
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
