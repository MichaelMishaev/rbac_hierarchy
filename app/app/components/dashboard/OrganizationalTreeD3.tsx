'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  SupervisorAccount as SupervisorIcon,
  AccountTree as DepartmentIcon,
  Group as TeamIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitScreenIcon,
} from '@mui/icons-material';
import dynamic from 'next/dynamic';
import { colors, borderRadius, shadows } from '@/lib/design-system';

// Dynamically import react-d3-tree (client-side only, no SSR)
const Tree = dynamic(() => import('react-d3-tree'), {
  ssr: false,
  loading: () => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="500px">
      <CircularProgress />
    </Box>
  ),
});

interface OrgNode {
  name: string;
  type: 'superadmin' | 'corporation' | 'site' | 'department' | 'team';
  attributes?: {
    [key: string]: any;
  };
  children?: OrgNode[];
}

interface TreeData {
  name: string;
  type?: string;
  attributes?: any;
  children?: TreeData[];
}

export default function OrganizationalTreeD3({ deepMode = false }: { deepMode?: boolean }) {
  const [data, setData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeRef, setTreeRef] = useState<any>(null);

  // HEBREW-ONLY labels (this is a Hebrew-first system)
  const labels = useMemo(() => ({
    zoomIn: 'הגדל',
    zoomOut: 'הקטן',
    fitToScreen: 'התאם למסך',
    noData: 'אין נתוני ארגון זמינים',
    superadmin: 'מנהל על',
    corporation: 'תאגיד',
    site: 'אתר',
    department: 'מחלקה',
    team: 'צוות',
    corporations: 'תאגידים',
    sites: 'אתרים',
    workers: 'עובדים',
    managers: 'מנהלים',
    supervisors: 'מפקחים',
  }), []);

  const fetchOrgTree = useCallback(async () => {
    try {
      setLoading(true);
      const apiEndpoint = deepMode ? '/api/org-tree-deep' : '/api/org-tree';
      const response = await fetch(apiEndpoint);

      if (!response.ok) {
        throw new Error('Failed to fetch organizational tree');
      }

      const rawData = await response.json();
      const formattedTree = convertToD3Format(rawData);
      setData(formattedTree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [deepMode]);

  useEffect(() => {
    fetchOrgTree();
  }, [fetchOrgTree]);

  const convertToD3Format = (node: any): TreeData => {
    return {
      name: node.name,
      type: node.type,
      attributes: {
        type: node.type,
        count: node.count || {},
      },
      children: node.children?.map((child: any) => convertToD3Format(child)) || [],
    };
  };

  // Center translation
  const translate = useMemo(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    return { x: window.innerWidth / 2 - 200, y: 80 };
  }, []);

  // Get node color based on type
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'superadmin':
        return colors.pastel.purple;
      case 'corporation':
        return colors.pastel.blue;
      case 'site':
        return colors.pastel.orange;
      case 'department':
        return colors.pastel.green;
      case 'team':
        return colors.pastel.pink;
      default:
        return colors.neutral[300];
    }
  };

  // Get node icon based on type
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'superadmin':
        return <SupervisorIcon sx={{ fontSize: 20 }} />;
      case 'corporation':
        return <BusinessIcon sx={{ fontSize: 20 }} />;
      case 'site':
        return <LocationOnIcon sx={{ fontSize: 20 }} />;
      case 'department':
        return <DepartmentIcon sx={{ fontSize: 20 }} />;
      case 'team':
        return <TeamIcon sx={{ fontSize: 20 }} />;
      default:
        return null;
    }
  };

  // Get translated node type
  const getNodeTypeLabel = useCallback((type: string) => {
    const typeLabels: Record<string, string> = {
      superadmin: labels.superadmin,
      corporation: labels.corporation,
      site: labels.site,
      department: labels.department,
      team: labels.team,
    };
    return typeLabels[type] || type;
  }, [labels]);

  // Get translated stat key
  const getStatLabel = useCallback((key: string) => {
    const statLabels: Record<string, string> = {
      corporations: labels.corporations,
      sites: labels.sites,
      workers: labels.workers,
      managers: labels.managers,
      supervisors: labels.supervisors,
    };
    return statLabels[key] || key;
  }, [labels]);

  // Custom node renderer with Material-UI components
  const renderCustomNode = useCallback(
    ({ nodeDatum }: any) => {
      const nodeType = nodeDatum.attributes?.type || 'unknown';
      const nodeColor = getNodeColor(nodeType);
      const count = nodeDatum.attributes?.count || {};

      return (
        <g>
          <foreignObject width="240" height="200" x="-120" y="-100">
            <div
              style={{
                width: '220px',
                minHeight: '180px',
                padding: '12px',
                borderRadius: '12px',
                background: nodeColor,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: `2px solid ${nodeColor}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontFamily: 'Roboto, sans-serif',
                transition: 'all 0.3s ease',
                direction: 'rtl', // Hebrew-first system
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
            >
              {/* Header with icon */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: nodeColor,
                  }}
                >
                  {getNodeIcon(nodeType)}
                </div>
                {nodeDatum.children && nodeDatum.children.length > 0 && (
                  <div
                    style={{
                      marginInlineStart: 'auto',
                      fontSize: '12px',
                      background: 'rgba(255,255,255,0.7)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {nodeDatum.children.length}
                  </div>
                )}
              </div>

              {/* Name */}
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: colors.neutral[900],
                  lineHeight: '1.2',
                  maxHeight: '2.4em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {nodeDatum.name}
              </div>

              {/* Type badge */}
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'rgba(0,0,0,0.6)',
                  background: 'rgba(255,255,255,0.5)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  alignSelf: 'flex-end', // RTL alignment
                }}
              >
                {getNodeTypeLabel(nodeType)}
              </div>

              {/* Stats */}
              {Object.keys(count).length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '11px',
                  }}
                >
                  {Object.entries(count)
                    .slice(0, 3)
                    .map(([key, value]: [string, any]) => (
                      <div
                        key={key}
                        style={{
                          background: 'rgba(255,255,255,0.6)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontWeight: 500,
                        }}
                      >
                        <span>{getStatLabel(key)}:</span>
                        <span style={{ fontWeight: 700 }}>{value}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </foreignObject>
        </g>
      );
    },
    [getNodeTypeLabel, getStatLabel]
  );

  const handleZoomIn = () => {
    if (treeRef) {
      // react-d3-tree doesn't expose zoom methods directly
      // This would need to be implemented through the tree's internal state
      console.log('Zoom in');
    }
  };

  const handleZoomOut = () => {
    if (treeRef) {
      console.log('Zoom out');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="500px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!data) {
    return <Alert severity="info">{labels.noData}</Alert>;
  }

  return (
    <Box>
      {/* Control Buttons */}
      <Box display="flex" gap={2} mb={3} justifyContent="flex-start" sx={{ direction: 'rtl' }}>
        <Button
          size="small"
          startIcon={<ZoomInIcon />}
          onClick={handleZoomIn}
          variant="outlined"
          sx={{
            borderColor: colors.neutral[300],
            color: colors.neutral[700],
            '&:hover': {
              borderColor: colors.primary,
              backgroundColor: colors.pastel.blue,
            },
          }}
        >
          {labels.zoomIn}
        </Button>
        <Button
          size="small"
          startIcon={<ZoomOutIcon />}
          onClick={handleZoomOut}
          variant="outlined"
          sx={{
            borderColor: colors.neutral[300],
            color: colors.neutral[700],
            '&:hover': {
              borderColor: colors.primary,
              backgroundColor: colors.pastel.blue,
            },
          }}
        >
          {labels.zoomOut}
        </Button>
        <Button
          size="small"
          startIcon={<FitScreenIcon />}
          variant="outlined"
          sx={{
            borderColor: colors.neutral[300],
            color: colors.neutral[700],
            '&:hover': {
              borderColor: colors.primary,
              backgroundColor: colors.pastel.blue,
            },
          }}
        >
          {labels.fitToScreen}
        </Button>
      </Box>

      {/* React D3 Tree */}
      <Box
        sx={{
          width: '100%',
          height: '700px',
          border: `2px solid ${colors.neutral[200]}`,
          borderRadius: borderRadius.xl,
          overflow: 'hidden',
          background: colors.neutral[50],
          position: 'relative',
        }}
      >
        <Tree
          data={data}
          orientation="vertical"
          translate={translate}
          pathFunc="step"
          zoom={0.9}
          separation={{ siblings: 1.5, nonSiblings: 2 }}
          nodeSize={{ x: 280, y: 240 }}
          renderCustomNodeElement={renderCustomNode}
          enableLegacyTransitions
          transitionDuration={500}
          depthFactor={260}
          scaleExtent={{ min: 0.1, max: 2 }}
          zoomable
          draggable
          collapsible
          shouldCollapseNeighborNodes={false}
          pathClassFunc={() => 'custom-link'}
          ref={(ref) => setTreeRef(ref)}
        />
      </Box>

      {/* Custom link styling */}
      <style jsx global>{`
        .custom-link {
          stroke: ${colors.neutral[400]} !important;
          stroke-width: 2px !important;
          fill: none !important;
        }

        .rd3t-tree-container {
          width: 100%;
          height: 100%;
        }

        .rd3t-node circle {
          display: none !important;
        }

        /* Hide default node circles */
        .rd3t-leaf-node circle,
        .rd3t-node circle {
          fill: transparent !important;
          stroke: transparent !important;
        }
      `}</style>
    </Box>
  );
}
