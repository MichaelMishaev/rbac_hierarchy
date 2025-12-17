/**
 * More Page - Mobile Navigation Overflow
 * Shows additional menu items that don't fit in bottom navigation
 */

import { Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Paper } from '@mui/material';
import { colors } from '@/lib/design-system';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpIcon from '@mui/icons-material/Help';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import BusinessIcon from '@mui/icons-material/Business';
import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/app/components/LogoutButton';

export default async function MorePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const role = session.user.role;

  return (
    <Box sx={{ p: 2, direction: 'rtl' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: colors.neutral[700] }}>
        עוד אפשרויות
      </Typography>

      <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        <List sx={{ p: 0 }}>
          {/* Profile */}
          <ListItem disablePadding>
            <ListItemButton href="/profile">
              <ListItemIcon>
                <PersonIcon sx={{ color: colors.primary.main }} />
              </ListItemIcon>
              <ListItemText
                primary="הפרופיל שלי"
                secondary={session.user.email}
              />
            </ListItemButton>
          </ListItem>

          <Divider />

          {/* Cities - Only for Area Managers and SuperAdmin */}
          {(role === 'AREA_MANAGER' || role === 'SUPERADMIN') && (
            <>
              <ListItem disablePadding>
                <ListItemButton href="/cities">
                  <ListItemIcon>
                    <LocationCityIcon sx={{ color: colors.status.blue }} />
                  </ListItemIcon>
                  <ListItemText primary="ערים" />
                </ListItemButton>
              </ListItem>
              <Divider />
            </>
          )}

          {/* Neighborhoods - All except activists */}
          {role !== 'ACTIVIST' && (
            <>
              <ListItem disablePadding>
                <ListItemButton href="/neighborhoods">
                  <ListItemIcon>
                    <BusinessIcon sx={{ color: colors.status.purple }} />
                  </ListItemIcon>
                  <ListItemText primary="שכונות" />
                </ListItemButton>
              </ListItem>
              <Divider />
            </>
          )}

          {/* Notifications */}
          <ListItem disablePadding>
            <ListItemButton href="/notifications">
              <ListItemIcon>
                <NotificationsIcon sx={{ color: colors.status.orange }} />
              </ListItemIcon>
              <ListItemText primary="התראות" />
            </ListItemButton>
          </ListItem>

          <Divider />

          {/* Settings */}
          <ListItem disablePadding>
            <ListItemButton href="/settings">
              <ListItemIcon>
                <SettingsIcon sx={{ color: colors.neutral[600] }} />
              </ListItemIcon>
              <ListItemText primary="הגדרות" />
            </ListItemButton>
          </ListItem>

          <Divider />

          {/* Help */}
          <ListItem disablePadding>
            <ListItemButton href="/help">
              <ListItemIcon>
                <HelpIcon sx={{ color: colors.status.green }} />
              </ListItemIcon>
              <ListItemText primary="עזרה ותמיכה" />
            </ListItemButton>
          </ListItem>

          <Divider />

          {/* Logout */}
          <LogoutButton />
        </List>
      </Paper>

      {/* Version info */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          מערכת ניהול קמפיין בחירות v2.0
        </Typography>
        <Typography variant="caption" color="text.secondary">
          © 2025 כל הזכויות שמורות
        </Typography>
      </Box>
    </Box>
  );
}
