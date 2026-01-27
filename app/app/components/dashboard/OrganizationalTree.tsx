'use client';

import { useEffect, useState, memo, useCallback } from 'react';
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
  AccountTree as AccountTreeIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  LocationOn as LocationOnIcon,
  SupervisorAccount as SupervisorIcon,
} from '@mui/icons-material';
import { Tree, TreeNode } from 'react-organizational-chart';
import { colors, borderRadius, shadows } from '@/lib/design-system';

// OPTIMIZED: Pre-computed color map instead of function calls per render
const NODE_COLORS: Record<OrgNode['type'], string> = {
  superadmin: colors.pastel.purple,
  corporation: colors.pastel.blue,
  site: colors.pastel.orange,
};

const NODE_ICONS: Record<OrgNode['type'], React.ReactNode> = {
  superadmin: <SupervisorIcon />,
  corporation: <BusinessIcon />,
  site: <LocationOnIcon />,
};

interface OrgNode {
  id: string;
  name: string;
  type: 'superadmin' | 'corporation' | 'site';
  count?: {
    corporations?: number;
    managers?: number;
    supervisors?: number;
    sites?: number;
    workers?: number;
  };
  children?: OrgNode[];
}

export default function OrganizationalTree() {
  const [data, setData] = useState<OrgNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']));

  useEffect(() => {
    fetchOrgTree();
  }, []);

  const fetchOrgTree = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/org-tree');

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

      {/* Tree Visualization */}
      <Box
        sx={{
          overflow: 'auto',
          pb: 4,
          display: 'flex',
          justifyContent: 'center',
          '& .tree-node': {
            transition: 'all 0.3s ease',
          },
          '& > div': {
            display: 'inline-block',
          },
        }}
      >
        <Tree
          lineWidth="3px"
          lineColor={colors.neutral[400]}
          lineBorderRadius="8px"
          label={
            <OrgNodeCard
              node={data}
              onToggle={toggleExpand}
              expanded={expanded.has(data.id)}
              hasChildren={!!data.children && data.children.length > 0}
            />
          }
        >
          {expanded.has(data.id) && data.children?.map(child => (
            <OrgTreeNode
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={toggleExpand}
            />
          ))}
        </Tree>
      </Box>
    </Box>
  );
}

// OPTIMIZED: Memoized recursive tree node to prevent unnecessary re-renders
const OrgTreeNode = memo(function OrgTreeNode({ node, expanded, onToggle }: {
  node: OrgNode;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <TreeNode
      label={
        <OrgNodeCard
          node={node}
          onToggle={onToggle}
          expanded={isExpanded}
          hasChildren={hasChildren}
        />
      }
    >
      {isExpanded && hasChildren && node.children!.map(child => (
        <OrgTreeNode
          key={child.id}
          node={child}
          expanded={expanded}
          onToggle={onToggle}
        />
      ))}
    </TreeNode>
  );
});

// OPTIMIZED: Memoized individual node card with pre-computed colors/icons
const OrgNodeCard = memo(function OrgNodeCard({ node, onToggle, expanded, hasChildren }: {
  node: OrgNode;
  onToggle: (id: string) => void;
  expanded: boolean;
  hasChildren?: boolean;
}) {
  // Use pre-computed constants instead of calling functions on every render
  const color = NODE_COLORS[node.type] || colors.neutral[300];
  const icon = NODE_ICONS[node.type] || <AccountTreeIcon />;

  // Memoize click handler to prevent child re-renders
  const handleClick = useCallback(() => {
    if (hasChildren) {
      onToggle(node.id);
    }
  }, [hasChildren, onToggle, node.id]);

  return (
    <Card
      className="tree-node"
      sx={{
        minWidth: 180,
        maxWidth: 220,
        borderRadius: borderRadius.lg,
        borderTop: `4px solid ${color}`,
        boxShadow: shadows.medium,
        cursor: hasChildren ? 'pointer' : 'default',
        margin: '0 8px',
        '&:hover': hasChildren
          ? {
              transform: 'translateY(-4px)',
              boxShadow: shadows.large,
            }
          : {},
      }}
      onClick={handleClick}
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
            {icon}
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
        <Typography variant="h6" fontSize="0.875rem" fontWeight={600} gutterBottom sx={{ mb: 0.5 }}>
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
            {node.count.corporations !== undefined && (
              <Chip
                label={`Corporations ${node.count.corporations}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 18, justifyContent: 'flex-start' }}
              />
            )}
            {node.count.managers !== undefined && (
              <Chip
                label={`Managers ${node.count.managers}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 18, justifyContent: 'flex-start' }}
              />
            )}
            {node.count.sites !== undefined && (
              <Chip
                label={`Sites ${node.count.sites}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 18, justifyContent: 'flex-start' }}
              />
            )}
            {node.count.supervisors !== undefined && (
              <Chip
                label={`Supervisors ${node.count.supervisors}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 18, justifyContent: 'flex-start' }}
              />
            )}
            {node.count.workers !== undefined && (
              <Chip
                label={`Workers ${node.count.workers}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 18, justifyContent: 'flex-start' }}
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
});
