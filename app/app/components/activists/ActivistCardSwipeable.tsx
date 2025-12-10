/**
 * Swipeable Activist Card Component
 * Mobile-optimized card with swipe gestures for quick actions
 *
 * Swipe Actions:
 * - Swipe Right: Quick check-in
 * - Swipe Left: Edit activist
 *
 * Features:
 * - Smooth animations
 * - Visual feedback
 * - Touch-friendly (56x56px action buttons)
 * - RTL support
 */

'use client';

import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Card, CardContent, Box, Typography, IconButton, Avatar } from '@mui/material';
import { colors, shadows } from '@/lib/design-system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface Activist {
  id: string;
  fullName: string;
  phone?: string | null;
  neighborhood?: {
    name: string;
  };
  position?: string | null;
  tags?: string[];
}

interface ActivistCardSwipeableProps {
  activist: Activist;
  onCheckIn?: (activistId: string) => void;
  onEdit?: (activistId: string) => void;
}

export default function ActivistCardSwipeable({
  activist,
  onCheckIn,
  onEdit,
}: ActivistCardSwipeableProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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
        // Trigger edit
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
        borderRadius: '16px',
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
            borderRadius: '16px 0 0 16px',
            opacity: checkInVisible ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        >
          <CheckCircleIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>

        {/* Left Swipe Action - Edit */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: '100%',
            bgcolor: colors.primary.main,
            borderRadius: '0 16px 16px 0',
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
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing',
          },
          boxShadow: shadows.soft,
          borderRadius: '16px',
          bgcolor: colors.neutral[0],
          border: `1px solid ${colors.neutral[200]}`,
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Avatar */}
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: colors.primary.main,
                fontSize: '1.25rem',
                fontWeight: 700,
              }}
            >
              {activist.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </Avatar>

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: colors.neutral[700],
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activist.fullName}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 14, color: colors.neutral[400] }} />
                <Typography variant="caption" color="text.secondary">
                  {activist.neighborhood?.name || 'ללא שכונה'}
                </Typography>
              </Box>

              {activist.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 14, color: colors.neutral[400] }} />
                  <Typography variant="caption" color="text.secondary">
                    {activist.phone}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Desktop Actions (Visible on hover) */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                gap: 1,
                opacity: 0,
                transition: 'opacity 0.2s',
                '&:hover': {
                  opacity: 1,
                },
              }}
            >
              <IconButton
                size="small"
                onClick={() => onCheckIn?.(activist.id)}
                sx={{
                  bgcolor: colors.status.green + '20',
                  '&:hover': {
                    bgcolor: colors.status.green,
                    color: 'white',
                  },
                }}
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onEdit?.(activist.id)}
                sx={{
                  bgcolor: colors.primary.main + '20',
                  '&:hover': {
                    bgcolor: colors.primary.main,
                    color: 'white',
                  },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Tags */}
          {activist.tags && activist.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
              {activist.tags.slice(0, 3).map((tag, index) => (
                <Box
                  key={index}
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: '6px',
                    bgcolor: colors.pastel.blueLight,
                    border: `1px solid ${colors.primary.main}20`,
                  }}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: colors.primary.main }}>
                    {tag}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
