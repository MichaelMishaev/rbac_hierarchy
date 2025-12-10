'use client';

import { useState, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { colors } from '@/lib/design-system';

/**
 * Dark Mode Toggle
 * 
 * Switches between light and dark themes
 * Respects system preference and persists user choice
 */
export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  // Load preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const isDark = savedMode ? savedMode === 'true' : prefersDark;
    setDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <Tooltip title={darkMode ? 'מצב בהיר' : 'מצב כהה'}>
      <IconButton
        onClick={toggleDarkMode}
        sx={{
          color: colors.neutral[600],
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'rotate(20deg)',
          }
        }}
      >
        {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
