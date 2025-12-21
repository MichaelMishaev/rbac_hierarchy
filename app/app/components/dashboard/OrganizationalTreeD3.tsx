'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  InputAdornment,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Fade,
  Snackbar,
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  SupervisorAccount as SupervisorIcon,
  AccountTree as DepartmentIcon,
  Group as TeamIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false); // Prevent infinite loops
  const [errorSnackbar, setErrorSnackbar] = useState<{ open: boolean; message: string; severity: 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'error',
  });

  // HEBREW-ONLY labels (this is a Hebrew-first system)
  const labels = useMemo(() => ({
    zoomIn: 'הגדל',
    zoomOut: 'הקטן',
    fitToScreen: 'התאם למסך',
    showAll: 'הצג הכל',
    fullscreen: 'מסך מלא',
    exitFullscreen: 'צא ממסך מלא',
    downloadExcel: 'הורד אקסל',
    downloadHTML: 'הורד',
    downloading: 'מוריד...',
    noData: 'אין נתוני ארגון זמינים',
    superadmin: 'מנהל על',
    city: 'עיר',
    neighborhood: 'שכונה',
    department: 'מחלקה',
    team: 'צוות',
    cities: 'ערים',
    neighborhoods: 'שכונות',
    activists: 'פעילים',
    managers: 'מנהלים',
    activistCoordinators: 'רכזי שכונות',
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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'שגיאה בטעינת התרשים הארגוני');
      }

      const rawData = await response.json();

      // Handle empty tree response (user with no assignments)
      if (rawData.isEmpty) {
        setData(null);
        setError(rawData.emptyMessage || 'אין נתונים להצגה');
        return;
      }

      const formattedTree = convertToD3Format(rawData);
      setData(formattedTree);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
      setData(null);
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
      if (firstMatch) {
        const newTranslate = calculateNodePosition(firstMatch);
        setTranslate(newTranslate);

        // Optionally adjust zoom to ensure node is visible
        if (firstMatch.length > 3) {
          setZoom(0.7); // Zoom out for deeper nodes
        } else {
          setZoom(0.9); // Normal zoom for shallow nodes
        }
      }
    } else {
      setMatchedNodePaths([]);
    }
  }, [searchTerm, data, searchTree, calculateNodePosition]);

  useEffect(() => {
    fetchOrgTree();
  }, [fetchOrgTree]);

  // Initialize center translation
  useEffect(() => {
    if (typeof window !== 'undefined' && !isUpdatingRef.current) {
      const updateTranslate = () => {
        // Only update translate on initial load or when exiting fullscreen
        if (!searchTerm && !isFullscreen) {
          const containerWidth = Math.min(window.innerWidth - 100, 1400); // Max width with padding
          setTranslate((prev) => {
            const newTranslate = { x: containerWidth / 2, y: 80 };
            // Prevent unnecessary updates with larger threshold
            if (Math.abs(prev.x - newTranslate.x) > 50 || Math.abs(prev.y - newTranslate.y) > 50) {
              return newTranslate;
            }
            return prev;
          });
        }
      };

      updateTranslate();
      window.addEventListener('resize', updateTranslate);
      return () => window.removeEventListener('resize', updateTranslate);
    }
    return undefined; // Explicit return for all code paths
  }, [searchTerm, isFullscreen]);

  // Zoom controls with smooth increments
  const handleZoomIn = useCallback(() => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;

    setZoom((prev) => {
      const newZoom = Math.min(prev + 0.15, 2);
      console.log('Zooming in:', prev, '→', newZoom);
      return newZoom;
    });

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 100);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;

    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.15, 0.3);
      console.log('Zooming out:', prev, '→', newZoom);
      return newZoom;
    });

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 100);
  }, []);

  // HTML download handler (standalone interactive tree)
  const handleDownloadHTML = useCallback(async () => {
    try {
      setIsDownloading(true);
      const response = await fetch('/api/org-tree-export-html');

      if (!response.ok) {
        // Check if unauthorized (403 Forbidden - non-admin user)
        if (response.status === 403) {
          setErrorSnackbar({
            open: true,
            message: 'תכונה זו זמינה למנהלי מערכת בלבד',
            severity: 'warning',
          });
          return;
        }

        throw new Error('Failed to download HTML file');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename: string = filenameMatch?.[1] ?? `org-tree-${new Date().toISOString().split('T')[0]}.html`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading HTML:', err);
      setErrorSnackbar({
        open: true,
        message: 'שגיאה בהורדת קובץ HTML',
        severity: 'error',
      });
    } finally {
      setIsDownloading(false);
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

  // Handle node click for drill-down
  const handleNodeClick = useCallback((nodeDatum: any) => {
    console.log('🖱️ Node clicked:', nodeDatum.name);
    console.log('📊 Node data:', nodeDatum);
    console.log('👶 Has children:', nodeDatum.children?.length || 0);

    // Only allow drill-down for nodes with children (clickable cards)
    if (nodeDatum.children && nodeDatum.children.length > 0) {
      console.log('✅ Opening drawer with', nodeDatum.children.length, 'children');
      setSelectedNode(nodeDatum);
      setDrillDownOpen(true);
    } else {
      console.log('❌ Node has no children, not opening drawer');
    }
  }, []);

  // Close drill-down drawer
  const handleCloseDrillDown = useCallback(() => {
    setDrillDownOpen(false);
  }, []);

  // Close on ESC key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drillDownOpen) {
        handleCloseDrillDown();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [drillDownOpen, handleCloseDrillDown]);

  // Get node color based on type - Election Campaign Color Scheme
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'superadmin':
        return '#7C3AED'; // Deep Purple - Platform Administrator
      case 'area':
        return '#6366F1'; // Indigo - Geographic Area/District
      case 'areamanager':
        return '#2563EB'; // Royal Blue - Regional Campaign Director
      case 'corporation':
      case 'city':
        return '#0EA5E9'; // Sky Blue - City Campaign
      case 'coordinators-group':
        return '#059669'; // Emerald - City Coordinators Group
      case 'managers-group':
        return '#059669'; // Emerald - Manager groups (legacy)
      case 'manager':
      case 'coordinator':
        return '#10B981'; // Green - City Campaign Manager
      case 'supervisors-group':
      case 'activist-coordinators-group':
        return '#F59E0B'; // Amber - Activist Coordinators Group
      case 'supervisor':
      case 'activistCoordinator':
        return '#F97316'; // Orange - Neighborhood Organizer
      case 'site':
      case 'neighborhood':
        return '#EC4899'; // Pink - Campaign District/Neighborhood
      case 'worker':
      case 'activist':
        return '#8B5CF6'; // Violet - Field Volunteer
      default:
        return colors.neutral[400];
    }
  };

  // Get node icon based on type
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'superadmin':
        return <SupervisorIcon sx={{ fontSize: 20 }} />;
      case 'area':
        return <LocationOnIcon sx={{ fontSize: 20 }} />;
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

  // Get translated node type - Election Campaign Terminology
  const getNodeTypeLabel = useCallback((type: string) => {
    const typeLabels: Record<string, string> = {
      superadmin: 'מנהל מערכת',
      area: 'מחוז',
      areamanager: 'מנהל מחוז',
      city: 'עיר',
      'coordinators-group': 'רכזי עיר',
      'managers-group': 'רכזי עיר', // Legacy support
      manager: 'רכז עיר',
      coordinator: 'רכז עיר',
      'supervisors-group': 'רכזי שכונות',
      'activist-coordinators-group': 'רכזי שכונות',
      activistCoordinator: 'רכז שכונתי',
      supervisor: 'רכז שכונתי', // Legacy support
      neighborhood: 'שכונה',
      site: 'שכונה', // Legacy support
      activist: 'פעיל',
      worker: 'פעיל', // Legacy support
    };
    return typeLabels[type] || type;
  }, []);

  // Get translated stat key - Election Campaign Stats
  const getStatLabel = useCallback((key: string) => {
    const statLabels: Record<string, string> = {
      cities: 'ערים',
      areaManagers: 'מנהלי מחוז',
      neighborhoods: 'שכונות',
      activists: 'פעילים',
      managers: 'רכזי עיר', // Legacy support
      coordinators: 'רכזי עיר',
      activistCoordinators: 'רכזי שכונות',
      supervisors: 'רכזי שכונות', // Legacy support
      orphanActivists: 'פעילים לא משויכים',
    };
    return statLabels[key] || key;
  }, []);

  // Custom node renderer with Material-UI components
  const renderCustomNode = useCallback(
    ({ nodeDatum }: any) => {
      const nodeType = nodeDatum.attributes?.type || 'unknown';
      const nodeColor = getNodeColor(nodeType);
      const count = nodeDatum.attributes?.count || {};
      const hasError = nodeDatum.attributes?.hasError || false;
      const errorMessage = nodeDatum.attributes?.errorMessage;

      // Check if this node matches the search term by checking its name
      const isMatched = searchTerm.trim() &&
        nodeDatum.name.toLowerCase().trim().includes(searchTerm.toLowerCase().trim());

      const hasChildren = nodeDatum.children && nodeDatum.children.length > 0;
      const isClickable = hasChildren;

      return (
        <g>
          <foreignObject width="240" height="200" x="-120" y="-100">
            <div
              onClick={() => isClickable && handleNodeClick(nodeDatum)}
              style={{
                width: '220px',
                minHeight: '180px',
                padding: '12px',
                borderRadius: '12px',
                background: hasError
                  ? 'linear-gradient(135deg, #FCA5A5 0%, #EF4444 100%)'
                  : `linear-gradient(135deg, ${nodeColor} 0%, ${nodeColor}dd 100%)`,
                boxShadow: isMatched
                  ? '0 0 20px 4px rgba(255, 215, 0, 0.8), 0 6px 20px rgba(0,0,0,0.3)'
                  : hasError
                  ? '0 0 15px 3px rgba(239, 68, 68, 0.5), 0 4px 12px rgba(0,0,0,0.2)'
                  : '0 4px 16px rgba(0,0,0,0.25)',
                border: isMatched
                  ? '3px solid #FFD700'
                  : hasError
                  ? `3px solid ${colors.error}`
                  : `2px solid rgba(255,255,255,0.3)`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontFamily: 'Roboto, sans-serif',
                transition: 'all 0.3s ease',
                direction: 'rtl', // Hebrew-first system
                transform: isMatched ? 'scale(1.05)' : 'scale(1)',
                cursor: isClickable ? 'pointer' : 'default',
              }}
              onMouseEnter={(e) => {
                if (!isMatched) {
                  e.currentTarget.style.transform = isClickable ? 'translateY(-4px) scale(1.05)' : 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.boxShadow = hasError
                    ? '0 0 20px 5px rgba(239, 68, 68, 0.7), 0 8px 24px rgba(0,0,0,0.3)'
                    : '0 8px 24px rgba(0,0,0,0.35)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMatched) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = hasError
                    ? '0 0 15px 3px rgba(239, 68, 68, 0.5), 0 4px 12px rgba(0,0,0,0.2)'
                    : '0 4px 16px rgba(0,0,0,0.25)';
                }
              }}
              title={hasError ? errorMessage : (isClickable ? 'לחץ לצפייה בפרטים' : undefined)}
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
                    background: hasError ? colors.error : 'rgba(255,255,255,0.95)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: hasError ? '#fff' : nodeColor,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  }}
                >
                  {hasError ? '⚠️' : getNodeIcon(nodeType)}
                </div>
                {nodeDatum.children && nodeDatum.children.length > 0 && (
                  <div
                    style={{
                      marginInlineStart: 'auto',
                      fontSize: '12px',
                      background: hasError ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
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
                  color: '#ffffff',
                  lineHeight: '1.2',
                  maxHeight: '2.4em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              >
                {nodeDatum.name}
              </div>

              {/* Type badge */}
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'rgba(0,0,0,0.2)',
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
                          background: 'rgba(255,255,255,0.9)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontWeight: 500,
                          color: nodeColor,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
    [getNodeTypeLabel, getStatLabel, searchTerm, handleNodeClick]
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

      {/* Campaign Hierarchy Legend */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.neutral[200]}`,
          direction: 'rtl',
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: colors.neutral[800] }}>
          מקרא היררכיית הקמפיין:
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1.5}>
          <Box display="flex" alignItems="center" gap={0.75}>
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: '#7C3AED' }} />
            <Typography variant="caption" sx={{ fontSize: 11, color: colors.neutral[700] }}>
              מנהל מערכת
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.75}>
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: '#6366F1' }} />
            <Typography variant="caption" sx={{ fontSize: 11, color: colors.neutral[700] }}>
              מחוז / אזור
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.75}>
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: '#2563EB' }} />
            <Typography variant="caption" sx={{ fontSize: 11, color: colors.neutral[700] }}>
              מנהל מחוז
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.75}>
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: '#0EA5E9' }} />
            <Typography variant="caption" sx={{ fontSize: 11, color: colors.neutral[700] }}>
              עיר
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.75}>
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: '#10B981' }} />
            <Typography variant="caption" sx={{ fontSize: 11, color: colors.neutral[700] }}>
              רכז עיר
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.75}>
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: '#F97316' }} />
            <Typography variant="caption" sx={{ fontSize: 11, color: colors.neutral[700] }}>
              רכז שכונתי
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.75}>
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: '#EC4899' }} />
            <Typography variant="caption" sx={{ fontSize: 11, color: colors.neutral[700] }}>
              שכונה
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.75}>
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: '#8B5CF6' }} />
            <Typography variant="caption" sx={{ fontSize: 11, color: colors.neutral[700] }}>
              פעיל שטח
            </Typography>
          </Box>
        </Box>
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
        {/* Download HTML Button - Interactive Standalone Tree */}
        <Button
          size="small"
          onClick={handleDownloadHTML}
          disabled={isDownloading}
          variant="contained"
          sx={{
            backgroundColor: colors.status.orange,
            color: '#fff',
            fontWeight: 600,
            boxShadow: shadows.medium,
            display: 'flex',
            gap: 1,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: colors.status.orange,
              filter: 'brightness(0.95)',
              transform: 'translateY(-2px)',
              boxShadow: shadows.large,
            },
            '&:active': {
              transform: 'translateY(0)',
            },
            '&.Mui-disabled': {
              backgroundColor: colors.neutral[300],
              color: colors.neutral[500],
            },
          }}
        >
          {isDownloading ? labels.downloading : labels.downloadHTML}
          <DownloadIcon fontSize="small" />
        </Button>
      </Box>

      {/* SVG Arrow Marker Definition */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#4B5563" />
          </marker>
        </defs>
      </svg>

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
            // Prevent infinite loops - only update if not already updating
            if (isUpdatingRef.current) return;

            isUpdatingRef.current = true;

            // Use requestAnimationFrame to batch updates and prevent loops
            requestAnimationFrame(() => {
              // Sync internal zoom state with our controlled state (larger threshold)
              if (state?.zoom && Math.abs(state.zoom - zoom) > 0.05) {
                setZoom(state.zoom);
              }

              // Only update translate if significant change (larger threshold to prevent jitter)
              if (state?.translate && (
                Math.abs(state.translate.x - translate.x) > 5 ||
                Math.abs(state.translate.y - translate.y) > 5
              )) {
                setTranslate(state.translate);
              }

              // Reset the updating flag after a short delay
              setTimeout(() => {
                isUpdatingRef.current = false;
              }, 100);
            });
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
        /* Arrow marker definition for directional flow */
        .rd3t-svg defs marker {
          fill: #374151;
        }

        .custom-link {
          stroke: #4B5563 !important;
          stroke-width: 4px !important;
          fill: none !important;
          opacity: 0.9;
          transition: all 0.3s ease;
          marker-end: url(#arrowhead);
        }

        .custom-link:hover {
          stroke: #1F2937 !important;
          stroke-width: 5px !important;
          opacity: 1;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
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

      {/* 🚀 2025 UX: Modern Drill-Down Drawer with Glass Morphism */}
      <Drawer
        anchor="right"
        open={drillDownOpen}
        onClose={handleCloseDrillDown}
        SlideProps={{
          direction: 'left',
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: '480px' },
            maxWidth: '100vw',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderLeft: `1px solid rgba(0, 0, 0, 0.05)`,
            boxShadow: '-4px 0 40px rgba(0, 0, 0, 0.15)',
            direction: 'rtl',
          },
        }}
      >
        <Fade in={drillDownOpen} timeout={400}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header with Glass Morphism */}
            <Box
              sx={{
                p: 3,
                background: selectedNode?.attributes?.type
                  ? `linear-gradient(135deg, ${getNodeColor(selectedNode.attributes.type)}15 0%, ${getNodeColor(selectedNode.attributes.type)}05 100%)`
                  : 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
                borderBottom: `1px solid rgba(0, 0, 0, 0.08)`,
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: colors.neutral[900], mb: 0.5 }}>
                    {selectedNode?.name || ''}
                  </Typography>
                  <Chip
                    label={getNodeTypeLabel(selectedNode?.attributes?.type || '')}
                    size="small"
                    sx={{
                      backgroundColor: selectedNode?.attributes?.type
                        ? `${getNodeColor(selectedNode.attributes.type)}20`
                        : colors.neutral[200],
                      color: selectedNode?.attributes?.type
                        ? getNodeColor(selectedNode.attributes.type)
                        : colors.neutral[700],
                      fontWeight: 600,
                      fontSize: '11px',
                    }}
                  />
                </Box>
                <IconButton
                  onClick={handleCloseDrillDown}
                  sx={{
                    color: colors.neutral[600],
                    '&:hover': {
                      backgroundColor: colors.pastel.redLight,
                      color: colors.error,
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Content - Scrollable List */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              {selectedNode?.children && selectedNode.children.length > 0 ? (
                <List sx={{ px: 1 }}>
                  {selectedNode.children.map((child: any, index: number) => {
                    const childType = child.attributes?.type || 'unknown';
                    const childColor = getNodeColor(childType);

                    return (
                      <Box key={index}>
                        <ListItem
                          sx={{
                            borderRadius: borderRadius.lg,
                            mb: 1.5,
                            p: 2,
                            background: `linear-gradient(135deg, ${childColor}08 0%, ${childColor}03 100%)`,
                            border: `1px solid ${childColor}20`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: `linear-gradient(135deg, ${childColor}15 0%, ${childColor}08 100%)`,
                              transform: 'translateX(-4px)',
                              boxShadow: shadows.soft,
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                background: `linear-gradient(135deg, ${childColor} 0%, ${childColor}dd 100%)`,
                                boxShadow: shadows.soft,
                              }}
                            >
                              {childType === 'activist' || childType === 'worker' ? (
                                <PersonIcon />
                              ) : childType === 'neighborhood' || childType === 'site' ? (
                                <LocationOnIcon />
                              ) : childType === 'city' ? (
                                <BusinessIcon />
                              ) : (
                                <TeamIcon />
                              )}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography sx={{ fontWeight: 600, color: colors.neutral[900], fontSize: '14px' }}>
                                {child.name}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                                  <Chip
                                    label={getNodeTypeLabel(childType)}
                                    size="small"
                                    sx={{
                                      height: '20px',
                                      fontSize: '10px',
                                      fontWeight: 600,
                                      backgroundColor: `${childColor}15`,
                                      color: childColor,
                                    }}
                                  />
                                  {/* Position badge for activists */}
                                  {(childType === 'activist' || childType === 'worker') && child.attributes?.position && (
                                    <Chip
                                      label={child.attributes.position}
                                      size="small"
                                      sx={{
                                        height: '20px',
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        backgroundColor: colors.pastel.blueLight,
                                        color: colors.primary,
                                      }}
                                    />
                                  )}
                                </Box>

                                {/* Activist contact details */}
                                {(childType === 'activist' || childType === 'worker') && (
                                  <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {child.attributes?.phone && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PhoneIcon sx={{ fontSize: '14px', color: colors.neutral[500] }} />
                                        <Typography
                                          sx={{
                                            fontSize: '12px',
                                            color: colors.neutral[700],
                                            direction: 'ltr',
                                            textAlign: 'left',
                                          }}
                                        >
                                          {child.attributes.phone}
                                        </Typography>
                                      </Box>
                                    )}
                                    {child.attributes?.email && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <EmailIcon sx={{ fontSize: '14px', color: colors.neutral[500] }} />
                                        <Typography
                                          sx={{
                                            fontSize: '12px',
                                            color: colors.neutral[700],
                                            direction: 'ltr',
                                            textAlign: 'left',
                                          }}
                                        >
                                          {child.attributes.email}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                )}

                                {/* Count attributes for non-activists */}
                                {child.attributes?.count && Object.keys(child.attributes.count).length > 0 && (
                                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {Object.entries(child.attributes.count).map(([key, value]: [string, any]) => (
                                      <Chip
                                        key={key}
                                        label={`${getStatLabel(key)}: ${value}`}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          height: '22px',
                                          fontSize: '11px',
                                          borderColor: `${childColor}40`,
                                          color: childColor,
                                        }}
                                      />
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            }
                            secondaryTypographyProps={{ component: 'div' }}
                          />
                        </ListItem>
                        {index < selectedNode.children.length - 1 && (
                          <Divider sx={{ my: 0.5, borderColor: colors.neutral[100] }} />
                        )}
                      </Box>
                    );
                  })}
                </List>
              ) : (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    color: colors.neutral[500],
                  }}
                >
                  <Typography variant="body2">אין פריטים להצגה</Typography>
                </Box>
              )}
            </Box>

            {/* Footer - Summary */}
            <Box
              sx={{
                p: 2,
                background: 'rgba(243, 244, 246, 0.8)',
                backdropFilter: 'blur(10px)',
                borderTop: `1px solid rgba(0, 0, 0, 0.08)`,
              }}
            >
              <Typography variant="caption" sx={{ color: colors.neutral[600], display: 'block', textAlign: 'center' }}>
                סה&quot;כ: {selectedNode?.children?.length || 0} פריטים
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Drawer>

      {/* Error/Warning Snackbar */}
      <Snackbar
        open={errorSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setErrorSnackbar({ ...errorSnackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setErrorSnackbar({ ...errorSnackbar, open: false })}
          severity={errorSnackbar.severity}
          variant="filled"
          sx={{
            width: '100%',
            direction: 'rtl',
            fontWeight: 600,
            fontSize: '15px',
            boxShadow: shadows.large,
          }}
        >
          {errorSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
