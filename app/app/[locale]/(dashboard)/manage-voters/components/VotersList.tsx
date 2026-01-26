/**
 * Voters List Component - Hebrew RTL
 *
 * Features:
 * - TanStack Table with sorting/filtering
 * - Hebrew column headers
 * - RTL layout
 * - Mobile-responsive
 * - Visibility-aware (only shows visible voters)
 * - Actions (view, edit, delete)
 * - Pagination for large datasets (top + bottom for better UX)
 *
 * ⚠️ LOCKED FILE (Last modified: 2026-01-01)
 * Last change: Added top pagination for improved UX
 * Reason: Stable voter management component with dual pagination
 * Any modifications require explicit approval.
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  CircularProgress,
  Alert,
  TablePagination,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  ContentCopy as DuplicateIcon,
  DeleteSweep as DeleteSweepIcon,
  Close as CloseIcon,
  FileDownload as ExportIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { getVisibleVoters, deleteVoter } from '@/lib/voters/actions/voter-actions';
import { getVotersWithDuplicates } from '@/app/actions/get-voter-duplicates';
import type { Voter } from '@/lib/voters';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { DuplicateVotersDialog } from './DuplicateVotersDialog';

interface VotersListProps {
  onViewVoter?: (voter: Voter) => void;
  onEditVoter?: (voter: Voter) => void;
  refreshKey?: number; // Increment to trigger refresh
  isSuperAdmin?: boolean; // RBAC: Only SuperAdmin can bulk delete
}

export function VotersList({ onViewVoter, onEditVoter, refreshKey, isSuperAdmin = false }: VotersListProps) {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [duplicateMap, setDuplicateMap] = useState<Record<string, number>>({});
  const [selectedDuplicateVoter, setSelectedDuplicateVoter] = useState<Voter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [supportFilter, setSupportFilter] = useState('');
  const [contactFilter, setContactFilter] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalVoters, setTotalVoters] = useState(0);

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedVoterIds, setSelectedVoterIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // 🚀 PERFORMANCE: Debounced search to prevent re-renders on every keystroke
  const debouncedSetSearchQuery = useDebouncedCallback(
    (value: string) => setSearchQuery(value),
    300 // 300ms delay
  );

  useEffect(() => {
    loadVoters();
  }, [supportFilter, contactFilter, refreshKey, page, rowsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(0);
  }, [supportFilter, contactFilter]);

  const loadVoters = async () => {
    setLoading(true);
    setError(null);

    const [votersResult, duplicatesResult] = await Promise.all([
      getVisibleVoters({
        isActive: true,
        supportLevel: supportFilter || undefined,
        contactStatus: contactFilter || undefined,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      }),
      getVotersWithDuplicates(),
    ]);

    if (votersResult.success) {
      setVoters(votersResult.data);
      setTotalVoters(votersResult.total);
    } else {
      setError(votersResult.error);
    }

    if (duplicatesResult.success) {
      setDuplicateMap(duplicatesResult.data);
    }

    setLoading(false);
  };

  const handleDelete = async (voterId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק בוחר זה?')) {
      return;
    }

    const result = await deleteVoter(voterId);

    if (result.success) {
      loadVoters();
    } else {
      setError(result.error);
    }
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedVoterIds(new Set()); // Clear selections when toggling mode
  };

  const handleSelectVoter = (voterId: string) => {
    const newSelection = new Set(selectedVoterIds);
    if (newSelection.has(voterId)) {
      newSelection.delete(voterId);
    } else {
      newSelection.add(voterId);
    }
    setSelectedVoterIds(newSelection);
  };

  const handleSelectAll = () => {
    const currentPageVoters = searchQuery ? filteredVoters : voters;
    if (selectedVoterIds.size === currentPageVoters.length) {
      // Deselect all
      setSelectedVoterIds(new Set());
    } else {
      // Select all on current page
      setSelectedVoterIds(new Set(currentPageVoters.map(v => v.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedVoterIds.size === 0) {
      return;
    }
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteDialogOpen(false);
    setLoading(true);
    let successCount = 0;
    let failureCount = 0;

    for (const voterId of selectedVoterIds) {
      const result = await deleteVoter(voterId);
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    setLoading(false);
    setSelectionMode(false);
    setSelectedVoterIds(new Set());

    if (failureCount > 0) {
      setError(`נמחקו ${successCount} בוחרים, ${failureCount} נכשלו`);
    }

    // Reload the voters list
    loadVoters();
  };

  const getSupportLevelColor = (level: string | null) => {
    switch (level) {
      case 'תומך':
        return 'success';
      case 'מהסס':
        return 'warning';
      case 'מתנגד':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRoleInHebrew = (role: string) => {
    const roleMap: Record<string, string> = {
      'SUPERADMIN': 'מנהל מערכת',
      'AREA_MANAGER': 'מנהל מחוז',
      'CITY_COORDINATOR': 'רכז עיר',
      'ACTIVIST_COORDINATOR': 'רכז פעילים',
    };
    return roleMap[role] || role;
  };

  /**
   * Formats Israeli phone number for WhatsApp deep link
   * - Removes all non-digit characters
   * - Converts local format (05x) to international (9725x)
   * - WhatsApp requires format: 972xxxxxxxxx (no + or spaces)
   */
  const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle Israeli numbers starting with 0
    if (cleaned.startsWith('0')) {
      cleaned = '972' + cleaned.slice(1);
    }
    // Handle numbers already starting with 972
    else if (!cleaned.startsWith('972')) {
      // Assume Israeli number if no country code
      cleaned = '972' + cleaned;
    }

    return cleaned;
  };

  const handleExportToExcel = async () => {
    // Export ALL voters (not just current page) - fetch without pagination
    setExporting(true);
    setError(null);

    try {
      // Fetch ALL voters with current filters (no pagination limit)
      const result = await getVisibleVoters({
        isActive: true,
        supportLevel: supportFilter || undefined,
        contactStatus: contactFilter || undefined,
        // NO limit/offset - fetch ALL voters
      });

      if (!result.success) {
        setError(result.error);
        setExporting(false);
        return;
      }

      const allVoters = result.data;

      // Apply client-side search filter if active
      const votersToExport = searchQuery
        ? allVoters.filter((voter) => {
            const searchLower = searchQuery.toLowerCase();
            return (
              voter.fullName.toLowerCase().includes(searchLower) ||
              voter.phone.includes(searchLower) ||
              (voter.email && voter.email.toLowerCase().includes(searchLower))
            );
          })
        : allVoters;

      if (votersToExport.length === 0) {
        setError('אין בוחרים לייצוא');
        setExporting(false);
        return;
      }

      // Create CSV content
      const headers = ['שם מלא', 'טלפון', 'אימייל', 'רמת תמיכה', 'סטטוס יצירת קשר', 'שכונה', 'עיר', 'תאריך יצירה'];
      const rows = votersToExport.map((voter) => [
        voter.fullName,
        voter.phone,
        voter.email || '',
        voter.supportLevel || '',
        voter.contactStatus || '',
        voter.voterNeighborhood || '',
        voter.voterCity || '',
        voter.insertedAt ? format(new Date(voter.insertedAt), 'dd/MM/yyyy HH:mm', { locale: he }) : '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      // Add BOM for Excel Hebrew support
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `voters-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      setExporting(false);
    } catch (err) {
      console.error('[handleExportToExcel]', err);
      setError('שגיאה בייצוא הבוחרים');
      setExporting(false);
    }
  };

  // 🚀 PERFORMANCE: Memoize filtered voters to prevent recalculating on every render
  const filteredVoters = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return voters.filter((voter) => (
      voter.fullName.toLowerCase().includes(searchLower) ||
      voter.phone.includes(searchLower) ||
      (voter.email && voter.email.toLowerCase().includes(searchLower))
    ));
  }, [voters, searchQuery]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box dir="rtl" sx={{ width: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: 2, sm: 3 },
          px: { xs: 0.5, sm: 0 },
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          רשימת בוחרים ({searchQuery ? filteredVoters.length : totalVoters})
        </Typography>

        <Box sx={{
          display: 'flex',
          gap: { xs: 1.5, sm: 2 },
          flexWrap: 'wrap',
          width: { xs: '100%', sm: 'auto' },
          flexDirection: { xs: 'column', sm: 'row' },
        }}>
          {!selectionMode && (
            <Button
              variant="contained"
              onClick={handleExportToExcel}
              disabled={totalVoters === 0 || exporting}
              startIcon={
                exporting ? (
                  <CircularProgress size={18} sx={{ color: 'inherit' }} />
                ) : (
                  <ExportIcon />
                )
              }
              sx={{
                borderRadius: '50px', // Pill-shaped (2025 UI/UX standard)
                px: { xs: 2.5, sm: 3 },
                py: { xs: 1.25, sm: 1.5 },
                fontWeight: 600,
                minHeight: 48,
                fontSize: { xs: '0.9375rem', sm: '1rem' },
                backgroundColor: 'success.main',
                color: 'white',
                boxShadow: 'none',
                flex: { xs: 1, sm: 'none' }, // Flex on mobile, auto on desktop
                '&:hover': {
                  backgroundColor: 'success.dark',
                  boxShadow: 1,
                },
                '&:disabled': {
                  backgroundColor: 'grey.300',
                  color: 'grey.500',
                },
                // RTL fix: Add gap between icon and text
                '& .MuiButton-startIcon': {
                  marginInlineEnd: 1,
                  marginInlineStart: 0,
                },
              }}
            >
              {exporting ? 'מייצא...' : `ייצוא לאקסל (${totalVoters})`}
            </Button>
          )}
          {isSuperAdmin && !selectionMode && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleToggleSelectionMode}
              startIcon={<DeleteSweepIcon />}
              sx={{
                borderRadius: '50px', // Pill-shaped (2025 UI/UX standard)
                px: { xs: 2.5, sm: 3 },
                py: { xs: 1.25, sm: 1.5 },
                fontWeight: 600,
                minHeight: 48,
                fontSize: { xs: '0.9375rem', sm: '1rem' },
                borderWidth: '1.5px',
                flex: { xs: 1, sm: 'none' }, // Flex on mobile, auto on desktop
                '&:hover': {
                  borderWidth: '1.5px',
                  backgroundColor: 'error.lighter',
                },
                // RTL fix: Add gap between icon and text
                '& .MuiButton-startIcon': {
                  marginInlineEnd: 1,
                  marginInlineStart: 0,
                },
              }}
            >
              מחיקה
            </Button>
          )}
          {isSuperAdmin && selectionMode && (
            <>
              <IconButton
                onClick={handleToggleSelectionMode}
                sx={{
                  width: { xs: 40, sm: 44 },
                  height: { xs: 40, sm: 44 },
                  borderRadius: '50%',
                  border: '1.5px solid',
                  borderColor: 'grey.400',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'grey.600',
                    backgroundColor: 'grey.100',
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
              </IconButton>

              {selectedVoterIds.size > 0 && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteSelected}
                  startIcon={<DeleteIcon />}
                  sx={{
                    borderRadius: '50px', // Pill-shaped (2025 UI/UX standard)
                    px: { xs: 2.5, sm: 3 },
                    py: { xs: 1.25, sm: 1.5 },
                    fontWeight: 600,
                    minHeight: 48,
                    fontSize: { xs: '0.9375rem', sm: '1rem' },
                    backgroundColor: 'error.main',
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: 'error.dark',
                      boxShadow: 1,
                    },
                    // RTL fix: Add gap between icon and text
                    '& .MuiButton-startIcon': {
                      marginInlineEnd: 1,
                      marginInlineStart: 0,
                    },
                  }}
                >
                  מחק נבחרים ({selectedVoterIds.size})
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: { xs: 2, sm: 3 },
            borderRadius: { xs: '16px', sm: '24px' },
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1.5, sm: 2 },
          mb: { xs: 2, sm: 3 },
          px: { xs: 0.5, sm: 0 },
        }}
      >
        <TextField
          label="חיפוש"
          defaultValue={searchQuery}
          onChange={(e) => debouncedSetSearchQuery(e.target.value)}
          placeholder="שם, טלפון, אימייל"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: { xs: '16px', sm: '32px' },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              minHeight: { xs: 44, sm: 56 }, // WCAG touch target
            },
            '& .MuiInputLabel-root': {
              fontSize: { xs: '0.875rem', sm: '1rem' },
            },
          }}
        />

        <FormControl fullWidth>
          <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            רמת תמיכה
          </InputLabel>
          <Select
            value={supportFilter}
            onChange={(e) => setSupportFilter(e.target.value)}
            label="רמת תמיכה"
            sx={{
              borderRadius: { xs: '16px', sm: '32px' },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              minHeight: { xs: 44, sm: 56 }, // WCAG touch target
            }}
          >
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="תומך">תומך</MenuItem>
            <MenuItem value="מהסס">מהסס</MenuItem>
            <MenuItem value="מתנגד">מתנגד</MenuItem>
            <MenuItem value="לא ענה">לא ענה</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            סטטוס קשר
          </InputLabel>
          <Select
            value={contactFilter}
            onChange={(e) => setContactFilter(e.target.value)}
            label="סטטוס קשר"
            sx={{
              borderRadius: { xs: '16px', sm: '32px' },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              minHeight: { xs: 44, sm: 56 }, // WCAG touch target
            }}
          >
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="נוצר קשר">נוצר קשר</MenuItem>
            <MenuItem value="נקבע פגישה">נקבע פגישה</MenuItem>
            <MenuItem value="הצביע">הצביע</MenuItem>
            <MenuItem value="לא זמין">לא זמין</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Top Pagination - UX Enhancement */}
      <TablePagination
        component="div"
        count={searchQuery ? filteredVoters.length : totalVoters}
        page={page}
        onPageChange={(_, newPage) => {
          setPage(newPage);
        }}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[50, 100, 200, 400]}
        labelRowsPerPage="שורות לעמוד:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
        sx={{
          direction: 'rtl',
          '.MuiTablePagination-toolbar': {
            flexDirection: 'row-reverse',
          },
          '.MuiTablePagination-selectLabel': {
            marginInlineStart: 0,
            marginInlineEnd: 'auto',
          },
          '.MuiTablePagination-displayedRows': {
            marginInlineStart: 'auto',
            marginInlineEnd: 0,
          },
          mb: 2,
          backgroundColor: 'background.paper',
          borderRadius: { xs: '16px', sm: '32px' },
          boxShadow: 1,
        }}
      />

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: { xs: '16px', sm: '32px' },
          overflow: 'auto', // Enable horizontal scroll on mobile
          boxShadow: 2,
          // Mobile: Enable horizontal scroll for wide table
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
        }}
      >
        <Table sx={{ minWidth: { xs: 900, md: 'auto' } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.light' }}>
              {selectionMode && (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={
                      selectedVoterIds.size > 0 &&
                      selectedVoterIds.size === (searchQuery ? filteredVoters : voters).length
                    }
                    indeterminate={
                      selectedVoterIds.size > 0 &&
                      selectedVoterIds.size < (searchQuery ? filteredVoters : voters).length
                    }
                    onChange={handleSelectAll}
                    sx={{
                      color: 'primary.main',
                      '&.Mui-checked': {
                        color: 'primary.main',
                      },
                    }}
                  />
                </TableCell>
              )}
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                שם מלא
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                טלפון
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                רמת תמיכה
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                סטטוס קשר
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                עדיפות
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                הוכנס על ידי
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                תאריך הכנסה
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}
              >
                פעולות
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVoters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    לא נמצאו בוחרים
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredVoters.map((voter) => (
                <TableRow
                  key={voter.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' },
                    backgroundColor: selectionMode && selectedVoterIds.has(voter.id) ? 'action.selected' : 'inherit',
                  }}
                >
                  {selectionMode && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedVoterIds.has(voter.id)}
                        onChange={() => handleSelectVoter(voter.id)}
                        sx={{
                          color: 'primary.main',
                          '&.Mui-checked': {
                            color: 'primary.main',
                          },
                        }}
                      />
                    </TableCell>
                  )}
                  <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                    >
                      {voter.fullName}
                    </Typography>
                    {voter.email && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                      >
                        {voter.email}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                    <Tooltip title="פתח בווטסאפ">
                      <Box
                        component="a"
                        href={`https://wa.me/${formatPhoneForWhatsApp(voter.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          textDecoration: 'none',
                          color: 'inherit',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          py: 0.5,
                          px: 1,
                          mx: -1,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(37, 211, 102, 0.1)',
                            color: '#25D366',
                            '& .whatsapp-icon': {
                              color: '#25D366',
                            },
                          },
                        }}
                        data-testid={`whatsapp-link-${voter.id}`}
                      >
                        <WhatsAppIcon
                          className="whatsapp-icon"
                          sx={{
                            fontSize: { xs: 18, sm: 20 },
                            color: '#25D366',
                            transition: 'color 0.2s ease',
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                            direction: 'ltr', // Phone numbers should be LTR
                            unicodeBidi: 'embed',
                          }}
                        >
                          {voter.phone}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>

                  <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                    {voter.supportLevel && (
                      <Chip
                        label={voter.supportLevel}
                        size="small"
                        color={getSupportLevelColor(voter.supportLevel) as any}
                        sx={{
                          borderRadius: '20px',
                          fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                          height: { xs: 24, sm: 28 },
                        }}
                      />
                    )}
                  </TableCell>

                  <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                    >
                      {voter.contactStatus || '-'}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                    >
                      {voter.priority || '-'}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {voter.insertedByUserName}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.6875rem', sm: '0.75rem' } }}
                    >
                      {getRoleInHebrew(voter.insertedByUserRole)}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {format(new Date(voter.insertedAt), 'dd/MM/yyyy', {
                        locale: he,
                      })}
                    </Typography>
                  </TableCell>

                  <TableCell align="center" sx={{ py: { xs: 1.5, sm: 2 } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: { xs: 0.25, sm: 0.5 },
                        justifyContent: 'center',
                        flexWrap: 'nowrap',
                      }}
                    >
                      {onViewVoter && (
                        <Tooltip title="צפייה">
                          <IconButton
                            size="small"
                            onClick={() => onViewVoter(voter)}
                            color="primary"
                            sx={{
                              minWidth: { xs: 36, sm: 40 },
                              minHeight: { xs: 36, sm: 40 },
                              p: { xs: 0.5, sm: 1 },
                            }}
                          >
                            <ViewIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      {onEditVoter && (
                        <Tooltip title="עריכה">
                          <IconButton
                            size="small"
                            onClick={() => onEditVoter(voter)}
                            color="primary"
                            sx={{
                              minWidth: { xs: 36, sm: 40 },
                              minHeight: { xs: 36, sm: 40 },
                              p: { xs: 0.5, sm: 1 },
                            }}
                          >
                            <EditIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="מחיקה">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(voter.id)}
                          color="error"
                          sx={{
                            minWidth: { xs: 36, sm: 40 },
                            minHeight: { xs: 36, sm: 40 },
                            p: { xs: 0.5, sm: 1 },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                        </IconButton>
                      </Tooltip>

                      {/* Duplicate Indicator */}
                      {duplicateMap[voter.id] && (
                        <Tooltip title={`${duplicateMap[voter.id]} כפילויות`}>
                          <IconButton
                            size="small"
                            onClick={() => setSelectedDuplicateVoter(voter)}
                            color="warning"
                            sx={{
                              minWidth: { xs: 36, sm: 40 },
                              minHeight: { xs: 36, sm: 40 },
                              p: { xs: 0.5, sm: 1 },
                            }}
                          >
                            <DuplicateIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={searchQuery ? filteredVoters.length : totalVoters}
        page={page}
        onPageChange={(_, newPage) => {
          setPage(newPage);
        }}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[50, 100, 200, 400]}
        labelRowsPerPage="שורות לעמוד:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} מתוך ${count}`}
        sx={{
          direction: 'rtl',
          '.MuiTablePagination-toolbar': {
            flexDirection: 'row-reverse',
          },
          '.MuiTablePagination-selectLabel': {
            marginInlineStart: 0,
            marginInlineEnd: 'auto',
          },
          '.MuiTablePagination-displayedRows': {
            marginInlineStart: 'auto',
            marginInlineEnd: 0,
          },
          mt: 2,
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        dir="rtl"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            minWidth: { xs: '90%', sm: '400px' },
            maxWidth: '500px',
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            fontWeight: 600,
            pt: 4,
            pb: 2,
          }}
        >
          האם אתה בטוח שברצונך למחוק {selectedVoterIds.size} בוחרים?
        </DialogTitle>
        <DialogContent
          sx={{
            textAlign: 'center',
            pb: 3,
          }}
        >
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            פעולה זו לא ניתנת לביטול!
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'center',
            gap: 2,
            pb: 4,
            px: 3,
          }}
        >
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: '20px',
              minWidth: '120px',
              fontSize: { xs: '0.875rem', sm: '1rem' },
              px: 3,
              py: 1,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="primary"
            sx={{
              borderRadius: '20px',
              minWidth: '120px',
              fontSize: { xs: '0.875rem', sm: '1rem' },
              px: 3,
              py: 1,
              backgroundColor: '#007AFF',
              '&:hover': {
                backgroundColor: '#0051D5',
              },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Voters Dialog */}
      {selectedDuplicateVoter && (
        <DuplicateVotersDialog
          open={!!selectedDuplicateVoter}
          onClose={() => setSelectedDuplicateVoter(null)}
          voterId={selectedDuplicateVoter.id}
          voterName={selectedDuplicateVoter.fullName}
          voterPhone={selectedDuplicateVoter.phone}
          voterEmail={selectedDuplicateVoter.email || ''}
        />
      )}
    </Box>
  );
}
