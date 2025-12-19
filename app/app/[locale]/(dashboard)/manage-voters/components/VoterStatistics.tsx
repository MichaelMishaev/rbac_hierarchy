/**
 * Voter Statistics Dashboard (Hebrew RTL)
 *
 * Features:
 * - Overview statistics
 * - Support level breakdown
 * - Contact status breakdown
 * - Insertion activity by user
 * - Hebrew RTL layout
 * - Visual charts
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import {
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { getVoterStatistics, getInsertionActivity } from '@/lib/voters/actions/voter-actions';

export function VoterStatistics() {
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsResult, activityResult] = await Promise.all([
        getVoterStatistics(),
        getInsertionActivity(),
      ]);

      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        setError(statsResult.error);
      }

      if (activityResult.success) {
        setActivity(activityResult.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2, borderRadius: '24px' }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  const getSupportPercentage = (count: number) => {
    return stats.active > 0 ? ((count / stats.active) * 100).toFixed(1) : '0';
  };

  return (
    <Box dir="rtl" sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        סטטיסטיקות בוחרים
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '24px', boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PeopleIcon color="primary" />
                <Typography variant="h6">סה&quot;כ בוחרים</Typography>
              </Box>
              <Typography variant="h3" color="primary.main">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '24px', boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="h6">פעילים</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '24px', boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon color="warning" />
                <Typography variant="h6">תומכים</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {stats.bySupportLevel['תומך'] || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getSupportPercentage(stats.bySupportLevel['תומך'] || 0)}% מהפעילים
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '24px', boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PieChartIcon color="info" />
                <Typography variant="h6">נמחקו</Typography>
              </Box>
              <Typography variant="h3" color="text.secondary">
                {stats.deleted}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Support Level Breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '24px', boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                פילוח לפי רמת תמיכה
              </Typography>

              <Box sx={{ mt: 2 }}>
                {Object.entries(stats.bySupportLevel).map(([level, count]: [string, any]) => (
                  <Box key={level} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{level}</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {count} ({getSupportPercentage(count)}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(getSupportPercentage(count))}
                      sx={{ height: 8, borderRadius: '8px' }}
                      color={
                        level === 'תומך'
                          ? 'success'
                          : level === 'מהסס'
                          ? 'warning'
                          : level === 'מתנגד'
                          ? 'error'
                          : 'info'
                      }
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Status Breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '24px', boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                פילוח לפי סטטוס קשר
              </Typography>

              <Box sx={{ mt: 2 }}>
                {Object.entries(stats.byContactStatus).map(
                  ([status, count]: [string, any]) => (
                    <Box key={status} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{status}</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {count} ({getSupportPercentage(count)}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(getSupportPercentage(count))}
                        sx={{ height: 8, borderRadius: '8px' }}
                        color={
                          status === 'הצביע'
                            ? 'success'
                            : status === 'נקבע פגישה'
                            ? 'primary'
                            : 'info'
                        }
                      />
                    </Box>
                  )
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Insertion Activity */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: '24px', boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                פעילות הכנסה לפי משתמש
              </Typography>

              <List>
                {activity.slice(0, 10).map((user, index) => (
                  <ListItem
                    key={user.userId}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={index + 1}
                            size="small"
                            color={index === 0 ? 'primary' : 'default'}
                          />
                          <Typography variant="body1" fontWeight="medium">
                            {user.userName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ({user.userRole})
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="h6" color="primary.main">
                        {user.count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        בוחרים
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
