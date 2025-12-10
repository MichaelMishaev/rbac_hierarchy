'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Box,
  Drawer,
  Typography,
  Avatar,
  IconButton,
  Button,
  Stack,
  Chip,
  useMediaQuery,
  useTheme,
  SwipeableDrawer,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import QuickPreviewSkeleton from './QuickPreviewSkeleton';

type ActivistQuickPreviewProps = {
  workerId: string;
  open: boolean;
  onClose: () => void;
};

export default function ActivistQuickPreview({
  workerId,
  open,
  onClose,
}: ActivistQuickPreviewProps) {
  const router = useRouter();
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isRTL = locale === 'he';

  // TODO: Replace with actual API call
  const [isLoading, setIsLoading] = useState(false);
  const data = {
    id: workerId,
    fullName: 'יוסי כהן',
    phone: '050-1234567',
    idNumber: '123456789',
    isActive: true,
    neighborhood: {
      name: 'אתר ראשון',
      address: 'רחוב הדוגמה 123, תל אביב',
    },
    tags: ['מנוסה', 'מהימן'],
  };

  const drawerContent = (
    <>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${colors.neutral[200]}` }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                borderRadius: borderRadius.lg,
                bgcolor: colors.pastel.orange,
                fontSize: '20px',
                fontWeight: 600,
              }}
            >
              {data?.fullName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {data?.fullName}
              </Typography>
              <Chip
                label={data?.isActive ? 'פעיל' : 'לא פעיל'}
                color={data?.isActive ? 'success' : 'default'}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
        {isLoading ? (
          <QuickPreviewSkeleton />
        ) : (
          <Stack spacing={3}>
            {/* Contact Info */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
                פרטים אישיים
              </Typography>
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.neutral[50],
                    border: `1px solid ${colors.neutral[200]}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <PhoneIcon sx={{ color: colors.pastel.blue, fontSize: 20 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      טלפון
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {data?.phone}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.neutral[50],
                    border: `1px solid ${colors.neutral[200]}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <BadgeIcon sx={{ color: colors.pastel.purple, fontSize: 20 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      ת.ז.
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {data?.idNumber}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>

            {/* Site Info */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
                אתר עבודה
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.pastel.greenLight,
                  border: `1px solid ${colors.pastel.green}40`,
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <LocationOnIcon sx={{ color: colors.pastel.green, fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    {data?.site.name}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {data?.site.address}
                </Typography>
              </Box>
            </Box>

            {/* Tags */}
            {data?.tags && data.tags.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
                  תגיות
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {data.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{
                        backgroundColor: colors.pastel.blueLight,
                        color: colors.pastel.blue,
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Stack>
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 3,
          borderTop: `1px solid ${colors.neutral[200]}`,
          mt: 'auto',
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          startIcon={<EditIcon />}
          sx={{ borderRadius: borderRadius.lg }}
        >
          ערוך עובד
        </Button>
      </Box>
    </>
  );

  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        sx={{
          '& .MuiDrawer-paper': {
            borderRadius: '20px 20px 0 0',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.neutral[300],
              margin: '0 auto',
            }}
          />
        </Box>
        {drawerContent}
      </SwipeableDrawer>
    );
  }

  return (
    <Drawer
      anchor={isRTL ? 'left' : 'right'}
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 400 },
          borderRadius: isRTL ? '0 20px 20px 0' : '20px 0 0 20px',
          boxShadow: shadows.large,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
