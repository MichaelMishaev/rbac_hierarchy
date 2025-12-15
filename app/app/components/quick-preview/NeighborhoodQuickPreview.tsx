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
  Stack,
  Grid,
  Chip,
  useMediaQuery,
  useTheme,
  SwipeableDrawer,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import GroupIcon from '@mui/icons-material/Group';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import QuickPreviewSkeleton from './QuickPreviewSkeleton';
import StatChip from './StatChip';
import ListPreviewModal from './ListPreviewModal';
import RtlButton from '@/app/components/ui/RtlButton';

type NeighborhoodQuickPreviewProps = {
  siteId: string;
  open: boolean;
  onClose: () => void;
};

export default function NeighborhoodQuickPreview({
  siteId,
  open,
  onClose,
}: NeighborhoodQuickPreviewProps) {
  const router = useRouter();
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isRTL = locale === 'he';

  // List preview modal state
  const [listPreview, setListPreview] = useState<{
    type: 'activistCoordinators' | 'activists' | null;
    title: string;
  }>({ type: null, title: '' });

  // TODO: Replace with actual API call
  const [isLoading, setIsLoading] = useState(false);
  const data = {
    id: siteId,
    name: 'אתר ראשון',
    address: 'רחוב הדוגמה 123, תל אביב',
    isActive: true,
    _count: {
      activistCoordinators: 3,
      activists: 45,
    },
    // Mock data for lists
    activistCoordinators: [
      { id: '1', name: 'דוד משה', subtitle: 'רכז שכונתי בכיר', isActive: true },
      { id: '2', name: 'רחל אברהם', subtitle: 'רכזת שכונתית משנה', isActive: true },
      { id: '3', name: 'יוסי כהן', subtitle: 'רכז שכונתי', isActive: true },
    ],
    activists: [
      { id: '1', name: 'מיכאל דוד', subtitle: '050-1234567', isActive: true },
      { id: '2', name: 'יעל משה', subtitle: '050-2345678', isActive: true },
      { id: '3', name: 'שרה לוי', subtitle: '050-3456789', isActive: true },
    ],
  };

  const handleViewFull = () => {
    router.push(`/${locale}/neighborhoods/${siteId}`);
    onClose();
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
                bgcolor: colors.pastel.green,
              }}
            >
              <LocationOnIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {data?.name}
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
            {/* KPIs - Clickable */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <StatChip
                  icon={<SupervisorAccountIcon />}
                  label="רכזי שכונות"
                  value={data?._count.activistCoordinators || 0}
                  color="blue"
                  clickable={data?._count.activistCoordinators > 0}
                  onClick={() => setListPreview({ type: 'activistCoordinators', title: 'רכזי שכונות' })}
                />
              </Grid>
              <Grid item xs={6}>
                <StatChip
                  icon={<GroupIcon />}
                  label="עובדים"
                  value={data?._count.activists || 0}
                  color="orange"
                  clickable={data?._count.activists > 0}
                  onClick={() => setListPreview({ type: 'activists', title: 'עובדים' })}
                />
              </Grid>
            </Grid>

            {/* Location */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
                מיקום
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.neutral[50],
                  border: `1px solid ${colors.neutral[200]}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <LocationOnIcon sx={{ color: colors.pastel.green }} />
                <Typography variant="body2">{data?.address}</Typography>
              </Box>
            </Box>
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
        <Stack spacing={2}>
          <RtlButton
            fullWidth
            variant="contained"
            startIcon={<VisibilityIcon />}
            onClick={handleViewFull}
            sx={{
              borderRadius: borderRadius.lg,
              background: colors.gradients.primary,
            }}
          >
            צפה במלואו
          </RtlButton>
          <RtlButton
            fullWidth
            variant="outlined"
            startIcon={<EditIcon />}
            sx={{ borderRadius: borderRadius.lg }}
          >
            ערוך אתר
          </RtlButton>
        </Stack>
      </Box>
    </>
  );

  const getListItems = () => {
    if (!listPreview.type) return [];
    switch (listPreview.type) {
      case 'activistCoordinators':
        return data.activistCoordinators || [];
      case 'activists':
        return data.activists || [];
      default:
        return [];
    }
  };

  if (isMobile) {
    return (
      <>
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

        {/* List Preview Modal */}
        <ListPreviewModal
          open={!!listPreview.type}
          onClose={() => setListPreview({ type: null, title: '' })}
          title={listPreview.title}
          items={getListItems()}
          type={listPreview.type || 'activists'}
          onItemClick={(id) => {
            // TODO: Open entity quick preview
            console.log('Clicked item:', id);
          }}
        />
      </>
    );
  }

  return (
    <>
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

      {/* List Preview Modal */}
      <ListPreviewModal
        open={!!listPreview.type}
        onClose={() => setListPreview({ type: null, title: '' })}
        title={listPreview.title}
        items={getListItems()}
        type={listPreview.type || 'activists'}
        onItemClick={(id) => {
          // TODO: Open entity quick preview
          console.log('Clicked item:', id);
        }}
      />
    </>
  );
}
