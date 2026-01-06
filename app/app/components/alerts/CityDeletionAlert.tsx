'use client';

import React from 'react';
import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import { useRouter } from 'next/navigation';
import { colors, borderRadius, shadows } from '@/lib/design-system';

interface CityDeletionAlertProps {
  cityId: string;
  cityName: string;
  neighborhoodCount: number;
  neighborhoods: Array<{ id: string; name: string; code: string }>;
  onClose: () => void;
}

export default function CityDeletionAlert({
  cityId,
  cityName,
  neighborhoodCount,
  neighborhoods,
  onClose,
}: CityDeletionAlertProps) {
  const router = useRouter();

  const handleViewNeighborhoods = () => {
    router.push(`/neighborhoods?city=${cityId}`);
  };

  return (
    <Alert
      severity="warning"
      dir="rtl"
      lang="he"
      onClose={onClose}
      icon={<WarningAmberRoundedIcon fontSize="large" />}
      data-testid="city-deletion-alert"
      sx={{
        borderRadius: { xs: '16px', sm: '20px' },
        backgroundColor: '#FFF4E6', // Soft amber background
        border: '2px solid #FFB84D', // Monday.com amber
        boxShadow: '0 4px 12px rgba(255, 184, 77, 0.15)',
        padding: { xs: '16px', sm: '20px 24px' },
        maxWidth: '100%',
        '& .MuiAlert-icon': {
          color: '#F59E0B',
          fontSize: { xs: '24px', sm: '28px' },
          marginInlineEnd: { xs: '12px', sm: '16px' },
        },
        '& .MuiAlert-message': {
          width: '100%',
          padding: 0,
        },
        '& .MuiAlert-action': {
          paddingInlineStart: { xs: '8px', sm: '16px' },
          alignItems: 'flex-start',
          paddingTop: '4px',
        },
      }}
    >
      <AlertTitle
        sx={{
          fontSize: { xs: '16px', sm: '18px' },
          fontWeight: 600,
          color: '#92400E',
          marginBottom: { xs: '8px', sm: '12px' },
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          lineHeight: 1.4,
        }}
      >
        לא ניתן למחוק את העיר &quot;{cityName}&quot;
      </AlertTitle>

      <Typography
        sx={{
          fontSize: { xs: '14px', sm: '15px' },
          color: '#78350F',
          lineHeight: 1.6,
          marginBottom: { xs: '12px', sm: '16px' },
        }}
      >
        עיר זו מכילה{' '}
        <Box
          component="span"
          sx={{
            fontWeight: 700,
            backgroundColor: '#FED7AA',
            padding: '2px 8px',
            borderRadius: '6px',
          }}
        >
          {neighborhoodCount === 1
            ? 'שכונה אחת פעילה'
            : `${neighborhoodCount} שכונות פעילות`}
        </Box>
        . כדי למחוק את העיר, יש תחילה:
      </Typography>

      <Box
        component="ul"
        sx={{
          margin: 0,
          paddingInlineStart: { xs: '20px', sm: '24px' },
          marginBottom: { xs: '12px', sm: '16px' },
          '& li': {
            fontSize: { xs: '14px', sm: '15px' },
            color: '#78350F',
            lineHeight: 1.8,
            marginBottom: '4px',
          },
        }}
      >
        <li>להעביר את {neighborhoodCount === 1 ? 'השכונה' : 'השכונות'} לעיר אחרת, או</li>
        <li>למחוק את {neighborhoodCount === 1 ? 'השכונה' : 'השכונות'}</li>
      </Box>

      {/* Neighborhoods List */}
      <Box
        sx={{
          backgroundColor: '#FED7AA',
          borderRadius: '10px',
          padding: { xs: '12px', sm: '16px' },
          marginBottom: { xs: '16px', sm: '20px' },
          maxHeight: { xs: '150px', sm: '200px' },
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#FFEDD5',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#F59E0B',
            borderRadius: '3px',
            '&:hover': {
              background: '#D97706',
            },
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontWeight: 700,
            color: '#92400E',
            marginBottom: '8px',
            fontSize: { xs: '12px', sm: '13px' },
          }}
        >
          {neighborhoodCount === 1 ? 'שכונה פעילה:' : `${neighborhoodCount} שכונות פעילות:`}
        </Typography>
        <Box component="ul" sx={{ margin: 0, paddingInlineStart: '20px', listStyleType: 'disc' }}>
          {neighborhoods.map((neighborhood) => (
            <Box
              component="li"
              key={neighborhood.id}
              sx={{
                fontSize: { xs: '13px', sm: '14px' },
                color: '#78350F',
                fontWeight: 600,
                marginBottom: '6px',
                lineHeight: 1.6,
              }}
            >
              {neighborhood.name}
              <Box
                component="span"
                sx={{
                  marginInlineStart: '6px',
                  fontSize: { xs: '11px', sm: '12px' },
                  color: '#92400E',
                  fontFamily: 'monospace',
                  opacity: 0.8,
                }}
              >
                ({neighborhood.code})
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: '10px', sm: '12px' },
          width: '100%',
        }}
      >
        <Button
          variant="contained"
          onClick={handleViewNeighborhoods}
          data-testid="view-neighborhoods-button"
          sx={{
            backgroundColor: '#F59E0B',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: { xs: '13px', sm: '14px' },
            padding: { xs: '12px 20px', sm: '10px 20px' },
            borderRadius: '12px',
            textTransform: 'none',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flex: { xs: '1', sm: '0 1 auto' },
            minHeight: '44px',
            '&:hover': {
              backgroundColor: '#D97706',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
            transition: 'all 200ms ease-out',
          }}
        >
          <HomeWorkIcon sx={{ fontSize: { xs: '18px', sm: '20px' } }} />
          <Box component="span">
            צפה {neighborhoodCount === 1 ? 'בשכונה' : `בשכונות (${neighborhoodCount})`}
          </Box>
        </Button>

        <Button
          variant="outlined"
          onClick={onClose}
          data-testid="dismiss-alert-button"
          sx={{
            color: '#92400E',
            borderColor: '#FFB84D',
            fontWeight: 600,
            fontSize: { xs: '13px', sm: '14px' },
            padding: { xs: '12px 20px', sm: '10px 20px' },
            borderRadius: '12px',
            textTransform: 'none',
            flex: { xs: '1', sm: '0 1 auto' },
            minHeight: '44px',
            '&:hover': {
              borderColor: '#F59E0B',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
            },
            transition: 'all 200ms ease-out',
          }}
        >
          הבנתי
        </Button>
      </Box>
    </Alert>
  );
}
