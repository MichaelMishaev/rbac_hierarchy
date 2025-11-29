'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { lightTheme, darkTheme } from './theme';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check theme preference
    const theme = localStorage.getItem('theme');
    setIsDark(theme === 'dark');
  }, []);

  if (!mounted) {
    // Prevent flash of unstyled content
    return null;
  }

  return (
    <NextThemesProvider attribute="class" defaultTheme="light">
      <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </NextThemesProvider>
  );
}
