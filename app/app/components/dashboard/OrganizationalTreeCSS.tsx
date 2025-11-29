'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Business as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  LocationOn as LocationOnIcon,
  SupervisorAccount as SupervisorIcon,
  AccountTree as DepartmentIcon,
  Group as TeamIcon,
} from '@mui/icons-material';
import { colors, borderRadius, shadows } from '@/lib/design-system';

interface OrgNode {
  id: string;
  name: string;
  type: 'superadmin' | 'corporation' | 'site' | 'department' | 'team';
  count?: {
    corporations?: number;
    managers?: number;
    supervisors?: number;
    sites?: number;
    workers?: number;
    departments?: number;
    teams?: number;
    employees?: number;
    members?: number;
  };
  children?: OrgNode[];
}

export default function OrganizationalTreeCSS({ deepMode = false }: { deepMode?: boolean }) {
  const [data, setData] = useState<OrgNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']));

  useEffect(() => {
    fetchOrgTree();
  }, [deepMode]);

  const fetchOrgTree = async () => {
    try {
      setLoading(true);
      const apiEndpoint = deepMode ? '/api/org-tree-deep' : '/api/org-tree';
      const response = await fetch(apiEndpoint);

      if (!response.ok) {
        throw new Error('Failed to fetch organizational tree');
      }

      const treeData = await response.json();
      setData(treeData);
      setExpanded(new Set(['root'])); // Start with root expanded
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (nodeId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!data) return;

    const allIds = new Set<string>();
    const collectIds = (node: OrgNode) => {
      allIds.add(node.id);
      node.children?.forEach(collectIds);
    };
    collectIds(data);
    setExpanded(allIds);
  };

  const collapseAll = () => {
    setExpanded(new Set(['root']));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
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
    return (
      <Alert severity="info">
        No organizational data available
      </Alert>
    );
  }

  return (
    <Box>
      {/* Toolbar */}
      <Box display="flex" gap={2} mb={3} justifyContent="flex-end">
        <Button
          size="small"
          startIcon={<ExpandMoreIcon />}
          onClick={expandAll}
          variant="outlined"
        >
          Expand All
        </Button>
        <Button
          size="small"
          startIcon={<ChevronRightIcon />}
          onClick={collapseAll}
          variant="outlined"
        >
          Collapse All
        </Button>
      </Box>

      {/* CSS-Based Tree */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          overflow: 'auto',
          pb: 4,
        }}
      >
        <Box
          className="org-tree"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',

            // Root node connector - vertical line from parent to children
            '& .tree-root-wrapper': {
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
            },
            '& .tree-root-wrapper::after': {
              content: '""',
              position: 'absolute',
              bottom: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderLeft: `2px solid ${colors.neutral[400]}`,
              height: '20px',
              display: 'none', // Hidden by default
            },
            '& .tree-root-wrapper:has(+ .tree-node-list)::after': {
              display: 'block', // Show only when followed by children
            },

            '& .tree-node-list': {
              paddingTop: '20px',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
            },
            '& .tree-node-list::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '50%',
              borderLeft: `2px solid ${colors.neutral[400]}`,
              height: '20px',
            },
            '& .tree-node-item': {
              position: 'relative',
              display: 'inline-block',
              verticalAlign: 'top',
            },
            // Vertical connector from parent node to its children
            '& .tree-node-item > *:first-child::after': {
              content: '""',
              position: 'absolute',
              bottom: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              borderLeft: `2px solid ${colors.neutral[400]}`,
              height: '20px',
              display: 'none',
            },
            '& .tree-node-item:has(.tree-node-list) > *:first-child::after': {
              display: 'block',
            },
            '& .tree-node-item::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: '50%',
              borderTop: `2px solid ${colors.neutral[400]}`,
              width: '50%',
              height: '20px',
            },
            '& .tree-node-item::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '50%',
              borderTop: `2px solid ${colors.neutral[400]}`,
              borderRight: `2px solid ${colors.neutral[400]}`,
              width: '50%',
              height: '20px',
            },
            '& .tree-node-item:only-child::after': {
              display: 'none',
            },
            '& .tree-node-item:only-child::before': {
              width: 0,
              borderTop: 'none',
            },
            '& .tree-node-item:first-child::before': {
              borderLeft: `2px solid ${colors.neutral[400]}`,
              borderTopLeftRadius: '8px',
            },
            '& .tree-node-item:last-child::after': {
              borderTopRightRadius: '8px',
            },
            '& .tree-node-item:last-child::before': {
              borderRight: `2px solid ${colors.neutral[400]}`,
              borderTopRightRadius: '8px',
              borderTopLeftRadius: 0,
            },
          }}
        >
          <Box className="tree-root-wrapper">
            <TreeNode
              node={data}
              expanded={expanded.has(data.id)}
              onToggle={toggleExpand}
              hasChildren={!!data.children && data.children.length > 0}
            />
          </Box>

          {expanded.has(data.id) && data.children && data.children.length > 0 && (
            <Box className="tree-node-list">
              {data.children.map(child => (
                <Box key={child.id} className="tree-node-item">
                  <RecursiveTreeNode
                    node={child}
                    expanded={expanded}
                    onToggle={toggleExpand}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// TreeNode component
function TreeNode({ node, expanded, onToggle, hasChildren }: {
  node: OrgNode;
  expanded: boolean;
  onToggle: (id: string) => void;
  hasChildren: boolean;
}) {
  const getNodeColor = (type: OrgNode['type']) => {
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

  const getNodeIcon = (type: OrgNode['type']) => {
    switch (type) {
      case 'superadmin':
        return <SupervisorIcon />;
      case 'corporation':
        return <BusinessIcon />;
      case 'site':
        return <LocationOnIcon />;
      case 'department':
        return <DepartmentIcon />;
      case 'team':
        return <TeamIcon />;
      default:
        return null;
    }
  };

  const color = getNodeColor(node.type);

  return (
    <Card
      sx={{
        minWidth: 180,
        maxWidth: 220,
        borderRadius: borderRadius.lg,
        borderTop: `4px solid ${color}`,
        boxShadow: shadows.medium,
        cursor: hasChildren ? 'pointer' : 'default',
        margin: '0 auto',
        display: 'inline-block',
        transition: 'all 0.3s ease',
        '&:hover': hasChildren
          ? {
              transform: 'translateY(-4px)',
              boxShadow: shadows.large,
            }
          : {},
      }}
      onClick={() => hasChildren && onToggle(node.id)}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: color,
              color: 'white',
            }}
          >
            {getNodeIcon(node.type)}
          </Avatar>

          {hasChildren && (
            <IconButton
              size="small"
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
                p: 0.5,
              }}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Name */}
        <Typography variant="h6" fontSize="0.875rem" fontWeight={600} sx={{ mb: 0.5 }}>
          {node.name}
        </Typography>

        {/* Type Badge */}
        <Chip
          label={node.type}
          size="small"
          sx={{
            bgcolor: `${color}20`,
            color: color,
            fontWeight: 600,
            fontSize: '0.65rem',
            height: 18,
            mb: 0.5,
            textTransform: 'capitalize',
          }}
        />

        {/* Stats */}
        {node.count && (
          <Box display="flex" flexDirection="column" gap={0.3} mt={0.5}>
            {Object.entries(node.count).map(([key, value]) => (
              <Chip
                key={key}
                label={`${key.charAt(0).toUpperCase() + key.slice(1)} ${value}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 18, justifyContent: 'flex-start' }}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// Recursive TreeNode component for any depth
function RecursiveTreeNode({ node, expanded, onToggle }: {
  node: OrgNode;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = !!node.children && node.children.length > 0;

  return (
    <>
      <TreeNode
        node={node}
        expanded={isExpanded}
        onToggle={onToggle}
        hasChildren={hasChildren}
      />

      {isExpanded && hasChildren && (
        <Box className="tree-node-list">
          {node.children!.map(child => (
            <Box key={child.id} className="tree-node-item">
              <RecursiveTreeNode
                node={child}
                expanded={expanded}
                onToggle={onToggle}
              />
            </Box>
          ))}
        </Box>
      )}
    </>
  );
}
