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
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import WarningIcon from '@mui/icons-material/Warning';

type DeleteConfirmationModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  itemName?: string;
};

export default function DeleteConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
}: DeleteConfirmationModalProps) {
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error during deletion:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        },
      }}
      TransitionProps={{
        timeout: 300,
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          pb: 3,
          pt: 4,
          px: 4,
          background: 'linear-gradient(135deg, #FFE5E9 0%, #FFFFFF 100%)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #E44258 0%, #D12F45 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(228, 66, 88, 0.25)',
            }}
          >
            <WarningIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.error }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              פעולה זו אינה ניתנת לביטול
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 4, pb: 3, px: 4 }}>
        <Box
          sx={{
            p: 3,
            borderRadius: '16px',
            backgroundColor: '#FFF5F5',
            border: '1px solid',
            borderColor: '#FFCDD2',
          }}
        >
          {itemName && (
            <Typography
              variant="body1"
              sx={{
                color: colors.neutral[700],
                mb: 2,
                fontWeight: 600,
              }}
            >
              {itemName}
            </Typography>
          )}
          <Typography
            variant="body1"
            sx={{
              color: colors.neutral[600],
            }}
          >
            {message}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 4,
          py: 3,
          gap: 2,
          backgroundColor: '#FAFBFC',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          size="large"
          sx={{
            borderRadius: '12px',
            px: 4,
            py: 1.5,
            fontWeight: 600,
            borderWidth: 2,
            borderColor: 'divider',
            color: 'text.secondary',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderWidth: 2,
              borderColor: 'primary.main',
              backgroundColor: 'transparent',
              color: 'primary.main',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(97, 97, 255, 0.15)',
            },
          }}
        >
          {tCommon('cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading}
          size="large"
          sx={{
            borderRadius: '12px',
            px: 4,
            py: 1.5,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #E44258 0%, #D12F45 100%)',
            boxShadow: '0 4px 12px rgba(228, 66, 88, 0.3)',
            transition: 'all 0.2s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #D12F45 0%, #B82838 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(228, 66, 88, 0.4)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          }}
        >
          {loading ? <CircularProgress size={24} /> : tCommon('delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
