'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import ActivistCard from './ActivistCard';
import { getTodaysAttendance } from '@/actions/attendance';
import { validateTimeWindow, getCurrentIsraelTime } from '@/lib/attendance';

type TodayAttendanceProps = {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isSuperAdmin: boolean;
  };
};

export default function TodayAttendance({ user }: TodayAttendanceProps) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTimeWindowValid, setIsTimeWindowValid] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  // Fetch today's attendance
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTodaysAttendance(
        selectedSite === 'all' ? undefined : selectedSite
      );
      setData(result);
    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת נתוני נוכחות');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAttendance();
  }, [selectedSite]);

  // Check time window and update current time
  useEffect(() => {
    const checkTimeWindow = () => {
      setIsTimeWindowValid(validateTimeWindow());
      setCurrentTime(getCurrentIsraelTime('HH:mm'));
    };

    checkTimeWindow();
    const interval = setInterval(checkTimeWindow, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Get unique sites for filter
  const sites = useMemo(() => {
    if (!data) return [];

    const siteMap = new Map();

    // Add sites from checked-in workers
    data.checkedIn?.forEach((record: any) => {
      if (record.site && !siteMap.has(record.site.id)) {
        siteMap.set(record.site.id, record.site);
      }
    });

    // Add sites from unchecked workers
    data.notCheckedIn?.forEach((activist: any) => {
      if (worker.site && !siteMap.has(worker.site.id)) {
        siteMap.set(worker.site.id, worker.site);
      }
    });

    return Array.from(siteMap.values());
  }, [data]);

  // Filter workers by search query
  const filteredWorkers = useMemo(() => {
    if (!data) return { checkedIn: [], notCheckedIn: [] };

    const filterWorker = (activist: any) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const name = worker.worker?.fullName || worker.fullName || '';
      const phone = worker.worker?.phone || worker.phone || '';
      return (
        name.toLowerCase().includes(query) || phone.toLowerCase().includes(query)
      );
    };

    return {
      checkedIn: data.checkedIn?.filter(filterWorker) || [],
      notCheckedIn: data.notCheckedIn?.filter(filterWorker) || [],
    };
  }, [data, searchQuery]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: borderRadius.md }}>
        {error}
      </Alert>
    );
  }

  const summary = data?.summary || {};
  const presentCount = summary.present || 0;
  const totalCount = summary.total || 0;
  const notPresentCount = totalCount - presentCount;
  const attendancePercentage =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <Box sx={{ direction: 'rtl' }}>
      {/* Time Window Warning */}
      {!isTimeWindowValid && (
        <Alert
          severity="warning"
          sx={{ mb: 3, borderRadius: borderRadius.md }}
          icon={<PendingIcon />}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            מחוץ לשעות הנוכחות (06:00-22:00)
          </Typography>
          <Typography variant="caption">
            השעה הנוכחית: {currentTime} - לא ניתן לסמן נוכחות כרגע
          </Typography>
        </Alert>
      )}

      {/* Summary Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: borderRadius.md,
              border: `1px solid ${colors.neutral[200]}`,
              background: `linear-gradient(135deg, ${colors.success}10 0%, ${colors.success}05 100%)`,
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  direction: 'rtl',
                }}
              >
                <Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: colors.success,
                      lineHeight: 1,
                      mb: 0.5,
                    }}
                  >
                    {presentCount}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.neutral[600],
                      fontWeight: 500,
                    }}
                  >
                    עובדים נוכחים
                  </Typography>
                </Box>
                <CheckCircleIcon
                  sx={{
                    fontSize: 48,
                    color: colors.success,
                    opacity: 0.3,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: borderRadius.md,
              border: `1px solid ${colors.neutral[200]}`,
              background: `linear-gradient(135deg, ${colors.warning}10 0%, ${colors.warning}05 100%)`,
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  direction: 'rtl',
                }}
              >
                <Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: colors.warning,
                      lineHeight: 1,
                      mb: 0.5,
                    }}
                  >
                    {notPresentCount}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.neutral[600],
                      fontWeight: 500,
                    }}
                  >
                    לא נבדקו
                  </Typography>
                </Box>
                <PendingIcon
                  sx={{
                    fontSize: 48,
                    color: colors.warning,
                    opacity: 0.3,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: borderRadius.md,
              border: `1px solid ${colors.neutral[200]}`,
              background: `linear-gradient(135deg, ${colors.primary}10 0%, ${colors.primary}05 100%)`,
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  direction: 'rtl',
                }}
              >
                <Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: colors.primary.main,
                      lineHeight: 1,
                      mb: 0.5,
                    }}
                  >
                    {attendancePercentage}%
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.neutral[600],
                      fontWeight: 500,
                    }}
                  >
                    אחוז נוכחות
                  </Typography>
                </Box>
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress
                    variant="determinate"
                    value={attendancePercentage}
                    size={48}
                    thickness={4}
                    sx={{
                      color: colors.primary.main,
                      opacity: 0.3,
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        {/* Search */}
        <TextField
          placeholder="חיפוש עובד..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: colors.neutral[400] }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: borderRadius.md,
              direction: 'rtl',
            },
          }}
        />

        {/* Site Filter */}
        {sites.length > 1 && (
          <FormControl
            sx={{
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.md,
              },
            }}
          >
            <InputLabel>אתר</InputLabel>
            <Select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              label="אתר"
              sx={{ direction: 'rtl' }}
            >
              <MenuItem value="all">כל האתרים</MenuItem>
              {sites.map((neighborhood: any) => (
                <MenuItem key={site.id} value={site.id}>
                  {site.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Workers List */}
      <Box>
        {/* Present Workers */}
        {filteredWorkers.checkedIn.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: colors.neutral[800],
                }}
              >
                נוכחים ({filteredWorkers.checkedIn.length})
              </Typography>
              <Chip
                icon={<CheckCircleIcon />}
                label="נבדקו"
                size="small"
                sx={{
                  backgroundColor: `${colors.success}15`,
                  color: colors.success,
                  fontWeight: 600,
                  borderRadius: borderRadius.sm,
                }}
              />
            </Box>
            <Grid container spacing={2}>
              {filteredWorkers.checkedIn.map((record: any) => (
                <Grid item xs={12} sm={6} md={4} key={record.id}>
                  <ActivistCard
                    record={record}
                    isCheckedIn={true}
                    onUpdate={fetchAttendance}
                    isTimeWindowValid={isTimeWindowValid}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Not Checked In Workers */}
        {filteredWorkers.notCheckedIn.length > 0 && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: colors.neutral[800],
                }}
              >
                לא נבדקו ({filteredWorkers.notCheckedIn.length})
              </Typography>
              <Chip
                icon={<PendingIcon />}
                label="ממתינים"
                size="small"
                sx={{
                  backgroundColor: `${colors.warning}15`,
                  color: colors.warning,
                  fontWeight: 600,
                  borderRadius: borderRadius.sm,
                }}
              />
            </Box>
            <Grid container spacing={2}>
              {filteredWorkers.notCheckedIn.map((activist: any) => (
                <Grid item xs={12} sm={6} md={4} key={worker.id}>
                  <ActivistCard
                    worker={worker}
                    isCheckedIn={false}
                    onUpdate={fetchAttendance}
                    isTimeWindowValid={isTimeWindowValid}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Empty State */}
        {filteredWorkers.checkedIn.length === 0 &&
          filteredWorkers.notCheckedIn.length === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: colors.neutral[500],
                  mb: 1,
                }}
              >
                לא נמצאו עובדים
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.neutral[400],
                }}
              >
                {searchQuery
                  ? 'נסה לשנות את החיפוש'
                  : 'אין עובדים פעילים באתר זה'}
              </Typography>
            </Box>
          )}
      </Box>
    </Box>
  );
}
