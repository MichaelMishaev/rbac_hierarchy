'use client';

import { useState } from 'react';
import { Box, Tabs, Tab, Paper, Typography } from '@mui/material';
import { colors, borderRadius } from '@/lib/design-system';
import TodayIcon from '@mui/icons-material/Today';
import HistoryIcon from '@mui/icons-material/History';
import TodayAttendance from '@/app/components/attendance/TodayAttendance';
import AttendanceHistory from '@/app/components/attendance/AttendanceHistory';

type AttendanceClientProps = {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isSuperAdmin: boolean;
  };
};

export default function AttendanceClient({ user }: AttendanceClientProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ direction: 'rtl' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: colors.neutral[900],
            mb: 1,
            textAlign: 'right',
          }}
        >
          נוכחות פעילים
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: colors.neutral[600],
            textAlign: 'right',
          }}
        >
          מעקב נוכחות יומי והיסטוריה
        </Typography>
      </Box>

      {/* Tabs Navigation */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.neutral[200]}`,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: `1px solid ${colors.neutral[200]}`,
            '& .MuiTabs-flexContainer': {
              justifyContent: 'flex-start',
              direction: 'rtl',
            },
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '15px',
              fontWeight: 600,
              textTransform: 'none',
              color: colors.neutral[600],
              '&.Mui-selected': {
                color: colors.primary.main,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: colors.primary.main,
              height: 3,
            },
          }}
        >
          <Tab
            icon={<TodayIcon />}
            iconPosition="start"
            label="נוכחות היום"
            sx={{
              flexDirection: 'row-reverse',
              gap: 1,
            }}
          />
          <Tab
            icon={<HistoryIcon />}
            iconPosition="start"
            label="היסטוריה"
            sx={{
              flexDirection: 'row-reverse',
              gap: 1,
            }}
          />
        </Tabs>

        {/* Tab Panels */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {activeTab === 0 && <TodayAttendance user={user} />}
          {activeTab === 1 && <AttendanceHistory user={user} />}
        </Box>
      </Paper>
    </Box>
  );
}
