'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Pagination,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Button,
  ButtonGroup,
} from '@mui/material';
import { ErrorLevel } from '@prisma/client';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import BugReportIcon from '@mui/icons-material/BugReport';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GetAppIcon from '@mui/icons-material/GetApp';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { useRouter, useSearchParams } from 'next/navigation';
import { ErrorLogWithContext } from '@/app/actions/admin-errors';
import ErrorDetailDialog from './ErrorDetailDialog';
import ErrorAnalytics from './ErrorAnalytics';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface ErrorsDashboardClientProps {
  errors: ErrorLogWithContext[];
  total: number;
  page: number;
  totalPages: number;
  errorTypes: string[];
  stats: any;
  initialFilters: {
    dateRange?: '24h' | '7d' | '30d' | 'custom';
    customDateFrom?: string;
    customDateTo?: string;
    level?: ErrorLevel;
    errorType?: string;
    userEmail?: string;
    cityId?: string;
    httpStatus?: number;
    environment?: string;
  };
}

export default function ErrorsDashboardClient({
  errors,
  total,
  page,
  totalPages,
  errorTypes,
  stats,
  initialFilters,
}: ErrorsDashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters
  const [environment, setEnvironment] = useState(initialFilters.environment || 'development');
  const [dateRange, setDateRange] = useState(initialFilters.dateRange || '7d');
  const [customDateFrom, setCustomDateFrom] = useState(initialFilters.customDateFrom || '');
  const [customDateTo, setCustomDateTo] = useState(initialFilters.customDateTo || '');
  const [level, setLevel] = useState<ErrorLevel | ''>(initialFilters.level || '');
  const [errorType, setErrorType] = useState(initialFilters.errorType || '');
  const [userEmail, setUserEmail] = useState(initialFilters.userEmail || '');
  const [httpStatus, setHttpStatus] = useState(initialFilters.httpStatus?.toString() || '');

  // Selected error for detail view
  const [selectedError, setSelectedError] = useState<ErrorLogWithContext | null>(null);

  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (environment) params.set('environment', environment);
    if (dateRange) params.set('dateRange', dateRange);
    if (dateRange === 'custom') {
      if (customDateFrom) params.set('customDateFrom', customDateFrom);
      if (customDateTo) params.set('customDateTo', customDateTo);
    }
    if (level) params.set('level', level);
    if (errorType) params.set('errorType', errorType);
    if (userEmail) params.set('userEmail', userEmail);
    if (httpStatus) params.set('httpStatus', httpStatus);
    params.set('page', '1'); // Reset to first page

    router.push(`?${params.toString()}`);
  };

  // Clear filters
  const clearFilters = () => {
    setEnvironment('development');
    setDateRange('7d');
    setCustomDateFrom('');
    setCustomDateTo('');
    setLevel('');
    setErrorType('');
    setUserEmail('');
    setHttpStatus('');
    router.push(window.location.pathname);
  };

  // Handle pagination
  const handlePageChange = (_: any, newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  // Export to CSV
  const handleExport = async () => {
    const params = new URLSearchParams(searchParams.toString());
    window.open(`/api/admin/errors/export?${params.toString()}`, '_blank');
  };

  // Handle environment switch (quick toggle)
  const handleEnvironmentSwitch = (newEnv: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('environment', newEnv);
    params.set('page', '1'); // Reset to first page
    router.push(`?${params.toString()}`);
  };

  // Get environment display info
  const getEnvironmentInfo = () => {
    switch (environment) {
      case 'production':
        return {
          label: 'Production Logs - Railway Database',
          color: colors.error,
          emoji: '🔴',
        };
      case 'development':
        return {
          label: 'Development Logs - Railway Database',
          color: '#FFA500', // Orange
          emoji: '🟡',
        };
      default:
        return {
          label: 'Local Development Logs',
          color: colors.neutral[600],
          emoji: '💻',
        };
    }
  };

  const envInfo = getEnvironmentInfo();

  // Get level icon and color
  const getLevelDisplay = (level: ErrorLevel) => {
    switch (level) {
      case 'CRITICAL':
        return {
          icon: <ErrorIcon sx={{ fontSize: 20 }} />,
          color: colors.error,
          label: 'קריטי',
        };
      case 'ERROR':
        return {
          icon: <BugReportIcon sx={{ fontSize: 20 }} />,
          color: colors.warning,
          label: 'שגיאה',
        };
      case 'WARN':
        return {
          icon: <WarningIcon sx={{ fontSize: 20 }} />,
          color: colors.orange,
          label: 'אזהרה',
        };
      case 'INFO':
        return {
          icon: <InfoIcon sx={{ fontSize: 20 }} />,
          color: colors.info,
          label: 'מידע',
        };
      default:
        return {
          icon: <InfoIcon sx={{ fontSize: 20 }} />,
          color: colors.textSecondary,
          label: level,
        };
    }
  };

  return (
    <Box dir="rtl" lang="he" sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
            Error Tracking Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: envInfo.color, fontWeight: 600 }}>
            {envInfo.label}
          </Typography>
        </Box>
        <Tooltip title="ייצא לקובץ CSV">
          <IconButton onClick={handleExport} color="primary">
            <GetAppIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Environment Toggle */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <ButtonGroup variant="contained" size="large" sx={{ boxShadow: shadows.md }}>
          <Button
            onClick={() => handleEnvironmentSwitch('development')}
            sx={{
              bgcolor: environment === 'development' ? '#FFA500' : colors.neutral[300],
              color: environment === 'development' ? colors.neutral[0] : colors.neutral[700],
              fontWeight: 600,
              px: 4,
              '&:hover': {
                bgcolor: environment === 'development' ? '#FF8C00' : colors.neutral[400],
              },
            }}
          >
            🟡 DEV
          </Button>
          <Button
            onClick={() => handleEnvironmentSwitch('production')}
            sx={{
              bgcolor: environment === 'production' ? colors.error : colors.neutral[300],
              color: environment === 'production' ? colors.neutral[0] : colors.neutral[700],
              fontWeight: 600,
              px: 4,
              '&:hover': {
                bgcolor: environment === 'production' ? '#d32f2f' : colors.neutral[400],
              },
            }}
          >
            🔴 PROD
          </Button>
        </ButtonGroup>
      </Box>

      {/* Analytics Summary */}
      <ErrorAnalytics stats={stats} />

      {/* Filters */}
      <Card sx={{ mb: 3, boxShadow: shadows.sm, borderRadius: borderRadius.lg }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterListIcon sx={{ mr: 1, color: colors.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              סינון שגיאות
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {/* Date Range */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>טווח תאריכים</InputLabel>
                <Select value={dateRange} label="טווח תאריכים" onChange={(e) => setDateRange(e.target.value as any)}>
                  <MenuItem value="24h">24 שעות אחרונות</MenuItem>
                  <MenuItem value="7d">7 ימים אחרונים</MenuItem>
                  <MenuItem value="30d">30 ימים אחרונים</MenuItem>
                  <MenuItem value="custom">מותאם אישית</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Custom Date From */}
            {dateRange === 'custom' && (
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="מתאריך"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}

            {/* Custom Date To */}
            {dateRange === 'custom' && (
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="עד תאריך"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}

            {/* Level */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>רמת חומרה</InputLabel>
                <Select value={level} label="רמת חומרה" onChange={(e) => setLevel(e.target.value as any)}>
                  <MenuItem value="">הכל</MenuItem>
                  <MenuItem value="CRITICAL">קריטי</MenuItem>
                  <MenuItem value="ERROR">שגיאה</MenuItem>
                  <MenuItem value="WARN">אזהרה</MenuItem>
                  <MenuItem value="INFO">מידע</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Error Type */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>סוג שגיאה</InputLabel>
                <Select value={errorType} label="סוג שגיאה" onChange={(e) => setErrorType(e.target.value)}>
                  <MenuItem value="">הכל</MenuItem>
                  {errorTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* User Email */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="אימייל משתמש"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="חיפוש לפי אימייל..."
              />
            </Grid>

            {/* HTTP Status */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>HTTP Status</InputLabel>
                <Select value={httpStatus} label="HTTP Status" onChange={(e) => setHttpStatus(e.target.value)}>
                  <MenuItem value="">הכל</MenuItem>
                  <MenuItem value="400">400 Bad Request</MenuItem>
                  <MenuItem value="401">401 Unauthorized</MenuItem>
                  <MenuItem value="403">403 Forbidden</MenuItem>
                  <MenuItem value="404">404 Not Found</MenuItem>
                  <MenuItem value="500">500 Internal Server Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Apply/Clear Buttons */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="החל סינון">
                  <IconButton onClick={applyFilters} color="primary" sx={{ flex: 1 }}>
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="נקה סינון">
                  <IconButton onClick={clearFilters} color="secondary" sx={{ flex: 1 }}>
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          נמצאו {total} שגיאות | עמוד {page} מתוך {totalPages}
        </Typography>
      </Box>

      {/* Errors Table */}
      <TableContainer component={Paper} sx={{ boxShadow: shadows.md, borderRadius: borderRadius.lg }}>
        <Table>
          <TableHead sx={{ bgcolor: colors.backgroundHover }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>רמה</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>סוג</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>הודעה</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>משתמש</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>זמן</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {errors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">לא נמצאו שגיאות</Typography>
                </TableCell>
              </TableRow>
            ) : (
              errors.map((error) => {
                const levelDisplay = getLevelDisplay(error.level);
                return (
                  <TableRow key={error.id} hover>
                    <TableCell>
                      <Chip
                        icon={levelDisplay.icon}
                        label={levelDisplay.label}
                        size="small"
                        sx={{
                          bgcolor: `${levelDisplay.color}15`,
                          color: levelDisplay.color,
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {error.errorType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {error.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {error.userEmail ? (
                        <Typography variant="body2">{error.userEmail}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          לא מזוהה
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(error.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="צפה בפרטים">
                        <IconButton size="small" onClick={() => setSelectedError(error)} color="primary">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" size="large" />
        </Box>
      )}

      {/* Error Detail Dialog */}
      {selectedError && (
        <ErrorDetailDialog error={selectedError} open={!!selectedError} onClose={() => setSelectedError(null)} />
      )}
    </Box>
  );
}
