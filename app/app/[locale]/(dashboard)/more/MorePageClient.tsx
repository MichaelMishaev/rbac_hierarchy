'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Collapse,
  IconButton,
  Chip,
} from '@mui/material';
import { colors, borderRadius } from '@/lib/design-system';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RuleIcon from '@mui/icons-material/Rule';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { LogoutButton } from '@/app/components/LogoutButton';

type MorePageClientProps = {
  role: string;
  userEmail?: string;
};

type MenuSection = {
  id: string;
  label: string;
  color: string;
  items: MenuItem[];
};

type MenuItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
  secondary?: string;
  roleCheck?: (role: string) => boolean;
};

export default function MorePageClient({ role, userEmail }: MorePageClientProps) {
  // Section colors matching NavigationV3
  const sectionColors = {
    personal: '#2196F3', // Blue
    management: '#9C27B0', // Purple
    system: '#757575', // Gray
  };

  // ✅ UX Best Practice: Personal section expanded by default (most used)
  // Load from localStorage if available (remembers user preference)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mobile-menu-state');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Fallback to default if parsing fails
        }
      }
    }
    // Default state: Personal always open, others closed
    return {
      personal: true,  // ✅ Most used - always open by default
      management: false,
      system: false,
    };
  });

  // Save state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobile-menu-state', JSON.stringify(expandedSections));
    }
  }, [expandedSections]);

  const handleSectionToggle = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Define menu sections
  const sections: MenuSection[] = [
    {
      id: 'personal',
      label: 'אישי',
      color: sectionColors.personal,
      items: [
        {
          path: '/profile',
          label: 'הפרופיל שלי',
          icon: <PersonIcon />,
          secondary: userEmail,
        },
        {
          path: '/notifications',
          label: 'התראות',
          icon: <NotificationsIcon sx={{ color: colors.status.orange }} />,
        },
        {
          path: '/settings',
          label: 'הגדרות',
          icon: <SettingsIcon sx={{ color: colors.neutral[600] }} />,
        },
      ],
    },
    {
      id: 'management',
      label: 'ניהול',
      color: sectionColors.management,
      items: [
        {
          path: '/users',
          label: 'משתמשים',
          icon: <PeopleIcon />,
          roleCheck: (r) => r !== 'ACTIVIST_COORDINATOR' && r !== 'ACTIVIST',
        },
        {
          path: '/cities',
          label: 'ערים',
          icon: <LocationCityIcon sx={{ color: colors.status.blue }} />,
          roleCheck: (r) => r === 'AREA_MANAGER' || r === 'SUPERADMIN',
        },
        {
          path: '/neighborhoods',
          label: 'שכונות',
          icon: <BusinessIcon sx={{ color: colors.status.purple }} />,
          roleCheck: (r) => r !== 'ACTIVIST',
        },
      ],
    },
    {
      id: 'system',
      label: 'מערכת',
      color: sectionColors.system,
      items: [
        {
          path: '/system-rules',
          label: 'כללי מערכת',
          icon: <RuleIcon sx={{ color: colors.status.blue }} />,
          roleCheck: (r) => r === 'SUPERADMIN',
        },
        {
          path: '/wiki',
          label: 'מערכת ויקי',
          icon: <MenuBookIcon />,
          secondary: 'מדריך מנהל על',
          roleCheck: (r) => r === 'SUPERADMIN',
        },
      ],
    },
  ];

  return (
    <Box sx={{ p: 2, direction: 'rtl', pb: 10 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: colors.neutral[700] }}>
        עוד אפשרויות
      </Typography>

      <Paper sx={{ borderRadius: '16px', overflow: 'hidden' }}>
        {sections.map((section, sectionIndex) => {
          // Filter items based on role
          const visibleItems = section.items.filter((item) =>
            item.roleCheck ? item.roleCheck(role) : true
          );

          // Hide entire section if no visible items
          if (visibleItems.length === 0) return null;

          const itemCount = visibleItems.length;
          const isExpanded = expandedSections[section.id];

          return (
            <Box key={section.id}>
              {/* Section Header with Item Count Badge */}
              <Box
                onClick={() => handleSectionToggle(section.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  borderRadius: 0,
                  direction: 'rtl',
                  transition: 'all 0.2s ease',
                  borderRight: `4px solid ${section.color}`,
                  backgroundColor: `${section.color}08`,
                  '&:hover': {
                    backgroundColor: `${section.color}12`,
                  },
                  '&:active': {
                    backgroundColor: `${section.color}15`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {/* ✅ UX Best Practice: Clear expand/collapse icon on LEFT (RTL) */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: isExpanded ? `${section.color}30` : 'transparent',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ExpandMoreIcon
                      fontSize="small"
                      sx={{
                        color: isExpanded ? section.color : colors.neutral[400],
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        fontSize: '20px',
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: section.color,
                      textAlign: 'right',
                    }}
                  >
                    {section.label}
                  </Typography>
                  {/* ✅ UX Best Practice: Show item count for clarity */}
                  <Chip
                    label={itemCount}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: `${section.color}20`,
                      color: section.color,
                      '& .MuiChip-label': {
                        px: 1,
                      },
                    }}
                  />
                </Box>
                {/* State indicator text */}
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '11px',
                    color: colors.neutral[500],
                    fontWeight: 600,
                  }}
                >
                  {isExpanded ? 'הסתר' : 'הצג'}
                </Typography>
              </Box>

              {/* Section Items with subtle animation */}
              <Collapse
                in={isExpanded}
                timeout={{
                  enter: 300,
                  exit: 200,
                }}
                easing={{
                  enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  exit: 'cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <List sx={{ p: 0 }}>
                  {visibleItems.map((item, itemIndex) => (
                    <Box key={item.path}>
                      <ListItem disablePadding>
                        <ListItemButton
                          href={item.path}
                          sx={{
                            py: 1.5,
                            px: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: colors.neutral[50],
                              transform: 'translateX(-2px)',
                            },
                            '&:active': {
                              transform: 'translateX(0)',
                              backgroundColor: colors.neutral[100],
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 40,
                              color: colors.primary.main,
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            secondary={item.secondary}
                            primaryTypographyProps={{
                              fontWeight: 600,
                              fontSize: '14px',
                            }}
                            secondaryTypographyProps={{
                              fontSize: '12px',
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                      {itemIndex < visibleItems.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </Collapse>

              {/* Divider between sections */}
              {sectionIndex < sections.length - 1 && <Divider sx={{ my: 0 }} />}
            </Box>
          );
        })}

        {/* Logout - Always visible at bottom */}
        <Divider sx={{ borderWidth: 2, borderColor: colors.neutral[200] }} />
        <LogoutButton />
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
