'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import { checkInWorker, undoCheckIn } from '@/actions/attendance';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

type ActivistCardProps = {
  worker?: any; // Not checked in worker
  record?: any; // Checked in record
  isCheckedIn: boolean;
  onUpdate: () => void;
  isTimeWindowValid: boolean;
};

export default function ActivistCard({
  worker,
  record,
  isCheckedIn,
  onUpdate,
  isTimeWindowValid,
}: ActivistCardProps) {
  const [loading, setLoading] = useState(false);
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);
  const [undoReason, setUndoReason] = useState('');
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  // Extract worker data
  const workerData = isCheckedIn ? record.worker : worker;
  const workerId = workerData.id;
  const workerName = workerData.fullName;
  const workerPhone = workerData.phone;
  const workerPosition = workerData.position;
  const workerAvatar = workerData.avatarUrl;
  const siteId = isCheckedIn ? record.neighborhoodId : (worker?.neighborhoodId || worker?.site?.id);
  const siteName = isCheckedIn ? record.site?.name : worker?.site?.name;

  // Check-in data
  const checkedInAt = isCheckedIn ? record.checkedInAt : null;
  const checkedInBy = isCheckedIn ? record.checkedInBy?.fullName : null;
  const existingNotes = isCheckedIn ? record.notes : null;

  // Handle check-in
  const handleCheckIn = async (withNotes = false) => {
    if (!isTimeWindowValid) {
      alert('ניתן לסמן נוכחות רק בין השעות 06:00-22:00');
      return;
    }

    if (withNotes) {
      setNotesDialogOpen(true);
      return;
    }

    // Validate required fields
    if (!workerId || !siteId) {
      alert('חסרים נתונים נדרשים לסימון נוכחות');
      console.error('Missing data:', { workerId, siteId, worker, record });
      return;
    }

    try {
      setLoading(true);
      const result = await checkInWorker({
        neighborhoodId: siteId,
        activistId: workerId,
        notes: notes || undefined,
      });

      if (result.success) {
        onUpdate();
        setNotes('');
        setNotesDialogOpen(false);
      } else {
        alert(result.error || 'שגיאה בסימון נוכחות');
      }
    } catch (error: any) {
      alert(error.message || 'שגיאה בסימון נוכחות');
    } finally {
      setLoading(false);
    }
  };

  // Handle undo check-in
  const handleUndoCheckIn = async () => {
    if (!undoReason.trim()) {
      alert('נא לציין סיבה לביטול');
      return;
    }

    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      const result = await undoCheckIn({
        activistId: workerId,
        date: today,
        reason: undoReason,
      });

      if (result.success) {
        onUpdate();
        setUndoDialogOpen(false);
        setUndoReason('');
      } else {
        alert(result.error || 'שגיאה בביטול נוכחות');
      }
    } catch (error: any) {
      alert(error.message || 'שגיאה בביטול נוכחות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card
        elevation={0}
        sx={{
          borderRadius: borderRadius.lg,
          border: `2px solid ${
            isCheckedIn ? colors.success + '40' : colors.neutral[200]
          }`,
          backgroundColor: isCheckedIn
            ? `${colors.success}05`
            : colors.neutral[0],
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: shadows.medium,
            transform: 'translateY(-2px)',
            borderColor: isCheckedIn ? colors.success : colors.primary.main,
          },
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          {/* Header with Avatar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
              mb: 2,
              direction: 'rtl',
            }}
          >
            <Avatar
              src={workerAvatar}
              sx={{
                width: 56,
                height: 56,
                bgcolor: isCheckedIn ? colors.success : colors.primary.main,
                fontSize: '24px',
                fontWeight: 700,
              }}
            >
              {workerName?.charAt(0)}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: colors.neutral[900],
                  mb: 0.5,
                  lineHeight: 1.3,
                  textAlign: 'right',
                }}
              >
                {workerName}
              </Typography>

              {/* Status Badge */}
              {isCheckedIn ? (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="נבדק"
                  size="small"
                  sx={{
                    backgroundColor: colors.success,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '12px',
                    height: 24,
                    borderRadius: borderRadius.sm,
                    '& .MuiChip-icon': {
                      color: '#fff',
                      marginRight: 0.5,
                      marginLeft: 0,
                    },
                  }}
                />
              ) : (
                <Chip
                  icon={<CheckCircleOutlineIcon />}
                  label="לא נבדק"
                  size="small"
                  sx={{
                    backgroundColor: `${colors.neutral[300]}`,
                    color: colors.neutral[700],
                    fontWeight: 600,
                    fontSize: '12px',
                    height: 24,
                    borderRadius: borderRadius.sm,
                    '& .MuiChip-icon': {
                      color: colors.neutral[600],
                      marginRight: 0.5,
                      marginLeft: 0,
                    },
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Worker Info */}
          <Box sx={{ mb: 2, direction: 'rtl' }}>
            {workerPosition && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <WorkIcon sx={{ fontSize: 16, color: colors.neutral[500] }} />
                <Typography
                  variant="body2"
                  sx={{ color: colors.neutral[600], textAlign: 'right' }}
                >
                  {workerPosition}
                </Typography>
              </Box>
            )}
            {workerPhone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <PhoneIcon sx={{ fontSize: 16, color: colors.neutral[500] }} />
                <Typography
                  variant="body2"
                  sx={{ color: colors.neutral[600], textAlign: 'right', direction: 'ltr' }}
                >
                  {workerPhone}
                </Typography>
              </Box>
            )}
            {siteName && (
              <Typography
                variant="caption"
                sx={{
                  color: colors.neutral[500],
                  display: 'block',
                  textAlign: 'right',
                }}
              >
                אתר: {siteName}
              </Typography>
            )}
          </Box>

          {/* Check-in Details (if checked in) */}
          {isCheckedIn && checkedInAt && (
            <Box
              sx={{
                backgroundColor: `${colors.success}10`,
                borderRadius: borderRadius.sm,
                p: 1.5,
                mb: 2,
                direction: 'rtl',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: colors.neutral[600],
                  display: 'block',
                  mb: 0.5,
                  fontWeight: 600,
                }}
              >
                נבדק ב:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.neutral[800],
                  fontWeight: 700,
                  mb: existingNotes ? 1 : 0,
                }}
              >
                {format(new Date(checkedInAt), 'HH:mm', { locale: he })}
              </Typography>
              {checkedInBy && (
                <Typography
                  variant="caption"
                  sx={{ color: colors.neutral[500], display: 'block' }}
                >
                  על ידי: {checkedInBy}
                </Typography>
              )}
              {existingNotes && (
                <Box
                  sx={{
                    mt: 1,
                    pt: 1,
                    borderTop: `1px solid ${colors.neutral[200]}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: colors.neutral[600],
                      display: 'block',
                      mb: 0.5,
                      fontWeight: 600,
                    }}
                  >
                    הערות:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: colors.neutral[700], textAlign: 'right' }}
                  >
                    {existingNotes}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Actions */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              direction: 'rtl',
            }}
          >
            {isCheckedIn ? (
              // Undo Button
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={() => setUndoDialogOpen(true)}
                disabled={loading || !isTimeWindowValid}
                sx={{
                  borderRadius: borderRadius.md,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderWidth: 2,
                  display: 'flex',
                  gap: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  py: 1.5,
                  '&:hover': {
                    borderWidth: 2,
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={20} color="error" />
                ) : (
                  <CancelIcon sx={{ fontSize: 20 }} />
                )}
                <span>ביטול נוכחות</span>
              </Button>
            ) : (
              // Check-in Buttons
              <>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleCheckIn(false)}
                  disabled={loading || !isTimeWindowValid}
                  sx={{
                    borderRadius: borderRadius.md,
                    textTransform: 'none',
                    fontWeight: 600,
                    backgroundColor: colors.success,
                    display: 'flex',
                    gap: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: colors.success,
                      filter: 'brightness(0.9)',
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={20} sx={{ color: '#fff' }} />
                  ) : (
                    <CheckCircleIcon sx={{ fontSize: 20 }} />
                  )}
                  <span>סמן נוכח</span>
                </Button>
                <Tooltip title="סמן עם הערה">
                  <IconButton
                    onClick={() => setNotesDialogOpen(true)}
                    disabled={loading || !isTimeWindowValid}
                    sx={{
                      border: `2px solid ${colors.primary.main}`,
                      borderRadius: borderRadius.md,
                      '&:hover': {
                        backgroundColor: `${colors.primary.main}10`,
                      },
                    }}
                  >
                    <NoteAddIcon sx={{ color: colors.primary.main }} />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>

          {/* Time Window Warning */}
          {!isTimeWindowValid && (
            <Typography
              variant="caption"
              sx={{
                color: colors.warning,
                display: 'block',
                textAlign: 'center',
                mt: 1,
                fontWeight: 600,
              }}
            >
              מחוץ לשעות נוכחות
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Undo Dialog */}
      <Dialog
        open={undoDialogOpen}
        onClose={() => setUndoDialogOpen(false)}
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
          ביטול נוכחות - {workerName}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={3}
            fullWidth
            label="סיבה לביטול"
            placeholder="למשל: סומן בטעות, העובד לא הגיע..."
            value={undoReason}
            onChange={(e) => setUndoReason(e.target.value)}
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.md,
                direction: 'rtl',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setUndoDialogOpen(false)}
            disabled={loading}
            sx={{ borderRadius: borderRadius.md }}
          >
            ביטול
          </Button>
          <Button
            onClick={handleUndoCheckIn}
            variant="contained"
            color="error"
            disabled={loading || !undoReason.trim()}
            sx={{
              borderRadius: borderRadius.md,
              display: 'flex',
              gap: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {loading && <CircularProgress size={20} sx={{ color: '#fff' }} />}
            <span>אישור ביטול</span>
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog
        open={notesDialogOpen}
        onClose={() => setNotesDialogOpen(false)}
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
          הוסף הערה - {workerName}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={3}
            fullWidth
            label="הערות (אופציונלי)"
            placeholder="הוסף הערה..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.md,
                direction: 'rtl',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setNotesDialogOpen(false)}
            disabled={loading}
            sx={{ borderRadius: borderRadius.md }}
          >
            ביטול
          </Button>
          <Button
            onClick={() => handleCheckIn(false)}
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: borderRadius.md,
              backgroundColor: colors.success,
              display: 'flex',
              gap: 1,
              justifyContent: 'center',
              alignItems: 'center',
              '&:hover': {
                backgroundColor: colors.success,
                filter: 'brightness(0.9)',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: '#fff' }} />
            ) : (
              <CheckCircleIcon sx={{ fontSize: 20 }} />
            )}
            <span>סמן נוכח</span>
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
