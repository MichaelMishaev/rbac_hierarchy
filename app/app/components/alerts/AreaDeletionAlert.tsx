'use client';

import React from 'react';
import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import { useRouter } from 'next/navigation';
import { colors, borderRadius, shadows } from '@/lib/design-system';

interface AreaDeletionAlertProps {
  areaId: string;
  areaName: string;
  cityCount: number;
  onClose: () => void;
}

export default function AreaDeletionAlert({
  areaId,
  areaName,
  cityCount,
  onClose,
}: AreaDeletionAlertProps) {
  const router = useRouter();

  const handleViewCities = () => {
    router.push(`/cities?area=${areaId}`);
  };

  return (
    <Alert
      severity="warning"
      dir="rtl"
      lang="he"
      onClose={onClose}
      icon={<WarningAmberRoundedIcon fontSize="large" />}
      data-testid="area-deletion-alert"
      sx={{
        borderRadius: '20px',
        backgroundColor: '#FFF4E6', // Soft amber background
        border: '2px solid #FFB84D', // Monday.com amber
        boxShadow: '0 4px 12px rgba(255, 184, 77, 0.15)',
        padding: '20px 24px',
        '& .MuiAlert-icon': {
          color: '#F59E0B',
          fontSize: '28px',
          marginInlineEnd: '16px',
        },
        '& .MuiAlert-message': {
          width: '100%',
          padding: 0,
        },
        '& .MuiAlert-action': {
          paddingInlineStart: '16px',
        },
      }}
    >
      <AlertTitle
        sx={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#92400E',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        לא ניתן למחוק את המחוז &quot;{areaName}&quot;
      </AlertTitle>

      <Typography
        sx={{
          fontSize: '15px',
          color: '#78350F',
          lineHeight: 1.6,
          marginBottom: '16px',
        }}
      >
        מחוז זה מכיל{' '}
        <Box
          component="span"
          sx={{
            fontWeight: 700,
            backgroundColor: '#FED7AA',
            padding: '2px 8px',
            borderRadius: '6px',
          }}
        >
          {cityCount === 1 ? 'עיר אחת פעילה' : `${cityCount} ערים פעילות`}
        </Box>
        . כדי למחוק את המחוז, יש תחילה:
      </Typography>

      <Box
        component="ul"
        sx={{
          margin: 0,
          paddingInlineStart: '24px',
          marginBottom: '20px',
          '& li': {
            fontSize: '15px',
            color: '#78350F',
            lineHeight: 1.8,
            marginBottom: '4px',
          },
        }}
      >
        <li>להעביר את {cityCount === 1 ? 'העיר' : 'הערים'} למחוז אחר, או</li>
        <li>למחוק את {cityCount === 1 ? 'העיר' : 'הערים'}</li>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant="contained"
          onClick={handleViewCities}
          startIcon={<LocationCityIcon />}
          data-testid="view-cities-button"
          sx={{
            backgroundColor: '#F59E0B',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '14px',
            padding: '10px 20px',
            borderRadius: '12px',
            textTransform: 'none',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
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
          צפה {cityCount === 1 ? 'בעיר' : `בערים (${cityCount})`}
        </Button>

        <Button
          variant="outlined"
          onClick={onClose}
          data-testid="dismiss-alert-button"
          sx={{
            color: '#92400E',
            borderColor: '#FFB84D',
            fontWeight: 600,
            fontSize: '14px',
            padding: '10px 20px',
            borderRadius: '12px',
            textTransform: 'none',
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
