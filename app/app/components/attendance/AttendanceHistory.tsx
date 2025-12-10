'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import FilterListIcon from '@mui/icons-material/FilterList';
import { getAttendanceHistory } from '@/actions/attendance';
import * as XLSX from 'xlsx';

type AttendanceHistoryProps = {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isSuperAdmin: boolean;
  };
};

export default function AttendanceHistory({ user }: AttendanceHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Filters
  const [startDate, setStartDate] = useState<Date | null>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedWorker, setSelectedWorker] = useState<string>('all');

  // Quick filters
  const [quickFilter, setQuickFilter] = useState<string>('thisMonth');

  // Details dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Fetch history data
  const fetchHistory = async () => {
    if (!startDate || !endDate) return;

    try {
      setLoading(true);
      setError(null);

      const result = await getAttendanceHistory({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        neighborhoodId: selectedSite === 'all' ? undefined : selectedSite,
        activistId: selectedWorker === 'all' ? undefined : selectedWorker,
        page: 0, // Always fetch from page 0, we'll handle pagination client-side
        limit: 1000, // Fetch large batch for client-side pagination
      });

      setData(result);
      setPage(0); // Reset to first page
    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת היסטוריית נוכחות');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchHistory();
  }, [startDate, endDate, selectedSite, selectedWorker]);

  // Quick filter presets
  const handleQuickFilter = (filter: string) => {
    setQuickFilter(filter);
    const today = new Date();

    switch (filter) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'last7days':
        setStartDate(subDays(today, 7));
        setEndDate(today);
        break;
      case 'last30days':
        setStartDate(subDays(today, 30));
        setEndDate(today);
        break;
      case 'thisMonth':
        setStartDate(startOfMonth(today));
        setEndDate(endOfMonth(today));
        break;
      case 'custom':
        // Keep current dates
        break;
    }
  };

  // Get unique sites and workers for filters
  const { sites, workers } = useMemo(() => {
    if (!data?.records) return { neighborhoods: [], activists: [] };

    const siteMap = new Map();
    const workerMap = new Map();

    data.records.forEach((record: any) => {
      if (record.site && !siteMap.has(record.site.id)) {
        siteMap.set(record.site.id, record.site);
      }
      if (record.worker && !workerMap.has(record.worker.id)) {
        workerMap.set(record.worker.id, record.worker);
      }
    });

    return {
      neighborhoods: Array.from(siteMap.values()),
      activists: Array.from(workerMap.values()),
    };
  }, [data]);

  // Pagination handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Export to Excel
  const handleExport = () => {
    if (!data?.records || data.records.length === 0) {
      alert('אין נתונים לייצוא');
      return;
    }

    // Prepare data for Excel
    const exportData = data.records.map((record: any) => ({
      תאריך: format(new Date(record.date), 'dd/MM/yyyy'),
      עובד: record.worker?.fullName || '',
      טלפון: record.worker?.phone || '',
      תפקיד: record.worker?.position || '',
      אתר: record.site?.name || '',
      סטטוס: record.status === 'PRESENT' ? 'נוכח' : 'לא נוכח',
      'שעת נוכחות': record.checkedInAt
        ? format(new Date(record.checkedInAt), 'HH:mm')
        : '-',
      'נבדק על ידי': record.checkedInBy?.fullName || '-',
      הערות: record.notes || '-',
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // תאריך
      { wch: 20 }, // עובד
      { wch: 15 }, // טלפון
      { wch: 15 }, // תפקיד
      { wch: 20 }, // אתר
      { wch: 10 }, // סטטוס
      { wch: 12 }, // שעת נוכחות
      { wch: 20 }, // נבדק על ידי
      { wch: 30 }, // הערות
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'נוכחות');

    // Download file
    const fileName = `attendance_${format(startDate!, 'yyyy-MM-dd')}_${format(endDate!, 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Show record details
  const handleShowDetails = (record: any) => {
    setSelectedRecord(record);
    setDetailsDialogOpen(true);
  };

  // Merge current records with deleted records from audit logs
  const allRecords = useMemo(() => {
    if (!data?.records) return [];

    const currentRecords = data.records;
    const currentRecordIds = new Set(currentRecords.map((r: any) => r.id));
    const deletedRecords: any[] = [];

    // Extract deleted check-ins from audit logs (only if record doesn't exist anymore)
    if (data.auditLogs) {
      data.auditLogs
        .filter((log: any) => log.action === 'DELETE')
        .filter((log: any) => !currentRecordIds.has(log.entityId)) // Only show truly deleted records
        .forEach((log: any) => {
          // Create a pseudo-record for deleted check-ins
          const beforeData = log.before || {};
          const afterData = log.after || {};

          deletedRecords.push({
            id: log.entityId,
            date: beforeData.date || log.createdAt, // Use original date, not deletion date
            status: 'DELETED',
            checkedInAt: beforeData.checkedInAt,
            notes: afterData.reason || '', // Cancellation reason
            activist: {
              fullName: beforeData.workerName || 'לא ידוע',
              phone: beforeData.workerPhone || '',
            },
            neighborhood: {
              name: beforeData.siteName || '-',
            },
            checkedInBy: {
              fullName: '-',
            },
            deletedBy: log.userEmail,
            deletedAt: log.createdAt,
            isDeleted: true, // Flag to identify deleted records
          });
        });
    }

    // Merge and sort by date
    return [...currentRecords, ...deletedRecords].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [data]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return allRecords.slice(start, end);
  }, [allRecords, page, rowsPerPage]);

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

  const totalRecords = allRecords.length;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Box sx={{ direction: 'rtl' }}>
        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: borderRadius.lg,
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 3,
            }}
          >
            <FilterListIcon sx={{ color: colors.primary.main }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: colors.neutral[900],
              }}
            >
              סינון תוצאות
            </Typography>
          </Box>

          {/* Quick Filters */}
          <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[
              { value: 'today', label: 'היום' },
              { value: 'last7days', label: '7 ימים אחרונים' },
              { value: 'last30days', label: '30 ימים אחרונים' },
              { value: 'thisMonth', label: 'החודש' },
              { value: 'custom', label: 'מותאם אישית' },
            ].map((filter) => (
              <Chip
                key={filter.value}
                label={filter.label}
                onClick={() => handleQuickFilter(filter.value)}
                sx={{
                  backgroundColor:
                    quickFilter === filter.value
                      ? colors.primary.main
                      : colors.neutral[100],
                  color:
                    quickFilter === filter.value ? '#fff' : colors.neutral[700],
                  fontWeight: quickFilter === filter.value ? 700 : 500,
                  borderRadius: borderRadius.sm,
                  '&:hover': {
                    backgroundColor:
                      quickFilter === filter.value
                        ? colors.primary.main
                        : colors.neutral[200],
                  },
                }}
              />
            ))}
          </Box>

          {/* Filter Inputs */}
          <Grid container spacing={2}>
            {/* Date Range */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="מתאריך"
                value={startDate}
                onChange={(newValue) => {
                  setStartDate(newValue);
                  setQuickFilter('custom');
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: borderRadius.md,
                      },
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="עד תאריך"
                value={endDate}
                onChange={(newValue) => {
                  setEndDate(newValue);
                  setQuickFilter('custom');
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: borderRadius.md,
                      },
                    },
                  },
                }}
              />
            </Grid>

            {/* Site Filter */}
            {sites.length > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl
                  fullWidth
                  sx={{
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
              </Grid>
            )}

            {/* Worker Filter */}
            {workers.length > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: borderRadius.md,
                    },
                  }}
                >
                  <InputLabel>עובד</InputLabel>
                  <Select
                    value={selectedWorker}
                    onChange={(e) => setSelectedWorker(e.target.value)}
                    label="עובד"
                    sx={{ direction: 'rtl' }}
                  >
                    <MenuItem value="all">כל העובדים</MenuItem>
                    {workers.map((activist: any) => (
                      <MenuItem key={worker.id} value={worker.id}>
                        {worker.fullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>

          {/* Export Button */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={totalRecords === 0}
              sx={{
                borderRadius: borderRadius.md,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                },
              }}
            >
              ייצוא לאקסל ({totalRecords} רשומות)
            </Button>
          </Box>
        </Paper>

        {/* Results Summary */}
        {totalRecords > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              sx={{
                color: colors.neutral[600],
                textAlign: 'right',
              }}
            >
              נמצאו <strong>{totalRecords}</strong> רשומות נוכחות
            </Typography>
          </Box>
        )}

        {/* Data Table */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: borderRadius.lg,
            border: `1px solid ${colors.neutral[200]}`,
            overflow: 'hidden',
          }}
        >
          <Table sx={{ direction: 'rtl' }}>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: colors.neutral[50],
                }}
              >
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: colors.neutral[900],
                    textAlign: 'right',
                  }}
                >
                  תאריך
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: colors.neutral[900],
                    textAlign: 'right',
                  }}
                >
                  עובד
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: colors.neutral[900],
                    textAlign: 'right',
                  }}
                >
                  אתר
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: colors.neutral[900],
                    textAlign: 'center',
                  }}
                >
                  סטטוס
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: colors.neutral[900],
                    textAlign: 'right',
                  }}
                >
                  שעת נוכחות
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: colors.neutral[900],
                    textAlign: 'right',
                  }}
                >
                  נבדק על ידי
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: colors.neutral[900],
                    textAlign: 'center',
                  }}
                >
                  פעולות
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((record: any) => (
                  <TableRow
                    key={record.id}
                    sx={{
                      backgroundColor: record.isDeleted
                        ? `${colors.error}05`
                        : 'transparent',
                      opacity: record.isDeleted ? 0.7 : 1,
                      '&:hover': {
                        backgroundColor: record.isDeleted
                          ? `${colors.error}10`
                          : colors.neutral[50],
                      },
                    }}
                  >
                    <TableCell sx={{ textAlign: 'right' }}>
                      {format(new Date(record.date), 'dd/MM/yyyy', { locale: he })}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: colors.neutral[900] }}
                      >
                        {record.worker?.fullName}
                      </Typography>
                      {record.worker?.phone && (
                        <Typography
                          variant="caption"
                          sx={{ color: colors.neutral[500], direction: 'ltr' }}
                        >
                          {record.worker.phone}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      {record.site?.name}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip
                        icon={
                          record.status === 'DELETED' ? (
                            <CancelIcon />
                          ) : record.status === 'PRESENT' ? (
                            <CheckCircleIcon />
                          ) : (
                            <CancelIcon />
                          )
                        }
                        label={
                          record.status === 'DELETED'
                            ? 'בוטל'
                            : record.status === 'PRESENT'
                            ? 'נוכח'
                            : 'לא נוכח'
                        }
                        size="small"
                        sx={{
                          backgroundColor:
                            record.status === 'DELETED'
                              ? `${colors.error}15`
                              : record.status === 'PRESENT'
                              ? `${colors.success}15`
                              : `${colors.neutral[300]}`,
                          color:
                            record.status === 'DELETED'
                              ? colors.error
                              : record.status === 'PRESENT'
                              ? colors.success
                              : colors.neutral[700],
                          fontWeight: 600,
                          borderRadius: borderRadius.sm,
                          textDecoration: record.isDeleted ? 'line-through' : 'none',
                          '& .MuiChip-icon': {
                            color:
                              record.status === 'DELETED'
                                ? colors.error
                                : record.status === 'PRESENT'
                                ? colors.success
                                : colors.neutral[600],
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      {record.checkedInAt
                        ? format(new Date(record.checkedInAt), 'HH:mm', {
                            locale: he,
                          })
                        : '-'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      {record.isDeleted
                        ? `בוטל ע"י: ${record.deletedBy}`
                        : record.checkedInBy?.fullName || '-'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Tooltip title="פרטים">
                        <IconButton
                          size="small"
                          onClick={() => handleShowDetails(record)}
                          sx={{
                            color: colors.primary.main,
                            '&:hover': {
                              backgroundColor: `${colors.primary.main}10`,
                            },
                          }}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8 }}>
                    <Typography
                      variant="h6"
                      sx={{ color: colors.neutral[500], mb: 1 }}
                    >
                      לא נמצאו רשומות
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.neutral[400] }}>
                      נסה לשנות את הפילטרים
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalRecords > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={totalRecords}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="שורות בעמוד:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} מתוך ${count}`
              }
              sx={{
                direction: 'rtl',
                borderTop: `1px solid ${colors.neutral[200]}`,
                '& .MuiTablePagination-toolbar': {
                  direction: 'rtl',
                },
                '& .MuiTablePagination-selectLabel': {
                  marginRight: 0,
                  marginLeft: 'auto',
                },
                '& .MuiTablePagination-displayedRows': {
                  marginRight: 'auto',
                  marginLeft: 0,
                },
              }}
            />
          )}
        </TableContainer>

        {/* Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: borderRadius.lg,
              direction: 'rtl',
            },
          }}
        >
          <DialogTitle sx={{ textAlign: 'right', fontWeight: 700 }}>
            פרטי נוכחות
          </DialogTitle>
          <DialogContent>
            {selectedRecord && (
              <Box sx={{ direction: 'rtl' }}>
                {/* Worker Info */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: colors.neutral[600], display: 'block', mb: 0.5 }}
                  >
                    עובד
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {selectedRecord.worker?.fullName}
                  </Typography>
                  {selectedRecord.worker?.phone && (
                    <Typography
                      variant="body2"
                      sx={{ color: colors.neutral[600], direction: 'ltr', textAlign: 'right' }}
                    >
                      {selectedRecord.worker.phone}
                    </Typography>
                  )}
                </Box>

                {/* Date & Time */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: colors.neutral[600], display: 'block', mb: 0.5 }}
                  >
                    תאריך ושעה
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {format(new Date(selectedRecord.date), 'EEEE, dd MMMM yyyy', {
                      locale: he,
                    })}
                  </Typography>
                  {selectedRecord.checkedInAt && (
                    <Typography variant="body2" sx={{ color: colors.neutral[700] }}>
                      נבדק ב-
                      {format(new Date(selectedRecord.checkedInAt), 'HH:mm', {
                        locale: he,
                      })}
                    </Typography>
                  )}
                </Box>

                {/* Site */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: colors.neutral[600], display: 'block', mb: 0.5 }}
                  >
                    אתר
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedRecord.site?.name}
                  </Typography>
                </Box>

                {/* Checked By */}
                {selectedRecord.checkedInBy && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: colors.neutral[600], display: 'block', mb: 0.5 }}
                    >
                      נבדק על ידי
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {selectedRecord.checkedInBy.fullName}
                    </Typography>
                  </Box>
                )}

                {/* Notes */}
                {selectedRecord.notes && (
                  <Box
                    sx={{
                      backgroundColor: colors.neutral[50],
                      borderRadius: borderRadius.md,
                      p: 2,
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: colors.neutral[600], display: 'block', mb: 1 }}
                    >
                      הערות
                    </Typography>
                    <Typography variant="body2">{selectedRecord.notes}</Typography>
                  </Box>
                )}

                {/* Edit History */}
                {selectedRecord.lastEditedAt && (
                  <Box
                    sx={{
                      backgroundColor: `${colors.warning}10`,
                      borderRadius: borderRadius.md,
                      p: 2,
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: colors.neutral[600], display: 'block', mb: 1 }}
                    >
                      היסטוריית עריכה
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      נערך על ידי: {selectedRecord.lastEditedBy?.fullName}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      בתאריך:{' '}
                      {format(
                        new Date(selectedRecord.lastEditedAt),
                        'dd/MM/yyyy HH:mm',
                        { locale: he }
                      )}
                    </Typography>
                    {selectedRecord.editReason && (
                      <Typography variant="body2">
                        סיבה: {selectedRecord.editReason}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Complete Audit Trail */}
                {data?.auditLogs && data.auditLogs.length > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.neutral[600],
                        display: 'block',
                        mb: 1,
                        fontWeight: 600,
                      }}
                    >
                      מעקב מלא (Audit Trail)
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {data.auditLogs
                        .filter((log: any) => log.entityId === selectedRecord.id)
                        .map((log: any, index: number) => (
                          <Box
                            key={index}
                            sx={{
                              backgroundColor:
                                log.action === 'DELETE'
                                  ? `${colors.error}10`
                                  : log.action === 'CREATE'
                                  ? `${colors.success}10`
                                  : `${colors.info}10`,
                              borderRadius: borderRadius.sm,
                              p: 1.5,
                              borderLeft: `3px solid ${
                                log.action === 'DELETE'
                                  ? colors.error
                                  : log.action === 'CREATE'
                                  ? colors.success
                                  : colors.info
                              }`,
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 700, color: colors.neutral[800] }}
                              >
                                {log.action === 'CREATE'
                                  ? '✓ נוכחות נוספה'
                                  : log.action === 'UPDATE'
                                  ? '✏ נוכחות עודכנה'
                                  : '✗ נוכחות בוטלה'}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: colors.neutral[500] }}
                              >
                                {format(new Date(log.createdAt), 'dd/MM HH:mm', {
                                  locale: he,
                                })}
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{ color: colors.neutral[600], display: 'block' }}
                            >
                              על ידי: {log.userEmail}
                            </Typography>
                            {log.action === 'DELETE' && log.after?.reason && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: colors.neutral[700],
                                  display: 'block',
                                  mt: 0.5,
                                  fontStyle: 'italic',
                                }}
                              >
                                סיבה: {log.after.reason}
                              </Typography>
                            )}
                          </Box>
                        ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setDetailsDialogOpen(false)}
              variant="contained"
              sx={{ borderRadius: borderRadius.md }}
            >
              סגור
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
