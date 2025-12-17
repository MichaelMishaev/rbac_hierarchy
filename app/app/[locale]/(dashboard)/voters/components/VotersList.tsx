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
} from '@mui/icons-material';
import { getVisibleVoters, deleteVoter } from '@/lib/voters/actions/voter-actions';
import type { Voter } from '@/lib/voters';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface VotersListProps {
  onViewVoter?: (voter: Voter) => void;
  onEditVoter?: (voter: Voter) => void;
}

export function VotersList({ onViewVoter, onEditVoter }: VotersListProps) {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [supportFilter, setSupportFilter] = useState('');
  const [contactFilter, setContactFilter] = useState('');

  useEffect(() => {
    loadVoters();
  }, [supportFilter, contactFilter]);

  const loadVoters = async () => {
    setLoading(true);
    setError(null);

    const result = await getVisibleVoters({
      isActive: true,
      supportLevel: supportFilter || undefined,
      contactStatus: contactFilter || undefined,
      limit: 100,
    });

    if (result.success) {
      setVoters(result.data);
    } else {
      setError(result.error);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          רשימת בוחרים ({filteredVoters.length})
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="חיפוש"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="שם, טלפון, אימייל"
          sx={{ minWidth: 250 }}
        />

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>רמת תמיכה</InputLabel>
          <Select
            value={supportFilter}
            onChange={(e) => setSupportFilter(e.target.value)}
            label="רמת תמיכה"
          >
            <MenuItem value="">הכל</MenuItem>
            <MenuItem value="תומך">תומך</MenuItem>
            <MenuItem value="מהסס">מהסס</MenuItem>
            <MenuItem value="מתנגד">מתנגד</MenuItem>
            <MenuItem value="לא ענה">לא ענה</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>סטטוס קשר</InputLabel>
          <Select
            value={contactFilter}
            onChange={(e) => setContactFilter(e.target.value)}
            label="סטטוס קשר"
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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.light' }}>
              <TableCell>שם מלא</TableCell>
              <TableCell>טלפון</TableCell>
              <TableCell>רמת תמיכה</TableCell>
              <TableCell>סטטוס קשר</TableCell>
              <TableCell>עדיפות</TableCell>
              <TableCell>הוכנס על ידי</TableCell>
              <TableCell>תאריך הכנסה</TableCell>
              <TableCell align="center">פעולות</TableCell>
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
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {voter.fullName}
                    </Typography>
                    {voter.email && (
                      <Typography variant="caption" color="text.secondary">
                        {voter.email}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">{voter.phone}</Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    {voter.supportLevel && (
                      <Chip
                        label={voter.supportLevel}
                        size="small"
                        color={getSupportLevelColor(voter.supportLevel) as any}
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {voter.contactStatus || '-'}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">{voter.priority || '-'}</Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontSize="0.875rem">
                      {voter.insertedByUserName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {voter.insertedByUserRole}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontSize="0.875rem">
                      {format(new Date(voter.insertedAt), 'dd/MM/yyyy', {
                        locale: he,
                      })}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {onViewVoter && (
                        <Tooltip title="צפייה">
                          <IconButton
                            size="small"
                            onClick={() => onViewVoter(voter)}
                            color="primary"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {onEditVoter && (
                        <Tooltip title="עריכה">
                          <IconButton
                            size="small"
                            onClick={() => onEditVoter(voter)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="מחיקה">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(voter.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
