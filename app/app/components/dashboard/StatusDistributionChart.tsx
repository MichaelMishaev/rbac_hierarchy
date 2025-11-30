'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { colors, borderRadius, shadows } from '@/lib/design-system';

interface DistributionData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // Allow additional properties for recharts
}

interface StatusDistributionChartProps {
  data: DistributionData[];
  title?: string;
  type?: 'pie' | 'donut';
}

export default function StatusDistributionChart({
  data,
  title,
  type = 'donut',
}: StatusDistributionChartProps) {
  const theme = useTheme();

  // Don't render labels on the chart - they overlap
  // We'll show percentages in the legend instead

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
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
          <Typography variant="body2" sx={{ fontWeight: 600, color: data.payload.color }}>
            {data.name}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.neutral[700], fontSize: '13px' }}>
            <strong>{data.value}</strong> פריטים
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Calculate total and percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Custom legend with percentages - positioned BELOW the chart
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          mt: 3,
          direction: 'rtl',
          px: 1,
        }}
      >
        {payload.map((entry: any, index: number) => {
          const percent = total > 0 ? ((data[index].value / total) * 100).toFixed(0) : 0;
          return (
            <Box
              key={`item-${index}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                p: 1.5,
                borderRadius: borderRadius.md,
                background: colors.neutral[50],
                border: `1px solid ${colors.neutral[200]}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '6px',
                    backgroundColor: entry.color,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500, color: colors.neutral[700] }}>
                  {entry.value}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ fontSize: '18px', fontWeight: 700, color: colors.neutral[900] }}>
                  {data[index].value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.neutral[600],
                    minWidth: '45px',
                    textAlign: 'left',
                  }}
                >
                  ({percent}%)
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Box data-testid="status-distribution-chart">
      <Box>
        {/* Chart - clean without text overlays */}
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}  // No labels on chart to prevent overlap
              outerRadius={85}
              innerRadius={type === 'donut' ? 50 : 0}
              fill="#8884d8"
              dataKey="value"
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend below chart with values and percentages */}
        {renderLegend({ payload: data.map(item => ({ value: item.name, color: item.color })) })}
      </Box>
    </Box>
  );
}
