'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  TextField,
  InputAdornment,
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
  Search as SearchIcon,
  Clear as ClearIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
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
  const [zoom, setZoom] = useState(0.9);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [matchedNodePaths, setMatchedNodePaths] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const treeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // HEBREW-ONLY labels (this is a Hebrew-first system)
  const labels = useMemo(() => ({
    zoomIn: 'הגדל',
    zoomOut: 'הקטן',
    fitToScreen: 'התאם למסך',
    fullscreen: 'מסך מלא',
    exitFullscreen: 'צא ממסך מלא',
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
    searchPlaceholder: 'חפש צומת בעץ...',
    noMatch: 'לא נמצאו תוצאות',
    matchesFound: 'נמצאו',
    matches: 'תוצאות',
  }), []);

  const convertToD3Format = useCallback((node: any): TreeData => {
    return {
      name: node.name,
      type: node.type,
      attributes: {
        type: node.type,
        count: node.count || {},
      },
      children: node.children?.map((child: any) => convertToD3Format(child)) || [],
    };
  }, []);

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
  }, [deepMode, convertToD3Format]);

  // Search tree recursively to find all matching nodes
  const searchTree = useCallback((node: TreeData, term: string, path: string[] = [], matches: string[][] = []): string[][] => {
    if (!term.trim()) return [];

    const currentPath = [...path, node.name];

    // Check if current node matches (case-insensitive, trimmed)
    const nodeName = node.name.toLowerCase().trim();
    const searchTerm = term.toLowerCase().trim();

    if (nodeName.includes(searchTerm)) {
      matches.push(currentPath);
    }

    // Search in children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        searchTree(child, term, currentPath, matches);
      }
    }

    return matches;
  }, []);

  // Calculate node position in tree for centering
  const calculateNodePosition = useCallback((matchPath: string[]) => {
    const depth = matchPath.length - 1;

    // Tree configuration from Tree component props
    const depthFactor = 260;  // vertical spacing between levels
    const nodeSize = { x: 280, y: 240 };  // horizontal spacing

    // Calculate Y position (vertical) based on depth
    const yPosition = depth * depthFactor;

    // Calculate X position (horizontal) - this is an approximation
    // For more precise positioning, we'd need the full tree structure
    const xPosition = 0; // Center horizontally for now

    // Calculate translate to center this position in viewport
    if (typeof window !== 'undefined') {
      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = 350; // Tree container is 700px, so center is 350px

      return {
        x: viewportCenterX - xPosition,
        y: viewportCenterY - yPosition - 100 // Adjust for node height
      };
    }

    return { x: 0, y: 0 };
  }, []);

  // Handle search
  useEffect(() => {
    if (!data || !searchTerm.trim()) {
      setMatchedNodePaths([]);
      return;
    }

    console.log('Searching for:', searchTerm);
    const matches = searchTree(data, searchTerm);
    console.log('Found matches:', matches.length, matches);

    if (matches.length > 0) {
      // Store all matched paths as flattened strings
      const pathStrings = matches.map(path => path.join('->'));
      setMatchedNodePaths(pathStrings);

      // Center on the first matched node
      const firstMatch = matches[0];
      const newTranslate = calculateNodePosition(firstMatch);
      setTranslate(newTranslate);

      // Optionally adjust zoom to ensure node is visible
      if (firstMatch.length > 3) {
        setZoom(0.7); // Zoom out for deeper nodes
      } else {
        setZoom(0.9); // Normal zoom for shallow nodes
      }
    } else {
      setMatchedNodePaths([]);
    }
  }, [searchTerm, data, searchTree, calculateNodePosition]);

  useEffect(() => {
    fetchOrgTree();
  }, [fetchOrgTree]);

  // Initialize center translation and measure dimensions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateDimensions = () => {
        // Get the container width (accounting for padding/margins)
        const containerWidth = Math.min(window.innerWidth - 100, 1400); // Max width with padding
        const containerHeight = 700;

        setDimensions((prev) => {
          // Only update if dimensions actually changed (prevent infinite loops)
          if (prev.width !== containerWidth || prev.height !== containerHeight) {
            return { width: containerWidth, height: containerHeight };
          }
          return prev;
        });

        // Only update translate on initial load or when exiting fullscreen
        if (!searchTerm && !isFullscreen) {
          setTranslate((prev) => {
            const newTranslate = { x: containerWidth / 2, y: 80 };
            // Prevent unnecessary updates
            if (Math.abs(prev.x - newTranslate.x) > 10 || Math.abs(prev.y - newTranslate.y) > 10) {
              return newTranslate;
            }
            return prev;
          });
        }
      };

      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, [searchTerm, isFullscreen]);

  // Zoom controls with smooth increments
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.min(prev + 0.15, 2);
      console.log('Zooming in:', prev, '→', newZoom);
      return newZoom;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.15, 0.3);
      console.log('Zooming out:', prev, '→', newZoom);
      return newZoom;
    });
  }, []);

  const handleFitToScreen = useCallback(() => {
    console.log('Resetting to default view');
    setZoom(0.9);
    setTranslate({
      x: dimensions.width > 0 ? dimensions.width / 2 : window.innerWidth / 2,
      y: 80
    });
  }, [dimensions]);

  // Fullscreen handler
  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen((prev) => {
        // Only update if state actually changed
        if (prev !== isNowFullscreen) {
          return isNowFullscreen;
        }
        return prev;
      });
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Get node color based on type
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'superadmin':
        return colors.pastel.purple;
      case 'areamanager':
        return colors.pastel.blueLight;
      case 'corporation':
        return colors.pastel.blue;
      case 'managers-group':
        return colors.pastel.greenLight;
      case 'manager':
        return colors.pastel.green;
      case 'supervisors-group':
        return colors.pastel.yellowLight;
      case 'supervisor':
        return colors.pastel.yellow;
      case 'site':
        return colors.pastel.orange;
      case 'worker':
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
      case 'areamanager':
        return <DepartmentIcon sx={{ fontSize: 20 }} />;
      case 'corporation':
        return <BusinessIcon sx={{ fontSize: 20 }} />;
      case 'managers-group':
      case 'manager':
        return <SupervisorIcon sx={{ fontSize: 20 }} />;
      case 'supervisors-group':
      case 'supervisor':
        return <SupervisorIcon sx={{ fontSize: 18 }} />;
      case 'site':
        return <LocationOnIcon sx={{ fontSize: 20 }} />;
      case 'worker':
        return <TeamIcon sx={{ fontSize: 18 }} />;
      default:
        return null;
    }
  };

  // Get translated node type
  const getNodeTypeLabel = useCallback((type: string) => {
    const typeLabels: Record<string, string> = {
      superadmin: 'מנהל על',
      areamanager: 'מנהל אזורי',
      corporation: 'תאגיד',
      'managers-group': 'קבוצת מנהלים',
      manager: 'מנהל',
      'supervisors-group': 'קבוצת מפקחים',
      supervisor: 'מפקח',
      site: 'אתר',
      worker: 'עובד',
    };
    return typeLabels[type] || type;
  }, []);

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

  // Build node path from nodeDatum
  const buildNodePath = useCallback((nodeDatum: any): string => {
    const path: string[] = [];
    let current = nodeDatum;

    // Traverse up the tree to build the full path
    while (current) {
      path.unshift(current.name);
      current = current.parent;
    }

    return path.join('->');
  }, []);

  // Custom node renderer with Material-UI components
  const renderCustomNode = useCallback(
    ({ nodeDatum }: any) => {
      const nodeType = nodeDatum.attributes?.type || 'unknown';
      const nodeColor = getNodeColor(nodeType);
      const count = nodeDatum.attributes?.count || {};

      // Check if this node matches the search term by checking its name
      const isMatched = searchTerm.trim() &&
        nodeDatum.name.toLowerCase().trim().includes(searchTerm.toLowerCase().trim());

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
                boxShadow: isMatched
                  ? '0 0 20px 4px rgba(255, 215, 0, 0.8), 0 4px 12px rgba(0,0,0,0.15)'
                  : '0 4px 12px rgba(0,0,0,0.15)',
                border: isMatched
                  ? '3px solid #FFD700'
                  : `2px solid ${nodeColor}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontFamily: 'Roboto, sans-serif',
                transition: 'all 0.3s ease',
                direction: 'rtl', // Hebrew-first system
                transform: isMatched ? 'scale(1.05)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (!isMatched) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMatched) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }
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
    [getNodeTypeLabel, getStatLabel, searchTerm]
  );

  // Note: Zoom controls are built into react-d3-tree and work via mouse/trackpad
  // The buttons are kept for UI consistency but zoom is handled natively by the library

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
    <Box
      ref={containerRef}
      sx={{
        ...(isFullscreen && {
          backgroundColor: colors.neutral[0],
          padding: 4,
          height: '100vh',
          overflowY: 'auto',
        }),
      }}
    >
      {/* Search Bar */}
      <Box sx={{ mb: 3, direction: 'rtl' }}>
        <TextField
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={labels.searchPlaceholder}
          variant="outlined"
          size="medium"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: colors.neutral[500] }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm('')}
                  sx={{
                    color: colors.neutral[500],
                    '&:hover': {
                      backgroundColor: colors.pastel.redLight,
                      color: colors.error,
                    },
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            direction: 'rtl',
            '& .MuiOutlinedInput-root': {
              backgroundColor: colors.neutral[0],
              '&:hover fieldset': {
                borderColor: colors.primary,
              },
              '&.Mui-focused fieldset': {
                borderColor: colors.primary,
              },
            },
          }}
        />
        {searchTerm && matchedNodePaths.length === 0 && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              color: colors.error,
              textAlign: 'right',
            }}
          >
            {labels.noMatch}
          </Typography>
        )}
        {searchTerm && matchedNodePaths.length > 0 && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 1,
              color: colors.status.green,
              textAlign: 'right',
              fontWeight: 600,
            }}
          >
            {labels.matchesFound} {matchedNodePaths.length} {labels.matches}
          </Typography>
        )}
      </Box>

      {/* Control Buttons with current zoom level display */}
      <Box display="flex" gap={2} mb={3} justifyContent="flex-start" alignItems="center" sx={{ direction: 'rtl' }}>
        <Button
          size="small"
          onClick={handleZoomIn}
          variant="outlined"
          disabled={zoom >= 2}
          sx={{
            borderColor: colors.neutral[300],
            color: colors.neutral[700],
            display: 'flex',
            gap: 1,
            '&:hover': {
              borderColor: colors.primary,
              backgroundColor: colors.pastel.blue,
            },
            '&.Mui-disabled': {
              borderColor: colors.neutral[200],
              color: colors.neutral[400],
            },
          }}
        >
          {labels.zoomIn}
          <ZoomInIcon fontSize="small" />
        </Button>
        <Button
          size="small"
          onClick={handleZoomOut}
          variant="outlined"
          disabled={zoom <= 0.3}
          sx={{
            borderColor: colors.neutral[300],
            color: colors.neutral[700],
            display: 'flex',
            gap: 1,
            '&:hover': {
              borderColor: colors.primary,
              backgroundColor: colors.pastel.blue,
            },
            '&.Mui-disabled': {
              borderColor: colors.neutral[200],
              color: colors.neutral[400],
            },
          }}
        >
          {labels.zoomOut}
          <ZoomOutIcon fontSize="small" />
        </Button>
        <Button
          size="small"
          onClick={handleFitToScreen}
          variant="outlined"
          sx={{
            borderColor: colors.neutral[300],
            color: colors.neutral[700],
            display: 'flex',
            gap: 1,
            '&:hover': {
              borderColor: colors.primary,
              backgroundColor: colors.pastel.blue,
            },
          }}
        >
          {labels.fitToScreen}
          <FitScreenIcon fontSize="small" />
        </Button>

        {/* Fullscreen Button - 2025 UX Best Practice */}
        <Button
          size="small"
          onClick={handleFullscreen}
          variant="contained"
          sx={{
            backgroundColor: isFullscreen ? colors.error : colors.primary,
            color: '#fff',
            fontWeight: 600,
            boxShadow: shadows.medium,
            display: 'flex',
            gap: 1,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: isFullscreen ? colors.error : colors.primary,
              filter: 'brightness(0.95)',
              transform: 'translateY(-2px)',
              boxShadow: shadows.large,
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          }}
        >
          {isFullscreen ? labels.exitFullscreen : labels.fullscreen}
          {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
        </Button>
      </Box>

      {/* React D3 Tree */}
      <Box
        sx={{
          width: '100%',
          height: isFullscreen ? 'calc(100vh - 220px)' : '700px',
          border: `2px solid ${colors.neutral[200]}`,
          borderRadius: borderRadius.xl,
          overflow: 'hidden',
          background: colors.neutral[50],
          position: 'relative',
          transition: 'height 0.3s ease',
        }}
      >
        <Tree
          data={data}
          orientation="vertical"
          translate={translate}
          pathFunc="step"
          zoom={zoom}
          onUpdate={(state: any) => {
            // Sync internal zoom state with our controlled state
            if (state?.zoom && Math.abs(state.zoom - zoom) > 0.01) {
              setZoom(state.zoom);
            }
            if (state?.translate && (
              Math.abs(state.translate.x - translate.x) > 1 ||
              Math.abs(state.translate.y - translate.y) > 1
            )) {
              setTranslate(state.translate);
            }
          }}
          separation={{ siblings: 1.5, nonSiblings: 2 }}
          nodeSize={{ x: 280, y: 240 }}
          renderCustomNodeElement={renderCustomNode}
          enableLegacyTransitions
          transitionDuration={500}
          depthFactor={260}
          scaleExtent={{ min: 0.3, max: 2 }}
          zoomable
          draggable
          collapsible
          shouldCollapseNeighborNodes={false}
          pathClassFunc={() => 'custom-link'}
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

        /* Ensure SVG is properly sized and zoomable */
        .rd3t-svg {
          width: 100% !important;
          height: 100% !important;
          cursor: grab;
          transition: transform 0.3s ease-out;
        }

        .rd3t-svg:active {
          cursor: grabbing;
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

        /* Ensure zoom controls don't interfere with tree interaction */
        .rd3t-g {
          pointer-events: all;
        }
      `}</style>
    </Box>
  );
}
