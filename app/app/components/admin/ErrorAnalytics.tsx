'use client';

import { Box, Grid, Card, CardContent, Typography, Chip } from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import BugReportIcon from '@mui/icons-material/BugReport';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface ErrorAnalyticsProps {
  stats: {
    byLevel: Array<{ level: string; _count: number }>;
    byType: Array<{ errorType: string; _count: number }>;
    byRole: Array<{ userRole: string | null; _count: number }>;
    byCity: Array<{ cityId: string | null; _count: number }>;
    trend: Array<{ date: Date; count: number }>;
  };
}

export default function ErrorAnalytics({ stats }: ErrorAnalyticsProps) {
  // Calculate total errors
  const totalErrors = stats.byLevel.reduce((sum, item) => sum + item._count, 0);

  // Get counts by level
  const criticalCount = stats.byLevel.find((item) => item.level === 'CRITICAL')?._count || 0;
  const errorCount = stats.byLevel.find((item) => item.level === 'ERROR')?._count || 0;
  const warnCount = stats.byLevel.find((item) => item.level === 'WARN')?._count || 0;

  // Calculate trend (comparing last day vs previous day)
  const today = stats.trend[stats.trend.length - 1]?.count || 0;
  const yesterday = stats.trend[stats.trend.length - 2]?.count || 0;
  const trendDirection = today > yesterday ? 'up' : today < yesterday ? 'down' : 'stable';
  const trendPercentage =
    yesterday > 0 ? Math.round(((today - yesterday) / yesterday) * 100) : today > 0 ? 100 : 0;

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2}>
        {/* Total Errors */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: shadows.sm, borderRadius: borderRadius.lg }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    סה&quot;כ שגיאות
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {totalErrors.toLocaleString('he-IL')}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {trendDirection === 'up' && <TrendingUpIcon sx={{ fontSize: 16, color: colors.error }} />}
                    {trendDirection === 'down' && <TrendingDownIcon sx={{ fontSize: 16, color: colors.success }} />}
                    <Typography
                      variant="caption"
                      sx={{ color: trendDirection === 'up' ? colors.error : colors.success }}
                    >
                      {trendDirection === 'up' ? '+' : trendDirection === 'down' ? '-' : ''}
                      {Math.abs(trendPercentage)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      מהיום הקודם
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    bgcolor: colors.primary + '15',
                    borderRadius: borderRadius.md,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BugReportIcon sx={{ fontSize: 28, color: colors.primary }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Critical Errors */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: shadows.sm, borderRadius: borderRadius.lg }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    שגיאות קריטיות
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: colors.error }}>
                    {criticalCount.toLocaleString('he-IL')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {totalErrors > 0 ? Math.round((criticalCount / totalErrors) * 100) : 0}% מכלל השגיאות
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: colors.error + '15',
                    borderRadius: borderRadius.md,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ErrorIcon sx={{ fontSize: 28, color: colors.error }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Errors */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: shadows.sm, borderRadius: borderRadius.lg }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    שגיאות רגילות
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: colors.warning }}>
                    {errorCount.toLocaleString('he-IL')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {totalErrors > 0 ? Math.round((errorCount / totalErrors) * 100) : 0}% מכלל השגיאות
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: colors.warning + '15',
                    borderRadius: borderRadius.md,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BugReportIcon sx={{ fontSize: 28, color: colors.warning }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Warnings */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: shadows.sm, borderRadius: borderRadius.lg }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    אזהרות
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: colors.orange }}>
                    {warnCount.toLocaleString('he-IL')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {totalErrors > 0 ? Math.round((warnCount / totalErrors) * 100) : 0}% מכלל השגיאות
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: colors.orange + '15',
                    borderRadius: borderRadius.md,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <WarningIcon sx={{ fontSize: 28, color: colors.orange }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Error Types */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: shadows.sm, borderRadius: borderRadius.lg, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                סוגי שגיאות מובילים
              </Typography>
              {stats.byType.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  אין נתונים
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {stats.byType.slice(0, 5).map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={index + 1}
                        size="small"
                        sx={{
                          minWidth: 28,
                          height: 28,
                          bgcolor: colors.primary + '15',
                          color: colors.primary,
                          fontWeight: 600,
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {item.errorType}
                        </Typography>
                        <Box
                          sx={{
                            mt: 0.5,
                            height: 6,
                            bgcolor: colors.backgroundHover,
                            borderRadius: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              width: `${(item._count / (stats.byType[0]?._count || 1)) * 100}%`,
                              bgcolor: colors.primary,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40, textAlign: 'left' }}>
                        {item._count}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Errors by Role */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: shadows.sm, borderRadius: borderRadius.lg, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                שגיאות לפי תפקיד
              </Typography>
              {stats.byRole.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  אין נתונים
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {stats.byRole.slice(0, 5).map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip
                        label={index + 1}
                        size="small"
                        sx={{
                          minWidth: 28,
                          height: 28,
                          bgcolor: colors.secondary + '15',
                          color: colors.secondary,
                          fontWeight: 600,
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">
                          {item.userRole || 'לא מזוהה'}
                        </Typography>
                        <Box
                          sx={{
                            mt: 0.5,
                            height: 6,
                            bgcolor: colors.backgroundHover,
                            borderRadius: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              width: `${(item._count / (stats.byRole[0]?._count || 1)) * 100}%`,
                              bgcolor: colors.secondary,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40, textAlign: 'left' }}>
                        {item._count}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
