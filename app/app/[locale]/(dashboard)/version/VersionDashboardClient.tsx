'use client';

/**
 * Version Dashboard Client Component
 *
 * Displays current versions and deployment history
 * Design: Hebrew/RTL, Monday.com style
 */

import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Code as CodeIcon,
  Build as BuildIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface VersionData {
  current: {
    appVersion: string;
    swVersion: string;
    buildId: string;
    gitSha: string;
    branch: string;
    environment: string;
  };
  deployments: Array<{
    buildId: string;
    appVersion: string;
    swVersion: string;
    branch: string;
    environment: string;
    deployedAt: string;
    gitSha: string;
  }>;
}

export default function VersionDashboardClient() {
  const { data, isLoading, error, refetch } = useQuery<VersionData>({
    queryKey: ['version-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/version/dashboard');
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.statusText}`);
      }
      return res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
        dir="rtl"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }} dir="rtl" lang="he">
        <Alert severity="error">
          שגיאה בטעינת נתוני גרסאות: {(error as Error).message}
        </Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }} dir="rtl" lang="he">
        <Alert severity="warning">לא נמצאו נתוני גרסאות</Alert>
      </Box>
    );
  }

  const getBranchColor = (branch: string): 'success' | 'primary' | 'default' => {
    if (branch === 'main') return 'success';
    if (branch === 'develop') return 'primary';
    return 'default';
  };

  const getEnvironmentColor = (env: string): 'success' | 'info' | 'default' => {
    if (env === 'production') return 'success';
    if (env === 'development') return 'info';
    return 'default';
  };

  return (
    <Box sx={{ p: 3 }} dir="rtl" lang="he">
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#323338' }}>
          ניהול גרסאות
        </Typography>
        <Chip
          icon={<RefreshIcon />}
          label="רענן"
          onClick={() => refetch()}
          sx={{
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#E6E9EF',
            },
          }}
        />
      </Box>

      {/* Current Versions Card */}
      <Card
        sx={{
          mb: 3,
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          overflow: 'visible',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h6"
            sx={{ mb: 3, fontWeight: 700, color: '#323338' }}
          >
            גרסאות נוכחיות
          </Typography>

          <Grid container spacing={3}>
            {/* App Version */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  backgroundColor: '#F6F7FB',
                  border: '1px solid #E6E9EF',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: '#676879', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <CodeIcon sx={{ fontSize: 16 }} />
                  גרסת אפליקציה
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#323338' }}>
                  {data.current.appVersion}
                </Typography>
              </Box>
            </Grid>

            {/* Service Worker Version */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  backgroundColor: '#F6F7FB',
                  border: '1px solid #E6E9EF',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: '#676879', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <BuildIcon sx={{ fontSize: 16 }} />
                  גרסת Service Worker
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#323338' }}>
                  {data.current.swVersion}
                </Typography>
              </Box>
            </Grid>

            {/* Build ID */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  backgroundColor: '#F6F7FB',
                  border: '1px solid #E6E9EF',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: '#676879', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <CalendarIcon sx={{ fontSize: 16 }} />
                  מזהה Build
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: '#323338',
                    wordBreak: 'break-all',
                  }}
                >
                  {data.current.buildId}
                </Typography>
              </Box>
            </Grid>

            {/* Environment & Branch */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  backgroundColor: '#F6F7FB',
                  border: '1px solid #E6E9EF',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: '#676879', mb: 1, display: 'block' }}
                >
                  סביבה וענף
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip
                    label={data.current.environment}
                    color={getEnvironmentColor(data.current.environment)}
                    size="small"
                    sx={{ borderRadius: '8px', fontWeight: 600 }}
                  />
                  <Chip
                    label={data.current.branch}
                    color={getBranchColor(data.current.branch)}
                    size="small"
                    sx={{ borderRadius: '8px', fontWeight: 600 }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Deployment History */}
      <Card
        sx={{
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h6"
            sx={{ mb: 3, fontWeight: 700, color: '#323338' }}
          >
            היסטוריית פריסות ({data.deployments.length})
          </Typography>

          {data.deployments.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: '12px' }}>
              עדיין לא בוצעו פריסות במערכת זו
            </Alert>
          ) : (
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: '12px',
                border: '1px solid #E6E9EF',
                boxShadow: 'none',
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F6F7FB' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#323338' }}>
                      תאריך
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#323338' }}>
                      Build ID
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#323338' }}>
                      גרסת App
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#323338' }}>
                      גרסת SW
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#323338' }}>
                      ענף
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#323338' }}>
                      סביבה
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.deployments.map((deployment, index) => (
                    <TableRow
                      key={deployment.buildId}
                      sx={{
                        '&:hover': { backgroundColor: '#F6F7FB' },
                        backgroundColor: index === 0 ? '#FAFBFF' : 'inherit',
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#676879' }}>
                          {formatDistanceToNow(new Date(deployment.deployedAt), {
                            addSuffix: true,
                            locale: he,
                          })}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: '#9699A6', display: 'block' }}
                        >
                          {new Date(deployment.deployedAt).toLocaleString('he-IL', {
                            timeZone: 'Asia/Jerusalem',
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            color: '#323338',
                            fontSize: '0.875rem',
                          }}
                        >
                          {deployment.buildId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={deployment.appVersion}
                          size="small"
                          sx={{
                            borderRadius: '8px',
                            fontWeight: 600,
                            backgroundColor: '#E6E9EF',
                            color: '#323338',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={deployment.swVersion}
                          size="small"
                          sx={{
                            borderRadius: '8px',
                            fontWeight: 600,
                            backgroundColor: '#E6E9EF',
                            color: '#323338',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={deployment.branch}
                          color={getBranchColor(deployment.branch)}
                          size="small"
                          sx={{ borderRadius: '8px', fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={deployment.environment}
                          color={getEnvironmentColor(deployment.environment)}
                          size="small"
                          sx={{ borderRadius: '8px', fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
