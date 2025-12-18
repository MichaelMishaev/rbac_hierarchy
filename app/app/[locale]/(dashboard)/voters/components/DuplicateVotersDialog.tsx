/**
 * Duplicate Voters Dialog - Hebrew RTL
 *
 * Shows all duplicate voters (same phone + email) for a specific voter
 * RBAC-filtered: User only sees duplicates they have permission to view
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
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
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { getVoterDuplicates } from '@/app/actions/get-voter-duplicates';

type VoterDuplicate = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  insertedByUserName: string;
  insertedByUserRole: string;
  insertedAt: Date;
};

type DuplicateVotersDialogProps = {
  open: boolean;
  onClose: () => void;
  voterId: string;
  voterName: string;
  voterPhone: string;
  voterEmail: string;
};

export function DuplicateVotersDialog({
  open,
  onClose,
  voterId,
  voterName,
  voterPhone,
  voterEmail,
}: DuplicateVotersDialogProps) {
  const [duplicates, setDuplicates] = useState<VoterDuplicate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && voterId) {
      loadDuplicates();
    }
  }, [open, voterId]);

  const loadDuplicates = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getVoterDuplicates(voterId);
      if (result.success) {
        setDuplicates(result.duplicates);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('[DuplicateVotersDialog] Error:', err);
      setError('שגיאה בטעינת כפילויות');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      SUPERADMIN: 'מנהל מערכת',
      AREA_MANAGER: 'מנהל איזור',
      CITY_COORDINATOR: 'רכז עיר',
      ACTIVIST_COORDINATOR: 'רכז פעילים',
    };
    return roleMap[role] || role;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth dir="rtl">
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CopyIcon color="warning" />
          <Typography variant="h6">כפילויות - {voterName}</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Current Voter Info */}
        <Alert severity="info" icon={<PersonIcon />} sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            בוחר נוכחי:
          </Typography>
          <Typography variant="body2">
            טלפון: {voterPhone} • אימייל: {voterEmail || 'לא צוין'}
          </Typography>
        </Alert>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Duplicates Table */}
        {!loading && !error && duplicates.length === 0 && (
          <Alert severity="success">לא נמצאו כפילויות נוספות</Alert>
        )}

        {!loading && !error && duplicates.length > 0 && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              נמצאו {duplicates.length} כפילויות נוספות עם טלפון ואימייל זהים:
            </Typography>

            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'warning.light' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>שם מלא</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>טלפון</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>אימייל</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>הוזן ע״י</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>תאריך</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {duplicates.map((dup) => (
                    <TableRow key={dup.id}>
                      <TableCell>{dup.fullName}</TableCell>
                      <TableCell>{dup.phone}</TableCell>
                      <TableCell>{dup.email || '-'}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{dup.insertedByUserName}</Typography>
                          <Chip
                            label={getRoleLabel(dup.insertedByUserRole)}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(dup.insertedAt).toLocaleDateString('he-IL', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
