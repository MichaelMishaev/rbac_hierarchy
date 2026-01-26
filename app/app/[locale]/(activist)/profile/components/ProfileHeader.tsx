'use client';

// 🚀 PERFORMANCE: Dynamic import of framer-motion saves ~350KB from initial bundle
import { MotionDiv } from '@/app/components/ui/DynamicMotion';
import { Box, Avatar, Typography, Chip } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { colors, borderRadius } from '@/lib/design-system';

interface ProfileHeaderProps {
  user: {
    fullName: string;
    avatarUrl: string | null;
    neighborhood: string;
    city: string;
  };
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  // Generate initials from full name
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(97, 97, 255, 0.08)',
        padding: { xs: 2, md: 3 },
        marginX: -2,
        marginTop: -2,
        borderRadius: `0 0 ${borderRadius['2xl']} ${borderRadius['2xl']}`,
      }}
      dir="rtl"
      lang="he"
    >
      <Box display="flex" alignItems="center" gap={2}>
        <MotionDiv
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <Avatar
            src={user.avatarUrl || ''}
            alt={`תמונת פרופיל של ${user.fullName}`}
            sx={{
              width: { xs: 80, md: 120 },
              height: { xs: 80, md: 120 },
              border: `4px solid ${colors.primary.main}`,
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 700,
              bgcolor: colors.primary.light,
              color: colors.neutral[0],
            }}
          >
            {!user.avatarUrl && getInitials(user.fullName)}
          </Avatar>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, x: -20 }} // RTL: from right
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{ flex: 1 }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              color: colors.neutral[900],
              mb: 0.5,
              fontSize: { xs: '1.5rem', md: '2rem' },
            }}
          >
            שלום, {user.fullName}
          </Typography>

          <Chip
            icon={<LocationOnIcon />}
            label={`${user.neighborhood}, ${user.city}`}
            size="small"
            sx={{
              background: colors.pastel.blueLight,
              color: colors.primary.main,
              fontWeight: 600,
              border: `1px solid ${colors.primary.light}`,
              '& .MuiChip-icon': {
                color: colors.primary.main,
              },
            }}
          />
        </MotionDiv>
      </Box>
    </Box>
  );
}
