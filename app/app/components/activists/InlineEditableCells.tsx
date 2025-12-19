'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Switch,
  Chip,
  CircularProgress,
  Fade,
  Tooltip,
  IconButton,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { colors, borderRadius } from '@/lib/design-system';
import toast from 'react-hot-toast';
import { quickUpdateActivistField } from '@/app/actions/activists';

// ============================================
// EDITABLE TEXT CELL (Phone, Email, Position)
// ============================================

type EditableTextCellProps = {
  value: string | null | undefined;
  activistId: string;
  field: 'phone' | 'email' | 'position';
  onUpdate: () => void;
  isRTL: boolean;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel';
  icon?: React.ReactNode;
};

export function EditableTextCell({
  value,
  activistId,
  field,
  onUpdate,
  isRTL,
  placeholder = '-',
  type = 'text',
  icon,
}: EditableTextCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    // No change, just cancel
    if (localValue === (value || '')) {
      setIsEditing(false);
      return;
    }

    setSaving(true);

    try {
      const result = await quickUpdateActivistField(activistId, field, localValue);

      if (result.success) {
        // Success feedback
        toast.success(
          `${getFieldLabel(field)} עודכן בהצלחה`,
          {
            duration: 2000,
            icon: '✓',
            style: {
              background: colors.pastel.greenLight,
              color: colors.pastel.green,
              fontWeight: 600,
            },
          }
        );

        setIsEditing(false);
        onUpdate(); // Refresh data
      } else {
        // Error feedback
        toast.error(result.error || 'שגיאה בעדכון', {
          duration: 3000,
          style: {
            background: colors.pastel.redLight,
            color: colors.pastel.red,
            fontWeight: 600,
          },
        });

        // Revert to original value
        setLocalValue(value || '');
      }
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('שגיאה בעדכון');
      setLocalValue(value || '');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Display mode
  if (!isEditing) {
    return (
      <Tooltip
        title="לחץ פעמיים לעריכה"
        arrow
        placement="top"
      >
        <Box
          onDoubleClick={() => setIsEditing(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            borderRadius: borderRadius.md,
            cursor: 'pointer',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: isHovered ? colors.neutral[100] : 'transparent',
            border: `2px solid ${isHovered ? colors.primary.light : 'transparent'}`,
            minHeight: 42,
            '&:hover': {
              boxShadow: `0 0 0 4px ${colors.primary.light}20`,
            },
          }}
        >
          {icon && (
            <Box sx={{ color: colors.neutral[500], display: 'flex', fontSize: 18 }}>
              {icon}
            </Box>
          )}
          <Box sx={{ flex: 1, color: value ? colors.neutral[800] : colors.neutral[400] }}>
            {value || placeholder}
          </Box>
          <Fade in={isHovered}>
            <Box sx={{ display: 'flex', color: colors.primary.main, fontSize: 16 }}>
              <EditIcon fontSize="inherit" />
            </Box>
          </Fade>
        </Box>
      </Tooltip>
    );
  }

  // Edit mode
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        animation: 'slideIn 200ms ease-out',
        '@keyframes slideIn': {
          from: { opacity: 0, transform: 'scale(0.95)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
      }}
    >
      <TextField
        inputRef={inputRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        disabled={saving}
        type={type}
        size="small"
        placeholder={placeholder}
        sx={{
          flex: 1,
          '& .MuiOutlinedInput-root': {
            height: 42,
            borderRadius: borderRadius.md,
            backgroundColor: colors.neutral[0],
            border: `2px solid ${colors.primary.main}`,
            '& fieldset': {
              borderColor: 'transparent',
            },
            '&:hover fieldset': {
              borderColor: 'transparent',
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 4px ${colors.primary.light}40`,
            },
          },
        }}
      />

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="שמור" arrow>
          <IconButton
            onClick={handleSave}
            disabled={saving}
            size="small"
            sx={{
              width: 36,
              height: 36,
              backgroundColor: colors.pastel.greenLight,
              color: colors.pastel.green,
              '&:hover': {
                backgroundColor: colors.pastel.green,
                color: colors.neutral[0],
              },
            }}
          >
            {saving ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Tooltip title="ביטול" arrow>
          <IconButton
            onClick={handleCancel}
            disabled={saving}
            size="small"
            sx={{
              width: 36,
              height: 36,
              backgroundColor: colors.neutral[200],
              color: colors.neutral[700],
              '&:hover': {
                backgroundColor: colors.neutral[300],
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

// ============================================
// STATUS TOGGLE CELL (Active/Inactive)
// ============================================

type StatusToggleCellProps = {
  isActive: boolean;
  activistId: string;
  onUpdate: () => void;
  isRTL: boolean;
  disabled?: boolean;
};

export function StatusToggleCell({
  isActive,
  activistId,
  onUpdate,
  isRTL,
  disabled = false,
}: StatusToggleCellProps) {
  const [saving, setSaving] = useState(false);
  const [optimisticValue, setOptimisticValue] = useState(isActive);

  // Sync optimistic value when actual value changes
  useEffect(() => {
    setOptimisticValue(isActive);
  }, [isActive]);

  const handleToggle = async (checked: boolean) => {
    // Optimistic update for instant feedback
    setOptimisticValue(checked);
    setSaving(true);

    try {
      const result = await quickUpdateActivistField(activistId, 'isActive', checked);

      if (result.success) {
        toast.success(
          `הסטטוס שונה ל${checked ? 'פעיל' : 'לא פעיל'}`,
          {
            duration: 2000,
            icon: checked ? '✓' : '○',
            style: {
              background: checked ? colors.pastel.greenLight : colors.neutral[100],
              color: checked ? colors.pastel.green : colors.neutral[700],
              fontWeight: 600,
            },
          }
        );

        onUpdate(); // Refresh data
      } else {
        // Revert optimistic update on error
        setOptimisticValue(isActive);
        toast.error(result.error || 'שגיאה בעדכון סטטוס', {
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setOptimisticValue(isActive);
      toast.error('שגיאה בעדכון סטטוס');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1,
        borderRadius: borderRadius.md,
        transition: 'all 200ms ease',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Switch
          checked={optimisticValue}
          onChange={(e) => handleToggle(e.target.checked)}
          disabled={saving || disabled}
          size="small"
          sx={{
            '& .MuiSwitch-switchBase': {
              '&.Mui-checked': {
                color: colors.pastel.green,
                '& + .MuiSwitch-track': {
                  backgroundColor: colors.pastel.green,
                  opacity: 0.7,
                },
              },
            },
            '& .MuiSwitch-track': {
              backgroundColor: colors.neutral[400],
              opacity: 0.5,
            },
          }}
        />
        {saving && (
          <CircularProgress
            size={20}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginTop: '-10px',
              marginLeft: '-10px',
              color: colors.primary.main,
            }}
          />
        )}
      </Box>

      <Chip
        label={optimisticValue ? 'פעיל' : 'לא פעיל'}
        size="small"
        sx={{
          backgroundColor: optimisticValue ? colors.pastel.greenLight : colors.neutral[200],
          color: optimisticValue ? colors.pastel.green : colors.neutral[700],
          fontWeight: 600,
          borderRadius: borderRadius.md,
          transition: 'all 200ms ease',
          animation: saving ? 'pulse 1s infinite' : 'none',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.7 },
          },
        }}
      />
    </Box>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getFieldLabel(field: 'phone' | 'email' | 'position'): string {
  const labels = {
    phone: 'טלפון',
    email: 'אימייל',
    position: 'תפקיד',
  };
  return labels[field];
}
