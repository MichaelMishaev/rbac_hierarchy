/**
 * Swipeable Activist Card Component with Inline Editing
 * Mobile-optimized card with swipe gestures + inline editing
 *
 * Swipe Actions:
 * - Swipe Right: Quick check-in
 * - Swipe Left: Full edit (modal)
 *
 * Inline Actions (2025 UX):
 * - Click phone/position to edit inline
 * - Toggle status with switch
 * - Enter to save, Escape to cancel
 *
 * Features:
 * - Smooth animations
 * - Optimistic updates
 * - Touch-friendly (56x56px action buttons)
 * - RTL support
 */

'use client';

import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Box, Typography, IconButton, Avatar, Chip, Menu, MenuItem } from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import { EditableTextCell } from './InlineEditableCells';

interface Activist {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  neighborhood?: {
    name: string;
  };
  position?: string | null;
  tags?: string[];
  isActive?: boolean;
  userId?: string | null;
}

interface ActivistCardSwipeableProps {
  activist: Activist;
  onCheckIn?: (activistId: string) => void;
  onEdit?: (activistId: string) => void;
  onDelete?: (activistId: string) => void;
  onResetPassword?: (activistId: string) => void;
  isRTL?: boolean;
}

export default function ActivistCardSwipeable({
  activist,
  onCheckIn,
  onEdit,
  onDelete,
  onResetPassword,
  isRTL = true,
}: ActivistCardSwipeableProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      setIsDragging(true);
      // Limit offset to -120px (left) and 120px (right)
      const newOffset = Math.max(-120, Math.min(120, eventData.deltaX));
      setOffset(newOffset);
    },
    onSwipedRight: () => {
      if (offset > 80) {
        // Trigger check-in
        onCheckIn?.(activist.id);
      }
      setOffset(0);
      setIsDragging(false);
    },
    onSwipedLeft: () => {
      if (offset < -80) {
        // Trigger full edit (modal)
        onEdit?.(activist.id);
      }
      setOffset(0);
      setIsDragging(false);
    },
    onSwiped: () => {
      setOffset(0);
      setIsDragging(false);
    },
    trackMouse: true, // Enable mouse dragging for desktop testing
  });

  const checkInVisible = offset > 40;
  const editVisible = offset < -40;

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: borderRadius.xl,
        mb: 2,
      }}
      data-testid="activist-card-swipeable"
    >
      {/* Background Actions */}
      <Box
        sx={{
          position: 'absolute',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          px: 2,
        }}
      >
        {/* Right Swipe Action - Check In */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: '100%',
            bgcolor: colors.status.green,
            borderRadius: `${borderRadius.xl} 0 0 ${borderRadius.xl}`,
            opacity: checkInVisible ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        >
          <CheckCircleIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>

        {/* Left Swipe Action - Full Edit */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: '100%',
            bgcolor: colors.primary.main,
            borderRadius: `0 ${borderRadius.xl} ${borderRadius.xl} 0`,
            opacity: editVisible ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        >
          <EditIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
      </Box>

      {/* Main Card */}
      <Card
        {...handlers}
        sx={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease',
          cursor: isDragging ? 'grabbing' : 'default',
          boxShadow: shadows.soft,
          borderRadius: borderRadius.xl,
          bgcolor: colors.neutral[0],
          border: `1px solid ${colors.neutral[200]}`,
          '&:hover': {
            boxShadow: shadows.medium,
            borderColor: colors.primary.light,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header Row - Avatar + Name + Status */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            {/* Avatar */}
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: colors.primary.main,
                fontSize: '1.25rem',
                fontWeight: 700,
                boxShadow: shadows.soft,
              }}
            >
              {activist.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </Avatar>

            {/* Name + Neighborhood */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: colors.neutral[800],
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activist.fullName}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 16, color: colors.neutral[500] }} />
                <Typography variant="body2" sx={{ color: colors.neutral[600], fontWeight: 500 }}>
                  {activist.neighborhood?.name || 'ללא שכונה'}
                </Typography>
              </Box>
            </Box>

            {/* Three Dots Menu */}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setAnchorEl(e.currentTarget);
              }}
              sx={{
                bgcolor: colors.neutral[100],
                '&:hover': {
                  bgcolor: colors.neutral[200],
                },
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Editable Fields Section */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              p: 2,
              borderRadius: borderRadius.lg,
              bgcolor: colors.neutral[50],
              border: `1px solid ${colors.neutral[200]}`,
            }}
          >
            {/* Position - Editable */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: colors.neutral[600],
                  fontWeight: 600,
                  mb: 0.5,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                תפקיד
              </Typography>
              <Box
                sx={{
                  '& > div': {
                    // Override padding for card view
                    p: '8px !important',
                  },
                }}
              >
                <EditableTextCell
                  value={activist.position}
                  activistId={activist.id}
                  field="position"
                  onUpdate={() => router.refresh()}
                  isRTL={isRTL}
                  placeholder="ללא תפקיד"
                  icon={<WorkIcon fontSize="inherit" />}
                />
              </Box>
            </Box>

            {/* Phone - Editable */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: colors.neutral[600],
                  fontWeight: 600,
                  mb: 0.5,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                טלפון
              </Typography>
              <Box
                sx={{
                  '& > div': {
                    // Override padding for card view
                    p: '8px !important',
                  },
                }}
              >
                <EditableTextCell
                  value={activist.phone}
                  activistId={activist.id}
                  field="phone"
                  onUpdate={() => router.refresh()}
                  isRTL={isRTL}
                  type="tel"
                  placeholder="ללא טלפון"
                  icon={<PhoneIcon fontSize="inherit" />}
                />
              </Box>
            </Box>
          </Box>

          {/* Bottom Row - Tags + Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            {/* Tags */}
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1 }}>
              {activist.tags && activist.tags.length > 0 ? (
                activist.tags.slice(0, 2).map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    sx={{
                      fontSize: '0.7rem',
                      height: 24,
                      bgcolor: colors.pastel.blueLight,
                      color: colors.primary.main,
                      border: `1px solid ${colors.primary.main}30`,
                      fontWeight: 600,
                    }}
                  />
                ))
              ) : (
                <Typography variant="caption" sx={{ color: colors.neutral[400] }}>
                  ללא תגיות
                </Typography>
              )}
            </Box>

            {/* Status Chip - Visual Only (no inline toggle on mobile for simplicity) */}
            <Chip
              label={activist.isActive !== false ? 'פעיל' : 'לא פעיל'}
              size="small"
              sx={{
                bgcolor: activist.isActive !== false ? colors.pastel.greenLight : colors.neutral[200],
                color: activist.isActive !== false ? colors.pastel.green : colors.neutral[700],
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
          </Box>

          {/* Mobile Full Edit Button */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              justifyContent: 'center',
              mt: 2,
            }}
          >
            <Chip
              label="ערוך הכל"
              onClick={() => onEdit?.(activist.id)}
              icon={<EditIcon />}
              sx={{
                bgcolor: colors.primary.main,
                color: colors.neutral[0],
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: colors.primary.dark,
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: isRTL ? 'left' : 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: isRTL ? 'left' : 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: borderRadius.lg,
            boxShadow: shadows.large,
            minWidth: 160,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            onEdit?.(activist.id);
            setAnchorEl(null);
          }}
          sx={{
            py: 1.5,
            px: 2,
            gap: 1.5,
            '&:hover': {
              backgroundColor: colors.pastel.blueLight,
            },
          }}
        >
          <EditIcon sx={{ fontSize: 20, color: colors.pastel.blue }} />
          <Typography sx={{ fontWeight: 500 }}>ערוך</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onResetPassword?.(activist.id);
            setAnchorEl(null);
          }}
          disabled={!activist.userId}
          sx={{
            py: 1.5,
            px: 2,
            gap: 1.5,
            '&:hover': {
              backgroundColor: !activist.userId ? 'transparent' : colors.pastel.orangeLight,
            },
          }}
        >
          <LockResetIcon sx={{ fontSize: 20, color: colors.status.orange }} />
          <Typography sx={{ fontWeight: 500, color: colors.status.orange }}>אפס סיסמה</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDelete?.(activist.id);
            setAnchorEl(null);
          }}
          sx={{
            py: 1.5,
            px: 2,
            gap: 1.5,
            '&:hover': {
              backgroundColor: colors.pastel.redLight,
            },
          }}
        >
          <DeleteIcon sx={{ fontSize: 20, color: colors.pastel.red }} />
          <Typography sx={{ fontWeight: 500, color: colors.pastel.red }}>מחק</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
