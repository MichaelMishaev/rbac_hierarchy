'use client';

import { Box, Typography } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { colors, borderRadius, shadows } from '@/lib/design-system';

interface MonthlyData {
  month: string;
  corporations?: number;
  sites?: number;
  workers?: number;
  managers?: number;
  supervisors?: number;
}

interface MonthlyTrendsChartProps {
  data: MonthlyData[];
  title?: string;
  dataKeys: Array<{
    key: keyof MonthlyData;
    label: string;
    color: string;
  }>;
}

export default function MonthlyTrendsChart({ data, title: _title, dataKeys }: MonthlyTrendsChartProps) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            background: colors.neutral[0],
            p: 2,
            borderRadius: borderRadius.md,
            boxShadow: shadows.medium,
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: colors.neutral[800] }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color, fontSize: '13px' }}
            >
              {entry.name}: <strong>{entry.value}</strong>
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box data-testid="monthly-trends-chart">
      <Box>
        {/* Chart */}
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 50, bottom: 10 }}
          >
            <defs>
              {dataKeys.map((item, _index) => (
                <linearGradient key={item.key} id={`color${item.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={item.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={item.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[200]} />
            <XAxis
              dataKey="month"
              stroke={colors.neutral[600]}
              style={{ fontSize: '13px', fontWeight: 500 }}
              tick={{ fill: colors.neutral[700] }}
            />
            <YAxis
              stroke={colors.neutral[600]}
              style={{ fontSize: '13px', fontWeight: 500 }}
              tick={{ fill: colors.neutral[700] }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            {dataKeys.map((item) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.color}
                strokeWidth={2}
                fill={`url(#color${item.key})`}
                animationDuration={1000}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>

        {/* Custom Legend Below Chart */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 4,
            mt: 2,
            flexWrap: 'wrap',
          }}
        >
          {dataKeys.map((item) => (
            <Box
              key={item.key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '4px',
                  backgroundColor: item.color,
                }}
              />
              <Typography variant="body2" sx={{ fontSize: '14px', fontWeight: 500, color: colors.neutral[700] }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
