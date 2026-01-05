/**
 * Deleted Voters List Component - Hebrew RTL
 *
 * Shows soft-deleted voters (isActive = false)
 * - Shows deletion metadata (deleted by, deleted at)
 * - Restore functionality
 * - Pagination support
 * - Hebrew RTL layout
 */

'use client';

import { useEffect, useState } from 'react';
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
  CircularProgress,
  Alert,
  TablePagination,
  Button,
  Tooltip,
} from '@mui/material';
import {
  RestoreFromTrash as RestoreIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { getDeletedVoters, restoreVoter } from '@/lib/voters/actions/voter-actions';
import type { Voter } from '@/lib/voters';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export function DeletedVotersList() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalVoters, setTotalVoters] = useState(0);

  useEffect(() => {
    loadVoters();
  }, [page, rowsPerPage]);

  const loadVoters = async () => {
    setLoading(true);
    setError(null);

    const result = await getDeletedVoters({
      limit: rowsPerPage,
      offset: page * rowsPerPage,
    });

    if (result.success) {
      setVoters(result.data);
      setTotalVoters(result.total);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleRestore = async (voterId: string, voterName: string) => {
    if (!confirm(`האם לשחזר את הבוחר "${voterName}"?`)) {
      return;
    }

    const result = await restoreVoter(voterId);

    if (result.success) {
      loadVoters();
    } else {
      setError(result.error);
    }
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
      'AREA_MANAGER': 'מנהל אזור',
      'CITY_COORDINATOR': 'רכז עיר',
      'ACTIVIST_COORDINATOR': 'רכז פעילים',
    };
    return roleMap[role] || role;
  };

  const filteredVoters = voters.filter((voter) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      voter.fullName.toLowerCase().includes(searchLower) ||
      voter.phone.includes(searchLower) ||
      (voter.email && voter.email.toLowerCase().includes(searchLower))
    );
  });

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
        }}
      >
        <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          בוחרים מחוקים ({searchQuery ? filteredVoters.length : totalVoters})
        </Typography>
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

      {/* Search */}
      <Box sx={{ mb: { xs: 2, sm: 3 }, px: { xs: 0.5, sm: 0 } }}>
        <TextField
          label="חיפוש"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="שם, טלפון, אימייל"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: { xs: '16px', sm: '32px' },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              minHeight: { xs: 44, sm: 56 },
            },
          }}
        />
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: { xs: '16px', sm: '32px' },
          overflow: 'auto',
          boxShadow: 2,
        }}
      >
        <Table sx={{ minWidth: { xs: 900, md: 'auto' } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'error.lighter' }}>
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
                נמחק על ידי
              </TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                תאריך מחיקה
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
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    אין בוחרים מחוקים
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredVoters.map((voter) => (
                <TableRow
                  key={voter.id}
                  hover
                  sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                >
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon sx={{ fontSize: { xs: 16, sm: 18 } }} color="action" />
                      <Typography
                        variant="body2"
                        sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem' } }}
                      >
                        {voter.phone}
                      </Typography>
                    </Box>
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
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {voter.deletedByUserName || '-'}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ py: { xs: 1.5, sm: 2 } }}>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {voter.deletedAt
                        ? format(new Date(voter.deletedAt), 'dd/MM/yyyy HH:mm', {
                            locale: he,
                          })
                        : '-'}
                    </Typography>
                  </TableCell>

                  <TableCell align="center" sx={{ py: { xs: 1.5, sm: 2 } }}>
                    <Tooltip title="שחזור">
                      <IconButton
                        size="small"
                        onClick={() => handleRestore(voter.id, voter.fullName)}
                        color="success"
                        sx={{
                          minWidth: { xs: 36, sm: 40 },
                          minHeight: { xs: 36, sm: 40 },
                          p: { xs: 0.5, sm: 1 },
                        }}
                      >
                        <RestoreIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                      </IconButton>
                    </Tooltip>
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
    </Box>
  );
}
