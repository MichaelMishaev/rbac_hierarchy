'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Box, Paper } from '@mui/material';
import {
  HomeIcon,
  UsersIcon,
  MapPinIcon,
  ClipboardListIcon,
  UserPlusIcon,
  PlusCircleIcon,
  SearchIcon
} from 'lucide-react';
import { colors, borderRadius } from '@/lib/design-system';

interface CommandItem {
  id: string;
  label: string;
  keywords: string[];
  icon: React.ComponentType<any>;
  action: () => void;
  section: string;
}

/**
 * Command Palette (Cmd+K)
 *
 * Quick actions and navigation for power users
 * Inspired by VS Code, Linear, Notion
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Toggle with Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      label: 'לוח בקרה',
      keywords: ['dashboard', 'home', 'לוח', 'בקרה'],
      icon: HomeIcon,
      action: () => router.push('/dashboard'),
      section: 'ניווט'
    },
    {
      id: 'nav-activists',
      label: 'פעילים',
      keywords: ['activists', 'workers', 'פעילים'],
      icon: UsersIcon,
      action: () => router.push('/activists'),
      section: 'ניווט'
    },
    {
      id: 'nav-neighborhoods',
      label: 'שכונות',
      keywords: ['neighborhoods', 'sites', 'שכונות'],
      icon: MapPinIcon,
      action: () => router.push('/neighborhoods'),
      section: 'ניווט'
    },
    {
      id: 'nav-tasks',
      label: 'משימות',
      keywords: ['tasks', 'משימות'],
      icon: ClipboardListIcon,
      action: () => router.push('/tasks'),
      section: 'ניווט'
    },
    {
      id: 'nav-map',
      label: 'מפה',
      keywords: ['map', 'מפה'],
      icon: MapPinIcon,
      action: () => router.push('/map'),
      section: 'ניווט'
    },

    // Actions
    {
      id: 'action-new-task',
      label: 'משימה חדשה',
      keywords: ['new task', 'create task', 'משימה', 'חדש'],
      icon: PlusCircleIcon,
      action: () => {
        // TODO: Open new task modal
        console.log('Open new task modal');
      },
      section: 'פעולות'
    },
    {
      id: 'action-new-activist',
      label: 'פעיל חדש',
      keywords: ['new activist', 'add activist', 'פעיל', 'חדש'],
      icon: UserPlusIcon,
      action: () => {
        // TODO: Open new activist modal
        console.log('Open new activist modal');
      },
      section: 'פעולות'
    },
  ];

  const handleSelect = useCallback((commandId: string) => {
    const command = commands.find((c) => c.id === commandId);
    if (command) {
      command.action();
      setOpen(false);
      setSearch('');
    }
  }, [commands, router]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <Box
        onClick={() => setOpen(false)}
        sx={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Command Palette */}
      <Box
        sx={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '640px',
          zIndex: 9999,
        }}
      >
        <Paper
          elevation={24}
          sx={{
            borderRadius: borderRadius['2xl'],
            overflow: 'hidden',
            backgroundColor: colors.neutral[0],
          }}
        >
          <Command
            label="Command Menu"
            shouldFilter={true}
            value={search}
            onValueChange={setSearch}
          >
            {/* Search Input */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 3,
                py: 2,
                borderBottom: `1px solid ${colors.neutral[200]}`,
              }}
            >
              <SearchIcon size={20} color={colors.neutral[400]} />
              <Command.Input
                placeholder="חיפוש פקודות..."
                style={{
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '16px',
                  fontFamily: 'Figtree, sans-serif',
                  width: '100%',
                  direction: 'rtl',
                  textAlign: 'right',
                }}
              />
              <Box
                component="kbd"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.neutral[100],
                  color: colors.neutral[600],
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                ESC
              </Box>
            </Box>

            {/* Command List */}
            <Command.List
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '8px',
              }}
            >
              <Command.Empty
                style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: colors.neutral[500],
                  fontSize: '14px',
                }}
              >
                לא נמצאו תוצאות
              </Command.Empty>

              {/* Group by section */}
              {['ניווט', 'פעולות'].map((section) => {
                const sectionCommands = commands.filter((c) => c.section === section);
                if (sectionCommands.length === 0) return null;

                return (
                  <Command.Group
                    key={section}
                    heading={section}
                    style={{
                      marginBottom: '8px',
                    }}
                  >
                    {sectionCommands.map((command) => {
                      const Icon = command.icon;
                      return (
                        <Command.Item
                          key={command.id}
                          value={command.id}
                          keywords={command.keywords}
                          onSelect={handleSelect}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: borderRadius.lg,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            direction: 'rtl',
                          }}
                          data-selected-style={{
                            backgroundColor: colors.pastel.blueLight,
                          }}
                        >
                          <Icon size={18} color={colors.neutral[600]} />
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 500,
                              color: colors.neutral[900],
                            }}
                          >
                            {command.label}
                          </span>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                );
              })}
            </Command.List>
          </Command>
        </Paper>
      </Box>
    </>
  );
}
