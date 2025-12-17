'use client';

import { ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { colors } from '@/lib/design-system';
import { signOut } from 'next-auth/react';

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <ListItem disablePadding>
      <ListItemButton onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon sx={{ color: colors.error }} />
        </ListItemIcon>
        <ListItemText primary="התנתק" />
      </ListItemButton>
    </ListItem>
  );
}
