'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import { ErrorLogWithContext } from '@/app/actions/admin-errors';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonIcon from '@mui/icons-material/Person';
import DevicesIcon from '@mui/icons-material/Devices';
import HttpIcon from '@mui/icons-material/Http';
import { colors, borderRadius } from '@/lib/design-system';
import { useState } from 'react';

interface ErrorDetailDialogProps {
  error: ErrorLogWithContext;
  open: boolean;
  onClose: () => void;
}

export default function ErrorDetailDialog({ error, open, onClose }: ErrorDetailDialogProps) {
  const [copied, setCopied] = useState(false);

  // Copy stack trace to clipboard
  const copyStackTrace = () => {
    if (error.stack) {
      navigator.clipboard.writeText(error.stack);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Format metadata for display
  const formatMetadata = (metadata: any) => {
    if (!metadata) return 'N/A';
    try {
      return JSON.stringify(metadata, null, 2);
    } catch {
      return String(metadata);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      dir="rtl"
      lang="he"
      PaperProps={{
        sx: { borderRadius: borderRadius.lg },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          פרטי שגיאה
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Content */}
      <DialogContent sx={{ pt: 3 }}>
        {/* Error Level and Type */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={error.level}
              size="small"
              sx={{
                bgcolor:
                  error.level === 'CRITICAL'
                    ? colors.error + '15'
                    : error.level === 'ERROR'
                      ? colors.warning + '15'
                      : colors.info + '15',
                color:
                  error.level === 'CRITICAL' ? colors.error : error.level === 'ERROR' ? colors.warning : colors.info,
                fontWeight: 600,
              }}
            />
            <Chip
              label={error.errorType}
              size="small"
              variant="outlined"
              sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
            />
            {error.code && (
              <Chip
                label={error.code}
                size="small"
                variant="outlined"
                color="secondary"
                sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
              />
            )}
          </Box>

          {/* Timestamp */}
          <Typography variant="caption" color="text.secondary">
            {format(new Date(error.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: he })} | {error.environment}
          </Typography>
        </Box>

        {/* Error Message */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            הודעת שגיאה
          </Typography>
          <Paper sx={{ p: 2, bgcolor: colors.backgroundHover, borderRadius: borderRadius.md }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {error.message}
            </Typography>
          </Paper>
        </Box>

        {/* User Context */}
        {(error.userId || error.userEmail || error.userRole || error.cityId) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
              פרטי משתמש
            </Typography>
            <Paper sx={{ p: 2, bgcolor: colors.backgroundHover, borderRadius: borderRadius.md }}>
              {error.userEmail && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>אימייל:</strong> {error.userEmail}
                </Typography>
              )}
              {error.userId && (
                <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  <strong>ID:</strong> {error.userId}
                </Typography>
              )}
              {error.userRole && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>תפקיד:</strong> {error.userRole}
                </Typography>
              )}
              {error.cityId && (
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  <strong>עיר:</strong> {error.cityId}
                </Typography>
              )}
            </Paper>
          </Box>
        )}

        {/* HTTP Context */}
        {(error.httpMethod || error.httpStatus || error.url) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
              <HttpIcon sx={{ mr: 1, fontSize: 20 }} />
              פרטי HTTP
            </Typography>
            <Paper sx={{ p: 2, bgcolor: colors.backgroundHover, borderRadius: borderRadius.md }}>
              {error.httpMethod && error.httpStatus && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>בקשה:</strong> {error.httpMethod}{' '}
                  <Chip label={error.httpStatus} size="small" sx={{ ml: 1, fontFamily: 'monospace' }} />
                </Typography>
              )}
              {error.url && (
                <Typography
                  variant="body2"
                  sx={{ mb: 0.5, fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}
                >
                  <strong>URL:</strong> {error.url}
                </Typography>
              )}
              {error.referer && (
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}
                >
                  <strong>Referer:</strong> {error.referer}
                </Typography>
              )}
            </Paper>
          </Box>
        )}

        {/* Device Context */}
        {(error.ipAddress || error.userAgent) && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
              <DevicesIcon sx={{ mr: 1, fontSize: 20 }} />
              מכשיר ורשת
            </Typography>
            <Paper sx={{ p: 2, bgcolor: colors.backgroundHover, borderRadius: borderRadius.md }}>
              {error.ipAddress && (
                <Typography variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  <strong>IP Address:</strong> {error.ipAddress}
                </Typography>
              )}
              {error.userAgent && (
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}
                >
                  <strong>User Agent:</strong> {error.userAgent}
                </Typography>
              )}
              {error.requestId && (
                <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  <strong>Request ID:</strong> {error.requestId}
                </Typography>
              )}
            </Paper>
          </Box>
        )}

        {/* Metadata */}
        {error.metadata && Object.keys(error.metadata).length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              מטא-דאטה נוספת
            </Typography>
            <Paper sx={{ p: 2, bgcolor: colors.backgroundHover, borderRadius: borderRadius.md, maxHeight: 200, overflow: 'auto' }}>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  m: 0,
                }}
              >
                {formatMetadata(error.metadata)}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Stack Trace */}
        {error.stack && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Stack Trace
              </Typography>
              <Tooltip title={copied ? 'הועתק!' : 'העתק ללוח'}>
                <IconButton size="small" onClick={copyStackTrace} color={copied ? 'success' : 'default'}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Paper
              sx={{
                p: 2,
                bgcolor: '#1e1e1e',
                color: '#d4d4d4',
                borderRadius: borderRadius.md,
                maxHeight: 300,
                overflow: 'auto',
              }}
            >
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  m: 0,
                }}
              >
                {error.stack}
              </Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          סגור
        </Button>
      </DialogActions>
    </Dialog>
  );
}
