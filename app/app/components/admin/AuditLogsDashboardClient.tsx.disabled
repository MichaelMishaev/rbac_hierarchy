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
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuditLogEntry } from '@/app/actions/admin-audit';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface AuditLogsDashboardClientProps {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
  entityTypes: string[];
  stats: any;
  initialFilters: {
    dateRange?: '24h' | '7d' | '30d' | 'custom';
    customDateFrom?: string;
    customDateTo?: string;
    action?: 'CREATE' | 'UPDATE' | 'DELETE';
    entity?: string;
    entityId?: string;
    userEmail?: string;
    cityId?: string;
  };
}

export default function AuditLogsDashboardClient({
  logs,
  total,
  page,
  totalPages,
  entityTypes,
  stats,
  initialFilters,
}: AuditLogsDashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters
  const [dateRange, setDateRange] = useState(initialFilters.dateRange || '7d');
  const [customDateFrom, setCustomDateFrom] = useState(initialFilters.customDateFrom || '');
  const [customDateTo, setCustomDateTo] = useState(initialFilters.customDateTo || '');
  const [action, setAction] = useState(initialFilters.action || '');
  const [entity, setEntity] = useState(initialFilters.entity || '');
  const [entityId, setEntityId] = useState(initialFilters.entityId || '');
  const [userEmail, setUserEmail] = useState(initialFilters.userEmail || '');

  // Selected log for detail view
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (dateRange) params.set('dateRange', dateRange);
    if (dateRange === 'custom') {
      if (customDateFrom) params.set('customDateFrom', customDateFrom);
      if (customDateTo) params.set('customDateTo', customDateTo);
    }
    if (action) params.set('action', action);
    if (entity) params.set('entity', entity);
    if (entityId) params.set('entityId', entityId);
    if (userEmail) params.set('userEmail', userEmail);
    params.set('page', '1');

    router.push(`?${params.toString()}`);
  };

  // Clear filters
  const clearFilters = () => {
    setDateRange('7d');
    setCustomDateFrom('');
    setCustomDateTo('');
    setAction('');
    setEntity('');
    setEntityId('');
    setUserEmail('');
    router.push(window.location.pathname);
  };

  // Handle pagination
  const handlePageChange = (_: any, newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  // Get action color/icon
  const getActionDisplay = (action: string) => {
    switch (action) {
      case 'CREATE':
        return { icon: <AddIcon sx={{ fontSize: 18 }} />, color: colors.success, label: 'יצירה' };
      case 'UPDATE':
        return { icon: <EditIcon sx={{ fontSize: 18 }} />, color: colors.info, label: 'עדכון' };
      case 'DELETE':
        return { icon: <DeleteIcon sx={{ fontSize: 18 }} />, color: colors.error, label: 'מחיקה' };
      default:
        return { icon: null, color: colors.textSecondary, label: action };
    }
  };

  return (
    <Box dir="rtl" lang="he" sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          יומן ביקורת (Audit Log)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          מעקב אחר כל השינויים במערכת - יצירה, עדכון, ומחיקה
        </Typography>
      </Box>

      {/* Stats Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.byAction.map((item: any) => {
          const display = getActionDisplay(item.action);
          return (
            <Grid item xs={12} sm={4} key={item.action}>
              <Card sx={{ boxShadow: shadows.sm, borderRadius: borderRadius.lg }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        bgcolor: `${display.color}15`,
                        borderRadius: borderRadius.md,
                        p: 1,
                        display: 'flex',
                      }}
                    >
                      {display.icon}
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {display.label}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {item._count.toLocaleString('he-IL')}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3, boxShadow: shadows.sm, borderRadius: borderRadius.lg }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterListIcon sx={{ mr: 1, color: colors.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              סינון רשומות
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

            {/* Custom Date Range */}
            {dateRange === 'custom' && (
              <>
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
              </>
            )}

            {/* Action */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>פעולה</InputLabel>
                <Select value={action} label="פעולה" onChange={(e) => setAction(e.target.value as any)}>
                  <MenuItem value="">הכל</MenuItem>
                  <MenuItem value="CREATE">יצירה</MenuItem>
                  <MenuItem value="UPDATE">עדכון</MenuItem>
                  <MenuItem value="DELETE">מחיקה</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Entity */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>סוג ישות</InputLabel>
                <Select value={entity} label="סוג ישות" onChange={(e) => setEntity(e.target.value)}>
                  <MenuItem value="">הכל</MenuItem>
                  {entityTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Entity ID */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="מזהה ישות (ID)"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="חיפוש לפי ID..."
              />
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
          נמצאו {total} רשומות | עמוד {page} מתוך {totalPages}
        </Typography>
      </Box>

      {/* Audit Logs Table */}
      <TableContainer component={Paper} sx={{ boxShadow: shadows.md, borderRadius: borderRadius.lg }}>
        <Table>
          <TableHead sx={{ bgcolor: colors.backgroundHover }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>פעולה</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ישות</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>מזהה</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>משתמש</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>זמן</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">לא נמצאו רשומות</Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const actionDisplay = getActionDisplay(log.action);
                return (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Chip
                        icon={actionDisplay.icon}
                        label={actionDisplay.label}
                        size="small"
                        sx={{
                          bgcolor: `${actionDisplay.color}15`,
                          color: actionDisplay.color,
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.entity}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {log.entityId.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {log.userEmail ? (
                        <Typography variant="body2">{log.userEmail}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          מערכת
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="צפה בפרטים">
                        <IconButton size="small" onClick={() => setSelectedLog(log)} color="primary">
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

      {/* Audit Detail Dialog */}
      {selectedLog && (
        <Dialog
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          maxWidth="md"
          fullWidth
          dir="rtl"
          PaperProps={{ sx: { borderRadius: borderRadius.lg } }}
        >
          <DialogTitle>פרטי רשומת ביקורת</DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  פעולה
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {getActionDisplay(selectedLog.action).label}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  ישות
                </Typography>
                <Typography variant="body1">{selectedLog.entity}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  מזהה ישות
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {selectedLog.entityId}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  משתמש
                </Typography>
                <Typography variant="body2">{selectedLog.userEmail || 'מערכת'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  זמן
                </Typography>
                <Typography variant="body2">
                  {format(new Date(selectedLog.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: he })}
                </Typography>
              </Grid>
              {selectedLog.before && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    לפני השינוי:
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: colors.backgroundHover, maxHeight: 200, overflow: 'auto' }}>
                    <Typography
                      component="pre"
                      sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', m: 0 }}
                    >
                      {JSON.stringify(selectedLog.before, null, 2)}
                    </Typography>
                  </Paper>
                </Grid>
              )}
              {selectedLog.after && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    אחרי השינוי:
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: colors.backgroundHover, maxHeight: 200, overflow: 'auto' }}>
                    <Typography
                      component="pre"
                      sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap', m: 0 }}
                    >
                      {JSON.stringify(selectedLog.after, null, 2)}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSelectedLog(null)} variant="contained">
              סגור
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
