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
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
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
        selectedNeighborhood === 'all' ? undefined : selectedNeighborhood
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
  }, [selectedNeighborhood]);

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

  // Get unique neighborhoods for filter
  const neighborhoods = useMemo(() => {
    if (!data) return [];

    const neighborhoodMap = new Map();

    // Add neighborhoods from checked-in activists
    data.checkedIn?.forEach((record: any) => {
      if (record.neighborhood && !neighborhoodMap.has(record.neighborhood.id)) {
        neighborhoodMap.set(record.neighborhood.id, record.neighborhood);
      }
    });

    // Add neighborhoods from unchecked activists
    data.notCheckedIn?.forEach((activist: any) => {
      if (activist.neighborhood && !neighborhoodMap.has(activist.neighborhood.id)) {
        neighborhoodMap.set(activist.neighborhood.id, activist.neighborhood);
      }
    });

    return Array.from(neighborhoodMap.values());
  }, [data]);

  // Filter activists by search query
  const filteredActivists = useMemo(() => {
    if (!data) return { checkedIn: [], notCheckedIn: [] };

    const filterActivist = (activist: any) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const name = activist.activist?.fullName || activist.fullName || '';
      const phone = activist.activist?.phone || activist.phone || '';
      return (
        name.toLowerCase().includes(query) || phone.toLowerCase().includes(query)
      );
    };

    return {
      checkedIn: data.checkedIn?.filter(filterActivist) || [],
      notCheckedIn: data.notCheckedIn?.filter(filterActivist) || [],
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
                    פעילים נוכחים
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
          placeholder="חיפוש פעיל..."
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

        {/* Neighborhood Filter */}
        {neighborhoods.length > 1 && (
          <FormControl
            sx={{
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.md,
              },
            }}
          >
            <InputLabel>שכונה</InputLabel>
            <Select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              label="שכונה"
              sx={{ direction: 'rtl' }}
            >
              <MenuItem value="all">כל השכונות</MenuItem>
              {neighborhoods.map((neighborhood: any) => (
                <MenuItem key={neighborhood.id} value={neighborhood.id}>
                  {neighborhood.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Activists List */}
      <Box>
        {/* Present Activists */}
        {filteredActivists.checkedIn.length > 0 && (
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
                נוכחים ({filteredActivists.checkedIn.length})
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
              {filteredActivists.checkedIn.map((record: any) => (
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

        {/* Not Checked In Activists */}
        {filteredActivists.notCheckedIn.length > 0 && (
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
                לא נבדקו ({filteredActivists.notCheckedIn.length})
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
              {filteredActivists.notCheckedIn.map((activist: any) => (
                <Grid item xs={12} sm={6} md={4} key={activist.id}>
                  <ActivistCard
                    activist={activist}
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
        {filteredActivists.checkedIn.length === 0 &&
          filteredActivists.notCheckedIn.length === 0 && (
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
                לא נמצאו פעילים
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.neutral[400],
                }}
              >
                {searchQuery
                  ? 'נסה לשנות את החיפוש'
                  : 'אין פעילים פעילים בשכונה זו'}
              </Typography>
            </Box>
          )}
      </Box>
    </Box>
  );
}
