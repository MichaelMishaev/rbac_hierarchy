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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  ContentCopy as DuplicateIcon,
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
}

export function VotersList({ onViewVoter, onEditVoter, refreshKey }: VotersListProps) {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [duplicateMap, setDuplicateMap] = useState<Record<string, number>>({});
  const [selectedDuplicateVoter, setSelectedDuplicateVoter] = useState<Voter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [supportFilter, setSupportFilter] = useState('');
  const [contactFilter, setContactFilter] = useState('');

  useEffect(() => {
    loadVoters();
  }, [supportFilter, contactFilter, refreshKey]);

  const loadVoters = async () => {
    setLoading(true);
    setError(null);

    const [votersResult, duplicatesResult] = await Promise.all([
      getVisibleVoters({
        isActive: true,
        supportLevel: supportFilter || undefined,
        contactStatus: contactFilter || undefined,
        limit: 100,
      }),
      getVotersWithDuplicates(),
    ]);

    if (votersResult.success) {
      setVoters(votersResult.data);
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
          רשימת בוחרים ({filteredVoters.length})
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
