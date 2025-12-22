'use client';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HistoryIcon from '@mui/icons-material/History';
import MenuBookIcon from '@mui/icons-material/MenuBook';

export function WikiTrendingIcon({ sx }: { sx?: any }) {
  return <TrendingUpIcon sx={sx} />;
}

export function WikiRecentIcon({ sx }: { sx?: any }) {
  return <HistoryIcon sx={sx} />;
}

export function WikiEmptyIcon({ sx }: { sx?: any }) {
  return <MenuBookIcon sx={sx} />;
}
