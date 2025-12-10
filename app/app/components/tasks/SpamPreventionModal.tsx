'use client';

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
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import WarningIcon from '@mui/icons-material/Warning';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';

interface RecipientPreview {
  count: number;
  breakdown: {
    by_role: {
      area_manager: number;
      corporation_manager: number;
      activistCoordinator: number;
    };
    by_city: Array<{
      corporation_id: string;
      name: string;
      count: number;
    }>;
  };
}

interface SpamPreventionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  recipientPreview: RecipientPreview;
  taskBody: string;
  executionDate: Date | null;
  submitting: boolean;
}

export default function SpamPreventionModal({
  open,
  onClose,
  onConfirm,
  recipientPreview,
  taskBody,
  executionDate,
  submitting,
}: SpamPreventionModalProps) {
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');

  const isHighRisk = recipientPreview.count > 50;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: borderRadius.xl,
          boxShadow: shadows.large,
        },
      }}
      data-testid="confirmation-modal"
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: '24px',
          color: isHighRisk ? colors.error : colors.warning,
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          justifyContent: 'flex-end',
          direction: 'rtl',
        }}
      >
        {t('confirmSend')}
        <WarningIcon sx={{ fontSize: 28 }} />
      </DialogTitle>

      <DialogContent sx={{ direction: 'rtl' }}>
        {/* Main Warning */}
        <Box sx={{ py: 2 }}>
          <Typography
            variant="h6"
            sx={{
              color: isHighRisk ? colors.error : colors.neutral[800],
              mb: 2,
              fontWeight: 700,
              textAlign: 'right',
            }}
          >
            {t('youAreAboutToSend')} {recipientPreview.count} {t('recipients')}
          </Typography>

          {/* Breakdown by Role */}
          <Box
            sx={{
              mb: 3,
              p: 2,
              backgroundColor: colors.neutral[50],
              borderRadius: borderRadius.lg,
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                mb: 2,
                textAlign: 'right',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: 'flex-end',
              }}
            >
              {t('details')}:
              <PeopleIcon fontSize="small" />
            </Typography>
            <Box sx={{ textAlign: 'right' }}>
              {recipientPreview.breakdown.by_role.corporation_manager > 0 && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  • {recipientPreview.breakdown.by_role.corporation_manager} {t('managers')}
                </Typography>
              )}
              {recipientPreview.breakdown.by_role.supervisor > 0 && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  • {recipientPreview.breakdown.by_role.supervisor} {tNav('supervisors')}
                </Typography>
              )}
              {recipientPreview.breakdown.by_role.area_manager > 0 && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  • {recipientPreview.breakdown.by_role.area_manager} {tNav('areaManagers')}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Breakdown by Corporation */}
          {recipientPreview.breakdown.by_corporation.length > 0 && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                backgroundColor: colors.neutral[50],
                borderRadius: borderRadius.lg,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  textAlign: 'right',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  justifyContent: 'flex-end',
                }}
              >
                {t('corporations')}:
                <BusinessIcon fontSize="small" />
              </Typography>
              <Box sx={{ textAlign: 'right' }}>
                {recipientPreview.breakdown.by_corporation.map((corp, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                    • {corp.name} ({corp.count} {t('recipients')})
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          {/* Execution Date */}
          <Box sx={{ mb: 2, textAlign: 'right' }}>
            <Typography variant="body2" sx={{ color: colors.neutral[600] }}>
              {t('executionDate')}:{' '}
              <strong>
                {executionDate?.toLocaleDateString('he-IL', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
              </strong>
            </Typography>
          </Box>

          {/* Task Preview */}
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              p: 2,
              backgroundColor: colors.neutral[50],
              borderRadius: borderRadius.lg,
              maxHeight: 100,
              overflow: 'auto',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: colors.neutral[700],
                fontStyle: 'italic',
                textAlign: 'right',
                whiteSpace: 'pre-wrap',
              }}
            >
              {taskBody.substring(0, 200)}
              {taskBody.length > 200 ? '...' : ''}
            </Typography>
          </Box>

          {/* Final Confirmation */}
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              textAlign: 'right',
              color: isHighRisk ? colors.error : colors.neutral[800],
            }}
          >
            {t('areYouSure')}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, direction: 'rtl' }}>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={submitting}
          sx={{
            backgroundColor: isHighRisk ? colors.error : colors.success,
            minWidth: 120,
            '&:hover': {
              backgroundColor: isHighRisk ? colors.error : colors.success,
              filter: 'brightness(0.9)',
            },
          }}
          data-testid="modal-confirm"
        >
          {submitting ? <CircularProgress size={24} /> : `${t('sendTask')} ✅`}
        </Button>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={submitting}
          sx={{
            borderColor: colors.neutral[300],
            color: colors.neutral[700],
            minWidth: 120,
          }}
          data-testid="modal-cancel"
        >
          {tCommon('cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
