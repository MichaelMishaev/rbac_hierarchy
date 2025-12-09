'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Collapse,
  IconButton,
  Chip,
  LinearProgress,
  Fade,
  Zoom,
  Alert,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import WarningIcon from '@mui/icons-material/Warning';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

interface RecipientPreview {
  count: number;
  breakdown: {
    by_role: {
      area_manager: number;
      corporation_manager: number;
      supervisor: number;
    };
    by_corporation: Array<{
      corporation_id: string;
      name: string;
      count: number;
    }>;
  };
}

interface SpamPreventionModalV2Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  recipientPreview: RecipientPreview;
  taskBody: string;
  executionDate: Date | null;
  submitting: boolean;
}

export default function SpamPreventionModalV2({
  open,
  onClose,
  onConfirm,
  recipientPreview,
  taskBody,
  executionDate,
  submitting,
}: SpamPreventionModalV2Props) {
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');

  const [expandedDetails, setExpandedDetails] = useState(false);
  const [expandedTask, setExpandedTask] = useState(false);
  const isHighRisk = recipientPreview.count > 50;

  const handleConfirm = async () => {
    await onConfirm();
  };

  // Calculate visual metrics
  const totalRecipients = recipientPreview.count;
  const hasMultipleCorporations = recipientPreview.breakdown.by_corporation.length > 1;

  return (
    <Dialog
      open={open}
      onClose={!submitting ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: borderRadius.xl,
          boxShadow: shadows.large,
          overflow: 'visible',
        },
      }}
      TransitionComponent={Zoom}
      transitionDuration={300}
      data-testid="confirmation-modal"
    >
      {/* Header with visual impact */}
      <Box
        sx={{
          background: isHighRisk
            ? `linear-gradient(135deg, ${colors.error} 0%, #d32f2f 100%)`
            : `linear-gradient(135deg, ${colors.primary} 0%, #1565c0 100%)`,
          color: '#fff',
          p: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated background pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            animation: 'pulse 3s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0.3, transform: 'scale(1)' },
              '50%': { opacity: 0.5, transform: 'scale(1.1)' },
            },
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, justifyContent: 'flex-end' }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                אישור שליחה
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                סקור את הפרטים לפני השליחה
              </Typography>
            </Box>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
              }}
            >
              <NotificationsActiveIcon sx={{ fontSize: 32 }} />
            </Box>
          </Box>

          {/* Recipient count badge */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(10px)',
              px: 3,
              py: 1.5,
              borderRadius: borderRadius.xl,
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <PeopleIcon sx={{ fontSize: 28, color: '#fff' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1, color: '#fff' }}>
                {totalRecipients}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, color: '#fff' }}>
                נמענים
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3, direction: 'rtl' }}>
        {/* Loading progress */}
        {submitting && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress
              sx={{
                borderRadius: borderRadius.full,
                height: 6,
                backgroundColor: colors.neutral[100],
                '& .MuiLinearProgress-bar': {
                  backgroundColor: colors.success,
                },
              }}
            />
            <Typography
              variant="body2"
              sx={{ mt: 1, textAlign: 'center', color: colors.neutral[600], fontWeight: 500 }}
            >
              שולח משימה...
            </Typography>
          </Box>
        )}

        {/* Key info cards */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          {/* Execution Date Card */}
          <Fade in timeout={300}>
            <Box
              sx={{
                p: 2,
                borderRadius: borderRadius.lg,
                border: `2px solid ${colors.neutral[200]}`,
                backgroundColor: colors.neutral[50],
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: colors.primary,
                  backgroundColor: '#fff',
                  transform: 'translateY(-2px)',
                  boxShadow: shadows.medium,
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: borderRadius.lg,
                  backgroundColor: colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <CalendarTodayIcon />
              </Box>
              <Box sx={{ flex: 1, textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: colors.neutral[600], display: 'block' }}>
                  תאריך ביצוע
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.neutral[900] }}>
                  {executionDate?.toLocaleDateString('he-IL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Box>
            </Box>
          </Fade>

          {/* Recipients Breakdown */}
          <Fade in timeout={400}>
            <Box
              sx={{
                p: 2,
                borderRadius: borderRadius.lg,
                border: `2px solid ${colors.neutral[200]}`,
                backgroundColor: colors.neutral[50],
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: colors.primary,
                  backgroundColor: '#fff',
                  transform: 'translateY(-2px)',
                  boxShadow: shadows.medium,
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1.5,
                  cursor: 'pointer',
                }}
                onClick={() => setExpandedDetails(!expandedDetails)}
              >
                <IconButton size="small">
                  {expandedDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    פירוט נמענים
                  </Typography>
                  <PeopleIcon sx={{ color: colors.primary }} />
                </Box>
              </Box>

              {/* Role chips - always visible */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1, justifyContent: 'flex-end' }}>
                {recipientPreview.breakdown.by_role.area_manager > 0 && (
                  <Chip
                    label={`${recipientPreview.breakdown.by_role.area_manager} ${tNav('areaManagers')}`}
                    size="small"
                    sx={{
                      backgroundColor: colors.primary,
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  />
                )}
                {recipientPreview.breakdown.by_role.corporation_manager > 0 && (
                  <Chip
                    label={`${recipientPreview.breakdown.by_role.corporation_manager} ${t('managers')}`}
                    size="small"
                    sx={{
                      backgroundColor: colors.info,
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  />
                )}
                {recipientPreview.breakdown.by_role.supervisor > 0 && (
                  <Chip
                    label={`${recipientPreview.breakdown.by_role.supervisor} ${tNav('supervisors')}`}
                    size="small"
                    sx={{
                      backgroundColor: colors.success,
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>

              {/* Expandable corporation details */}
              <Collapse in={expandedDetails}>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: colors.neutral[600],
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mb: 1,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <BusinessIcon fontSize="small" />
                    פילוח לפי תאגידים:
                  </Typography>
                  {recipientPreview.breakdown.by_corporation.map((corp, index) => (
                    <Box
                      key={corp.corporation_id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 0.5,
                        px: 1,
                        mb: 0.5,
                        borderRadius: borderRadius.md,
                        backgroundColor: index % 2 === 0 ? colors.neutral[100] : 'transparent',
                      }}
                    >
                      <Chip label={corp.count} size="small" color="primary" variant="outlined" />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {corp.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Box>
          </Fade>

          {/* Task Preview */}
          <Fade in timeout={500}>
            <Box
              sx={{
                p: 2,
                borderRadius: borderRadius.lg,
                border: `2px solid ${colors.neutral[200]}`,
                backgroundColor: colors.neutral[50],
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: colors.primary,
                  backgroundColor: '#fff',
                  transform: 'translateY(-2px)',
                  boxShadow: shadows.medium,
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1.5,
                  cursor: 'pointer',
                }}
                onClick={() => setExpandedTask(!expandedTask)}
              >
                <IconButton size="small">
                  {expandedTask ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    תוכן המשימה
                  </Typography>
                  <DescriptionIcon sx={{ color: colors.primary }} />
                </Box>
              </Box>

              <Collapse in={expandedTask}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: '#fff',
                    borderRadius: borderRadius.md,
                    border: `1px solid ${colors.neutral[200]}`,
                    maxHeight: 150,
                    overflow: 'auto',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.neutral[700],
                      whiteSpace: 'pre-wrap',
                      textAlign: 'right',
                      lineHeight: 1.6,
                    }}
                  >
                    {taskBody}
                  </Typography>
                </Box>
              </Collapse>

              {!expandedTask && (
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.neutral[600],
                    fontStyle: 'italic',
                    textAlign: 'right',
                  }}
                >
                  {taskBody.substring(0, 80)}
                  {taskBody.length > 80 ? '...' : ''}
                </Typography>
              )}
            </Box>
          </Fade>
        </Box>

        {/* High-risk warning */}
        {isHighRisk && (
          <Fade in>
            <Alert
              severity="warning"
              icon={<WarningIcon />}
              sx={{
                mb: 2,
                borderRadius: borderRadius.lg,
                backgroundColor: `${colors.warning}15`,
                border: `2px solid ${colors.warning}`,
                '& .MuiAlert-icon': {
                  color: colors.warning,
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
                שים לב: שליחה למעל 50 נמענים
              </Typography>
              <Typography variant="caption" sx={{ textAlign: 'right' }}>
                ודא שהמשימה רלוונטית לכל הנמענים
              </Typography>
            </Alert>
          </Fade>
        )}

        {/* Final confirmation */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: borderRadius.lg,
            backgroundColor: colors.neutral[50],
            border: `2px dashed ${colors.neutral[300]}`,
            textAlign: 'center',
          }}
        >
          <CheckCircleOutlineIcon sx={{ fontSize: 40, color: colors.success, mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: colors.neutral[900], mb: 0.5 }}>
            האם אתה בטוח?
          </Typography>
          <Typography variant="body2" sx={{ color: colors.neutral[600] }}>
            המשימה תישלח מיידית לכל הנמענים
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          gap: 1.5,
          direction: 'rtl',
          justifyContent: 'space-between',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={submitting}
          size="large"
          sx={{
            borderColor: colors.neutral[300],
            color: colors.neutral[700],
            minWidth: 120,
            borderRadius: borderRadius.lg,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '15px',
            '&:hover': {
              borderColor: colors.neutral[400],
              backgroundColor: colors.neutral[50],
            },
          }}
          data-testid="modal-cancel"
        >
          ביטול
        </Button>

        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={submitting}
          size="large"
          sx={{
            backgroundColor: isHighRisk ? colors.error : colors.success,
            minWidth: 160,
            borderRadius: borderRadius.lg,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '15px',
            boxShadow: shadows.medium,
            display: 'flex',
            gap: 1,
            '&:hover': {
              backgroundColor: isHighRisk ? colors.error : colors.success,
              filter: 'brightness(0.9)',
              boxShadow: shadows.large,
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.2s ease',
          }}
          data-testid="modal-confirm"
        >
          {submitting ? (
            <CircularProgress size={24} sx={{ color: '#fff' }} />
          ) : (
            <>
              שלח משימה
              <CheckCircleOutlineIcon />
            </>
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
