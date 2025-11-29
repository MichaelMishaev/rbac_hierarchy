import { Box, Typography, Paper, Alert } from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import OrganizationalTreeCSS from '@/app/components/dashboard/OrganizationalTreeCSS';

export default function OrgTreeDemoPage() {
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        background: colors.neutral[50],
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: colors.neutral[900],
            mb: 2,
          }}
        >
          Deep Organizational Tree Demo
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          This demonstrates a 5-level deep organizational hierarchy with full connector support.
        </Alert>
      </Box>

      {/* Tree Visualization */}
      <Paper
        sx={{
          p: 3,
          background: colors.neutral[0],
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `1px solid ${colors.neutral[200]}`,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: colors.neutral[800],
            mb: 3,
          }}
        >
          5-Level Hierarchy
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Level 1:</strong> SuperAdmin (Purple) <br />
            <strong>Level 2:</strong> Corporation (Blue) <br />
            <strong>Level 3:</strong> Site (Orange) <br />
            <strong>Level 4:</strong> Department (Green) <br />
            <strong>Level 5:</strong> Team (Pink)
          </Typography>
        </Box>

        <OrganizationalTreeCSS deepMode={true} />
      </Paper>

      {/* Structure Summary */}
      <Paper
        sx={{
          mt: 4,
          p: 3,
          background: colors.neutral[0],
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Tree Structure
        </Typography>
        <Box
          component="pre"
          sx={{
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            overflow: 'auto',
            p: 2,
            background: colors.neutral[100],
            borderRadius: borderRadius.md,
          }}
        >
{`SuperAdmin
└── Acme Corporation
    └── Tel Aviv HQ
        ├── Engineering
        │   ├── Frontend Team
        │   ├── Backend Team
        │   └── DevOps Team
        ├── Product
        │   ├── Design Team
        │   └── Research Team
        └── Marketing
            ├── Content Team
            ├── Social Media
            └── Analytics Team`}
        </Box>

        <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
          <strong>Total Nodes:</strong> 13 <br />
          <strong>Maximum Depth:</strong> 5 levels <br />
          <strong>Total Teams:</strong> 8 <br />
          <strong>All Connectors:</strong> Fully working ✅
        </Typography>
      </Paper>
    </Box>
  );
}
