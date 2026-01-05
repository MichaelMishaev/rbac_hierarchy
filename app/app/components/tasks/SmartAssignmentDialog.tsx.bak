/**
 * Smart Assignment Dialog Component
 * Shows AI-powered activist suggestions for task assignments
 *
 * Features:
 * - Displays candidates sorted by score
 * - Shows proximity, workload, and availability
 * - Hebrew RTL support
 * - Mobile-responsive design
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CloseIcon from '@mui/icons-material/Close';

interface AssignmentCandidate {
  activistId: string;
  activistName: string;
  neighborhoodName: string;
  score: number;
  distance: number; // in meters
  currentLoad: number;
  isAvailable: boolean;
}

interface SmartAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (activistId: string) => void;
  location: { lat: number; lng: number };
  neighborhoodId: string;
  isRTL?: boolean;
}

export default function SmartAssignmentDialog({
  open,
  onClose,
  onSelect,
  location,
  neighborhoodId,
  isRTL = true,
}: SmartAssignmentDialogProps) {
  const [candidates, setCandidates] = useState<AssignmentCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && location && neighborhoodId) {
      fetchSuggestions();
    }
  }, [open, location, neighborhoodId]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tasks/suggest-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          neighborhoodId,
          count: 5,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setCandidates(data.suggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} מ'`;
    }
    return `${(meters / 1000).toFixed(1)} ק"מ`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return colors.status.green;
    if (score >= 0.5) return colors.status.orange;
    return colors.neutral[400];
  };

  const handleSelect = (activistId: string) => {
    onSelect(activistId);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      dir={isRTL ? 'rtl' : 'ltr'}
      PaperProps={{
        sx: {
          borderRadius: borderRadius.xl,
          boxShadow: shadows.large,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${colors.neutral[200]}`,
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUpIcon sx={{ color: colors.primary.main, fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: colors.neutral[900] }}>
            {isRTL ? 'הצעות פעילים חכמות' : 'Smart Activist Suggestions'}
          </Typography>
        </Box>
        <Button
          onClick={onClose}
          sx={{ minWidth: 'auto', p: 1, color: colors.neutral[600] }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {isRTL ? 'מחשב הצעות אופטימליות...' : 'Calculating optimal suggestions...'}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && candidates.length === 0 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {isRTL ? 'לא נמצאו פעילים זמינים באזור זה' : 'No available activists found in this area'}
            </Typography>
          </Box>
        )}

        {!loading && !error && candidates.length > 0 && (
          <>
            <Typography variant="body2" sx={{ mb: 2, color: colors.neutral[600] }}>
              {isRTL
                ? 'מסודר לפי התאמה (קרבה, עומס, זמינות)'
                : 'Sorted by match score (proximity, workload, availability)'}
            </Typography>

            <List sx={{ p: 0 }}>
              {candidates.map((candidate, index) => (
                <ListItem
                  key={candidate.activistId}
                  onClick={() => handleSelect(candidate.activistId)}
                  sx={{
                    mb: 1.5,
                    p: 2,
                    background: colors.neutral[0],
                    border: `2px solid ${colors.neutral[200]}`,
                    borderRadius: borderRadius.lg,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: shadows.medium,
                      borderColor: colors.primary.main,
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: getScoreColor(candidate.score),
                        fontWeight: 700,
                      }}
                    >
                      {index + 1}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {candidate.activistName}
                        </Typography>
                        {candidate.isAvailable && (
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                            label={isRTL ? 'זמין' : 'Available'}
                            size="small"
                            sx={{
                              bgcolor: colors.pastel.greenLight,
                              color: colors.status.green,
                              fontWeight: 600,
                              height: 22,
                              '& .MuiChip-icon': {
                                color: colors.status.green,
                              },
                            }}
                          />
                        )}
                      </Box>
                    }
                    primaryTypographyProps={{ component: 'div' }}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {/* Score Progress Bar */}
                        <Box sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {isRTL ? 'התאמה' : 'Match'}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: getScoreColor(candidate.score) }}>
                              {Math.round(candidate.score * 100)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={candidate.score * 100}
                            sx={{
                              height: 6,
                              borderRadius: borderRadius.full,
                              bgcolor: colors.neutral[200],
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getScoreColor(candidate.score),
                                borderRadius: borderRadius.full,
                              },
                            }}
                          />
                        </Box>

                        {/* Stats */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon sx={{ fontSize: 14, color: colors.neutral[400] }} />
                            <Typography variant="caption" sx={{ color: colors.neutral[600] }}>
                              {formatDistance(candidate.distance)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AssignmentIcon sx={{ fontSize: 14, color: colors.neutral[400] }} />
                            <Typography variant="caption" sx={{ color: colors.neutral[600] }}>
                              {candidate.currentLoad} {isRTL ? 'משימות' : 'tasks'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: `1px solid ${colors.neutral[200]}`,
          p: 2,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: colors.neutral[600],
            fontWeight: 600,
            '&:hover': {
              bgcolor: colors.neutral[100],
            },
          }}
        >
          ביטול
        </Button>
      </DialogActions>
    </Dialog>
  );
}
