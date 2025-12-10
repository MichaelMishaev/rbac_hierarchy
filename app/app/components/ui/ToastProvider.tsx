'use client';

import { Toaster } from 'react-hot-toast';
import { colors } from '@/lib/design-system';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: colors.neutral[0],
          color: colors.neutral[900],
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontFamily: 'Figtree, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          direction: 'rtl',
          textAlign: 'right',
          maxWidth: '500px'
        },
        success: {
          duration: 3000,
          style: {
            background: colors.pastel.greenLight,
            color: colors.status.green,
            border: `2px solid ${colors.status.green}`
          },
        },
        error: {
          duration: 5000,
          style: {
            background: colors.pastel.redLight,
            color: colors.error,
            border: `2px solid ${colors.error}`
          },
        },
      }}
    />
  );
}
