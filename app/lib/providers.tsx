'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { lightTheme, darkTheme } from './theme';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Hydration guard: Prevent rendering until client is mounted
  // This fixes React error #418 caused by next-themes adding classes to <html>
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Check theme preference after mount
    const theme = localStorage.getItem('theme');
    setIsDark(theme === 'dark');
  }, [mounted]);

  // During SSR and initial hydration, render with default light theme
  // This ensures server and client render identical HTML
  const currentTheme = mounted ? (isDark ? darkTheme : lightTheme) : lightTheme;

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </NextThemesProvider>
  );
}
