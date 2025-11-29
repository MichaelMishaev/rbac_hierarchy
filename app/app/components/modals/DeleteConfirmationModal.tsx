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
          borderRadius: borderRadius.xl,
          boxShadow: shadows.large,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: '24px',
          color: colors.error,
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <WarningIcon sx={{ fontSize: 28 }} />
        {title}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
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

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            borderColor: colors.neutral[300],
            color: colors.neutral[700],
          }}
        >
          {tCommon('cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={loading}
          sx={{
            backgroundColor: colors.error,
            '&:hover': {
              backgroundColor: colors.error,
              filter: 'brightness(0.9)',
            },
          }}
        >
          {loading ? <CircularProgress size={24} /> : tCommon('delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
