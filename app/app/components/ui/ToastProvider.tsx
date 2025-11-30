'use client';

import { Toaster } from 'react-hot-toast';
import { colors, borderRadius, shadows } from '@/lib/design-system';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default options
        duration: 3000,
        style: {
          background: colors.neutral[900],
          color: colors.neutral[0],
          borderRadius: borderRadius.xl,
          padding: '16px 20px',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: shadows.xl,
          maxWidth: '500px',
        },

        // Success
        success: {
          duration: 3000,
          iconTheme: {
            primary: colors.success,
            secondary: colors.neutral[0],
          },
          style: {
            background: colors.neutral[900],
          },
        },

        // Error
        error: {
          duration: 4000,
          iconTheme: {
            primary: colors.error,
            secondary: colors.neutral[0],
          },
          style: {
            background: colors.neutral[900],
          },
        },

        // Loading
        loading: {
          iconTheme: {
            primary: colors.primary.main,
            secondary: colors.neutral[0],
          },
        },
      }}
    />
  );
}
