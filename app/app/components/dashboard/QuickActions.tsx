'use client';

import { Box, Stack } from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RtlButton from '@/app/components/ui/RtlButton';

export type QuickActionsProps = {
  onCreateCorporation?: () => void;
  onInviteUser?: () => void;
  onViewReports?: () => void;
};

export default function QuickActions({
  onCreateCorporation,
  onInviteUser,
  onViewReports,
}: QuickActionsProps) {
  return (
    <Box
      sx={{
        p: 3,
        background: colors.neutral[0],
        borderRadius: borderRadius.xl,
        boxShadow: shadows.soft,
        border: `1px solid ${colors.neutral[200]}`,
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <RtlButton
          variant="contained"
          size="large"
          startIcon={<AddBusinessIcon />}
          onClick={onCreateCorporation}
          sx={{
            flex: 1,
            py: 1.5,
            background: colors.gradients.primary,
            boxShadow: shadows.soft,
            '&:hover': {
              boxShadow: shadows.glowBlue,
            },
          }}
        >
          New Corporation
        </RtlButton>

        <RtlButton
          variant="contained"
          size="large"
          startIcon={<PersonAddIcon />}
          onClick={onInviteUser}
          sx={{
            flex: 1,
            py: 1.5,
            background: `linear-gradient(135deg, ${colors.pastel.purple} 0%, ${colors.pastel.purpleLight} 100%)`,
            boxShadow: shadows.soft,
            '&:hover': {
              boxShadow: shadows.glowPurple,
            },
          }}
        >
          Invite User
        </RtlButton>

        <RtlButton
          variant="outlined"
          size="large"
          startIcon={<AssessmentIcon />}
          onClick={onViewReports}
          sx={{
            flex: 1,
            py: 1.5,
            borderWidth: 2,
            borderColor: colors.neutral[300],
            '&:hover': {
              borderWidth: 2,
              borderColor: colors.pastel.blue,
              backgroundColor: colors.pastel.blueLight,
            },
          }}
        >
          View Reports
        </RtlButton>
      </Stack>
    </Box>
  );
}
