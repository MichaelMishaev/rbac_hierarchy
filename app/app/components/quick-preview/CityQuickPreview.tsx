'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Box,
  Drawer,
  Typography,
  Avatar,
  IconButton,
  Stack,
  Grid,
  useMediaQuery,
  useTheme,
  SwipeableDrawer,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import MailIcon from '@mui/icons-material/Mail';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import GroupIcon from '@mui/icons-material/Group';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import QuickPreviewSkeleton from './QuickPreviewSkeleton';
import StatChip from './StatChip';
import ListPreviewModal from './ListPreviewModal';
import RtlButton from '@/app/components/ui/RtlButton';

type CityQuickPreviewProps = {
  corporationId: string;
  open: boolean;
  onClose: () => void;
};

export default function CityQuickPreview({
  corporationId,
  open,
  onClose,
}: CityQuickPreviewProps) {
  const router = useRouter();
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isRTL = locale === 'he';

  // List preview modal state
  const [listPreview, setListPreview] = useState<{
    type: 'neighborhoods' | 'activists' | 'managers' | 'activistCoordinators' | null;
    title: string;
  }>({ type: null, title: '' });

  // TODO: Replace with actual API call
  const [isLoading, setIsLoading] = useState(false);
  const data = {
    id: corporationId,
    name: 'תאגיד דוגמה',
    code: 'CORP001',
    logo: null,
    email: 'contact@example.com',
    phone: '050-1234567',
    address: 'רחוב הדוגמה 123, תל אביב',
    _count: {
      coordinators: 5,
      activistCoordinators: 12,
      neighborhoods: 8,
      activists: 145,
    },
    // Mock data for lists
    managers: [
      { id: '1', name: 'יוסי כהן', subtitle: 'מנהל ראשי', isActive: true },
      { id: '2', name: 'שרה לוי', subtitle: 'מנהלת משנה', isActive: true },
    ],
    activistCoordinators: [
      { id: '1', name: 'דוד משה', subtitle: 'אתר ראשון', isActive: true },
      { id: '2', name: 'רחל אברהם', subtitle: 'אתר שני', isActive: true },
    ],
    neighborhoods: [
      { id: '1', name: 'אתר ראשון', subtitle: 'תל אביב', isActive: true },
      { id: '2', name: 'אתר שני', subtitle: 'ירושלים', isActive: true },
    ],
    activists: [
      { id: '1', name: 'מיכאל דוד', subtitle: 'עובד כללי', isActive: true },
      { id: '2', name: 'יעל משה', subtitle: 'עובדת כללית', isActive: true },
    ],
  };

  const handleViewFull = () => {
    router.push(`/${locale}/cities/${corporationId}`);
    onClose();
  };

  const drawerContent = (
    <>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${colors.neutral[200]}` }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              src={data?.logo || undefined}
              sx={{ width: 48, height: 48, borderRadius: borderRadius.lg, bgcolor: colors.pastel.blue }}
            >
              {data?.name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {data?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {data?.code}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Content - Essential Info Only */}
      <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
        {isLoading ? (
          <QuickPreviewSkeleton />
        ) : (
          <Stack spacing={3}>
            {/* KPI Summary - Compact & Clickable */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <StatChip
                  icon={<PeopleIcon />}
                  label="מנהלים"
                  value={data?._count.coordinators || 0}
                  color="purple"
                  clickable={data?._count.coordinators > 0}
                  onClick={() => setListPreview({ type: 'managers', title: 'מנהלים' })}
                />
              </Grid>
              <Grid item xs={6}>
                <StatChip
                  icon={<SupervisorAccountIcon />}
                  label="מפקחים"
                  value={data?._count.activistCoordinators || 0}
                  color="blue"
                  clickable={data?._count.activistCoordinators > 0}
                  onClick={() => setListPreview({ type: 'activistCoordinators', title: 'מפקחים' })}
                />
              </Grid>
              <Grid item xs={6}>
                <StatChip
                  icon={<LocationOnIcon />}
                  label="אתרים"
                  value={data?._count.neighborhoods || 0}
                  color="green"
                  clickable={data?._count.neighborhoods > 0}
                  onClick={() => setListPreview({ type: 'neighborhoods', title: 'אתרים' })}
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

            {/* Contact Info */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
                פרטי יצירת קשר
              </Typography>
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.neutral[50],
                    border: `1px solid ${colors.neutral[200]}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    כתובת
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {data?.address}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.neutral[50],
                    border: `1px solid ${colors.neutral[200]}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    טלפון
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {data?.phone}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.neutral[50],
                    border: `1px solid ${colors.neutral[200]}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    דוא״ל
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {data?.email}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        )}
      </Box>

      {/* Footer - Quick Actions */}
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
          <Stack direction="row" spacing={2}>
            <RtlButton
              fullWidth
              variant="outlined"
              startIcon={<EditIcon />}
              sx={{ borderRadius: borderRadius.lg }}
            >
              ערוך
            </RtlButton>
            <RtlButton
              fullWidth
              variant="outlined"
              startIcon={<MailIcon />}
              sx={{ borderRadius: borderRadius.lg }}
            >
              הזמן מנהל
            </RtlButton>
          </Stack>
        </Stack>
      </Box>
    </>
  );

  const getListItems = () => {
    if (!listPreview.type) return [];
    switch (listPreview.type) {
      case 'managers':
        return data.managers || [];
      case 'activistCoordinators':
        return data.activistCoordinators || [];
      case 'neighborhoods':
        return data.neighborhoods || [];
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
          {/* Mobile: Bottom sheet with swipe handle */}
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
          type={listPreview.type || 'neighborhoods'}
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
        type={listPreview.type || 'neighborhoods'}
        onItemClick={(id) => {
          // TODO: Open entity quick preview
          console.log('Clicked item:', id);
        }}
      />
    </>
  );
}
