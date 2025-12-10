'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  Stack,
} from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import RtlButton from '@/app/components/ui/RtlButton';
import { getStoredWebVitals, clearStoredWebVitals, WEB_VITALS_THRESHOLDS } from '@/lib/web-vitals';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';

type WebVital = {
  name: string;
  value: number;
  rating: string;
  timestamp: number;
};

export default function PerformanceDashboardClient() {
  const [vitals, setVitals] = useState<WebVital[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<Record<string, WebVital>>({});

  // Load stored vitals
  useEffect(() => {
    loadVitals();

    // Listen for new Web Vitals
    const handleWebVital = (event: Event) => {
      const customEvent = event as CustomEvent;
      const metric = customEvent.detail;

      setLiveMetrics((prev) => ({
        ...prev,
        [metric.name]: metric,
      }));

      // Reload stored vitals
      loadVitals();
    };

    window.addEventListener('web-vital', handleWebVital);

    return () => {
      window.removeEventListener('web-vital', handleWebVital);
    };
  }, []);

  const loadVitals = () => {
    const stored = getStoredWebVitals();
    setVitals(stored);
  };

  const handleRefresh = () => {
    loadVitals();
  };

  const handleClear = () => {
    clearStoredWebVitals();
    setVitals([]);
    setLiveMetrics({});
  };

  // Calculate aggregated stats
  const getStats = (metricName: string) => {
    const filtered = vitals.filter((v) => v.name === metricName);
    if (filtered.length === 0) return null;

    const values = filtered.map((v) => v.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    const good = filtered.filter((v) => v.rating === 'good').length;
    const needsImprovement = filtered.filter((v) => v.rating === 'needs-improvement').length;
    const poor = filtered.filter((v) => v.rating === 'poor').length;

    return {
      avg,
      min,
      max,
      count: filtered.length,
      good,
      needsImprovement,
      poor,
    };
  };

  const metrics = [
    {
      name: 'LCP',
      title: 'Largest Contentful Paint',
      description: 'Loading performance - how fast main content renders',
      icon: <VisibilityIcon />,
      color: colors.status.blue,
      unit: 'ms',
      threshold: WEB_VITALS_THRESHOLDS.LCP.good * 1000,
    },
    {
      name: 'INP',
      title: 'Interaction to Next Paint',
      description: 'Responsiveness - time from interaction to next paint',
      icon: <TouchAppIcon />,
      color: colors.status.green,
      unit: 'ms',
      threshold: WEB_VITALS_THRESHOLDS.INP.good,
    },
    {
      name: 'CLS',
      title: 'Cumulative Layout Shift',
      description: 'Visual stability - unexpected layout shifts',
      icon: <SpeedIcon />,
      color: colors.status.purple,
      unit: '',
      threshold: WEB_VITALS_THRESHOLDS.CLS.good,
    },
    {
      name: 'FCP',
      title: 'First Contentful Paint',
      description: 'Perceived load speed - first element renders',
      icon: <TimerIcon />,
      color: colors.status.orange,
      unit: 'ms',
      threshold: WEB_VITALS_THRESHOLDS.FCP.good * 1000,
    },
    {
      name: 'TTFB',
      title: 'Time to First Byte',
      description: 'Server response time',
      icon: <NetworkCheckIcon />,
      color: colors.status.yellow,
      unit: 'ms',
      threshold: WEB_VITALS_THRESHOLDS.TTFB.good,
    },
  ];

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return colors.status.green;
      case 'needs-improvement':
        return colors.status.orange;
      case 'poor':
        return colors.status.red;
      default:
        return colors.neutral[500];
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '') {
      return value.toFixed(3);
    }
    return `${Math.round(value)}${unit}`;
  };

  return (
    <Box>
      {/* Actions */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <RtlButton
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          variant="outlined"
          size="small"
        >
          Refresh
        </RtlButton>
        <RtlButton
          startIcon={<DeleteIcon />}
          onClick={handleClear}
          variant="outlined"
          color="error"
          size="small"
        >
          Clear Data
        </RtlButton>
      </Box>

      {/* Live Metrics Cards */}
      {Object.keys(liveMetrics).length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          🎉 Receiving live metrics! New measurements will appear in real-time.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric) => {
          const stats = getStats(metric.name);
          const live = liveMetrics[metric.name];

          return (
            <Grid item xs={12} sm={6} lg={4} key={metric.name}>
              <Card
                sx={{
                  background: colors.neutral[0],
                  borderRadius: borderRadius.xl,
                  boxShadow: shadows.medium,
                  border: `1px solid ${colors.neutral[200]}`,
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                {live && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: colors.status.green,
                      animation: 'pulse 2s infinite',
                      boxShadow: `0 0 0 0 ${colors.status.green}`,
                      '@keyframes pulse': {
                        '0%': {
                          boxShadow: `0 0 0 0 ${colors.status.green}`,
                        },
                        '70%': {
                          boxShadow: `0 0 0 10px rgba(76, 175, 80, 0)`,
                        },
                        '100%': {
                          boxShadow: `0 0 0 0 rgba(76, 175, 80, 0)`,
                        },
                      },
                    }}
                  />
                )}

                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: borderRadius.lg,
                        background: `${metric.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: metric.color,
                        mr: 2,
                      }}
                    >
                      {metric.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0 }}>
                        {metric.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {metric.title}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, minHeight: 40 }}
                  >
                    {metric.description}
                  </Typography>

                  {stats ? (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                          {formatValue(stats.avg, metric.unit)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Average ({stats.count} samples)
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((stats.avg / metric.threshold) * 100, 100)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: colors.neutral[200],
                            '& .MuiLinearProgress-bar': {
                              backgroundColor:
                                stats.avg <= metric.threshold
                                  ? colors.status.green
                                  : colors.status.red,
                            },
                          }}
                        />
                      </Box>

                      <Stack direction="row" spacing={1}>
                        <Chip
                          label={`${stats.good} good`}
                          size="small"
                          sx={{
                            backgroundColor: `${colors.status.green}15`,
                            color: colors.status.green,
                          }}
                        />
                        <Chip
                          label={`${stats.needsImprovement} ok`}
                          size="small"
                          sx={{
                            backgroundColor: `${colors.status.orange}15`,
                            color: colors.status.orange,
                          }}
                        />
                        <Chip
                          label={`${stats.poor} poor`}
                          size="small"
                          sx={{
                            backgroundColor: `${colors.status.red}15`,
                            color: colors.status.red,
                          }}
                        />
                      </Stack>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No data yet. Navigate through the app to collect metrics.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Detailed Table */}
      {vitals.length > 0 && (
        <Card
          sx={{
            background: colors.neutral[0],
            borderRadius: borderRadius.xl,
            boxShadow: shadows.medium,
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              Recent Measurements
            </Typography>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vitals.slice(-20).reverse().map((vital, index) => {
                  const metric = metrics.find((m) => m.name === vital.name);
                  return (
                    <TableRow key={index}>
                      <TableCell>{vital.name}</TableCell>
                      <TableCell>
                        {formatValue(vital.value, metric?.unit || 'ms')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={vital.rating}
                          size="small"
                          sx={{
                            backgroundColor: `${getRatingColor(vital.rating)}15`,
                            color: getRatingColor(vital.rating),
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(vital.timestamp).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {vitals.length === 0 && (
        <Alert severity="info">
          No performance metrics collected yet. Start navigating through the app to
          collect Web Vitals data. Metrics will appear here in real-time.
        </Alert>
      )}
    </Box>
  );
}
