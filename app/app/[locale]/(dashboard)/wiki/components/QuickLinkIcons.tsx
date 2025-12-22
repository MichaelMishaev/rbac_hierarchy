'use client';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HistoryIcon from '@mui/icons-material/History';
import MenuBookIcon from '@mui/icons-material/MenuBook';

export function WikiTrendingIcon(props: any) {
  return <TrendingUpIcon {...props} />;
}

export function WikiRecentIcon(props: any) {
  return <HistoryIcon {...props} />;
}

export function WikiEmptyIcon(props: any) {
  return <MenuBookIcon {...props} />;
}
