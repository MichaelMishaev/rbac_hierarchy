'use client';

import { Box, Typography } from '@mui/material';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConstructionIcon from '@mui/icons-material/Construction';
import RtlButton from '@/app/components/ui/RtlButton';

// SVG Construction Illustration Component
const ConstructionIllustration = () => (
  <svg
    width="320"
    height="240"
    viewBox="0 0 320 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Background elements */}
    <circle cx="160" cy="120" r="100" fill={colors.pastel.orangeLight} opacity="0.5" />
    <circle cx="160" cy="120" r="70" fill={colors.pastel.yellowLight} opacity="0.6" />
    
    {/* Construction crane base */}
    <rect x="80" y="160" width="160" height="12" rx="2" fill={colors.status.orange} />
    <rect x="155" y="60" width="10" height="100" fill={colors.status.yellow} />
    
    {/* Crane arm */}
    <rect x="100" y="55" width="120" height="8" rx="2" fill={colors.status.orange} />
    
    {/* Crane hook */}
    <line x1="130" y1="63" x2="130" y2="100" stroke={colors.neutral[600]} strokeWidth="2" />
    <path d="M120 100 Q130 115 140 100" stroke={colors.neutral[600]} strokeWidth="3" fill="none" />
    
    {/* Construction blocks */}
    <rect x="95" y="140" width="30" height="20" rx="2" fill={colors.pastel.blue} />
    <rect x="130" y="140" width="30" height="20" rx="2" fill={colors.pastel.purple} />
    <rect x="165" y="140" width="30" height="20" rx="2" fill={colors.pastel.green} />
    
    {/* Stacked blocks */}
    <rect x="110" y="120" width="30" height="20" rx="2" fill={colors.pastel.pink} />
    <rect x="145" y="120" width="30" height="20" rx="2" fill={colors.status.orange} opacity="0.7" />
    
    {/* Top block */}
    <rect x="127" y="100" width="30" height="20" rx="2" fill={colors.pastel.yellow} />
    
    {/* Construction cone */}
    <path d="M230 160 L245 120 L260 160 Z" fill={colors.status.orange} />
    <rect x="228" y="155" width="34" height="8" rx="2" fill={colors.status.orange} />
    <rect x="236" y="130" width="18" height="4" fill="white" opacity="0.8" />
    <rect x="234" y="140" width="22" height="4" fill="white" opacity="0.8" />
    
    {/* Gear icon */}
    <circle cx="60" cy="100" r="20" fill={colors.neutral[200]} />
    <circle cx="60" cy="100" r="10" fill={colors.neutral[300]} />
    <rect x="55" y="75" width="10" height="10" rx="2" fill={colors.neutral[200]} />
    <rect x="55" y="115" width="10" height="10" rx="2" fill={colors.neutral[200]} />
    <rect x="35" y="95" width="10" height="10" rx="2" fill={colors.neutral[200]} />
    <rect x="75" y="95" width="10" height="10" rx="2" fill={colors.neutral[200]} />
    
    {/* Small decorative elements */}
    <circle cx="280" cy="80" r="5" fill={colors.pastel.blue} opacity="0.6" />
    <circle cx="40" cy="150" r="4" fill={colors.pastel.purple} opacity="0.6" />
    <circle cx="270" cy="140" r="3" fill={colors.pastel.green} opacity="0.6" />
    
    {/* Animated dots (static representation) */}
    <circle cx="200" cy="70" r="3" fill={colors.primary.main} opacity="0.4" />
    <circle cx="210" cy="75" r="2" fill={colors.primary.main} opacity="0.3" />
    <circle cx="195" cy="80" r="2.5" fill={colors.primary.main} opacity="0.35" />
  </svg>
);

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.pastel.blueLight} 50%, ${colors.pastel.orangeLight} 100%)`,
        p: 3,
      }}
    >
      <Box
        sx={{
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
          p: { xs: 4, md: 6 },
          backgroundColor: colors.neutral[0],
          borderRadius: borderRadius['2xl'],
          boxShadow: shadows.xl,
          border: `1px solid ${colors.neutral[200]}`,
        }}
      >
        {/* Illustration */}
        <Box sx={{ mb: 4 }}>
          <ConstructionIllustration />
        </Box>

        {/* Construction Icon Badge */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: borderRadius.full,
            background: colors.gradients.primary,
            mb: 3,
            boxShadow: shadows.glowBlue,
          }}
        >
          <ConstructionIcon sx={{ fontSize: 32, color: colors.neutral[0] }} />
        </Box>

        {/* Title */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: colors.neutral[900],
            mb: 2,
            fontSize: { xs: '1.75rem', md: '2.25rem' },
          }}
        >
          🚧 Under Construction
        </Typography>

        {/* Hebrew subtitle */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: colors.status.orange,
            mb: 3,
            fontSize: { xs: '1.25rem', md: '1.5rem' },
          }}
        >
          בבנייה
        </Typography>

        {/* Description */}
        <Typography
          sx={{
            color: colors.neutral[500],
            mb: 4,
            fontSize: '1rem',
            lineHeight: 1.7,
            maxWidth: 400,
            mx: 'auto',
          }}
        >
          We&apos;re working hard to bring you this feature. 
          Check back soon for updates!
          <br />
          <span style={{ direction: 'rtl', display: 'block', marginTop: '8px' }}>
            אנחנו עובדים קשה כדי להביא לכם את התכונה הזו.
            חזרו בקרוב!
          </span>
        </Typography>

        {/* Progress indicator */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mb: 4,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 8,
              borderRadius: borderRadius.full,
              background: colors.neutral[200],
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: '60%',
                height: '100%',
                borderRadius: borderRadius.full,
                background: colors.gradients.primary,
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.6 },
                },
              }}
            />
          </Box>
          <Typography
            sx={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: colors.primary.main,
            }}
          >
            60%
          </Typography>
        </Box>

        {/* Back button */}
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <RtlButton
            variant="contained"
            startIcon={<ArrowBackIcon />}
            sx={{
              background: colors.gradients.primary,
              color: colors.neutral[0],
              px: 4,
              py: 1.5,
              borderRadius: borderRadius.lg,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              boxShadow: shadows.medium,
              '&:hover': {
                background: colors.primary.dark,
                boxShadow: shadows.glowBlue,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Back to Dashboard / חזרה ללוח בקרה
          </RtlButton>
        </Link>
      </Box>
    </Box>
  );
}

















