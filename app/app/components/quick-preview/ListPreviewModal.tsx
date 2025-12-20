'use client';

import { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  useMediaQuery,
  useTheme,
  Slide,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import React from 'react';

// Slide transition for mobile bottom sheet
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

type ListItem = {
  id: string;
  name: string;
  subtitle?: string;
  isActive?: boolean;
  avatar?: string;
  icon?: React.ReactNode;
};

type ListPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  items: ListItem[];
  type: 'neighborhoods' | 'activists' | 'managers' | 'activistCoordinators';
  onItemClick?: (id: string) => void;
};

export default function ListPreviewModal({
  open,
  onClose,
  title,
  items,
  type,
  onItemClick,
}: ListPreviewModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getIconForType = (type: string) => {
    switch (type) {
      case 'neighborhoods':
        return <LocationOnIcon sx={{ color: colors.pastel.green }} />;
      case 'activists':
        return <GroupIcon sx={{ color: colors.pastel.orange }} />;
      case 'managers':
        return <PeopleIcon sx={{ color: colors.pastel.purple }} />;
      case 'activistCoordinators':
        return <SupervisorAccountIcon sx={{ color: colors.pastel.blue }} />;
      default:
        return <GroupIcon />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'neighborhoods':
        return colors.pastel.green;
      case 'activists':
        return colors.pastel.orange;
      case 'managers':
        return colors.pastel.purple;
      case 'activistCoordinators':
        return colors.pastel.blue;
      default:
        return colors.neutral[500];
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : borderRadius.xl,
          maxHeight: isMobile ? '100vh' : '80vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${colors.neutral[200]}`,
          pb: 2,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: borderRadius.md,
              backgroundColor: `${getColorForType(type)}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {getIconForType(type)}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {items.length} {items.length === 1 ? 'פריט' : 'פריטים'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content - List of items */}
      <DialogContent sx={{ p: 0 }}>
        {items.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              color: colors.neutral[500],
            }}
          >
            <Typography variant="body2">אין פריטים להצגה</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      if (onItemClick) {
                        onItemClick(item.id);
                      }
                    }}
                    sx={{
                      py: 2,
                      px: 3,
                      '&:hover': {
                        backgroundColor: `${getColorForType(type)}10`,
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={item.avatar}
                        sx={{
                          bgcolor: `${getColorForType(type)}30`,
                          color: getColorForType(type),
                          borderRadius: borderRadius.md,
                        }}
                      >
                        {item.icon || item.name[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight={500}>
                          {item.name}
                        </Typography>
                      }
                      secondary={
                        item.subtitle && (
                          <Typography variant="caption" color="text.secondary" component="span">
                            {item.subtitle}
                          </Typography>
                        )
                      }
                    />
                    {item.isActive !== undefined && (
                      <Chip
                        label={item.isActive ? 'פעיל' : 'לא פעיל'}
                        size="small"
                        color={item.isActive ? 'success' : 'default'}
                        sx={{ ml: 2 }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
                {index < items.length - 1 && (
                  <Box
                    sx={{
                      height: 1,
                      backgroundColor: colors.neutral[100],
                      mx: 3,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
