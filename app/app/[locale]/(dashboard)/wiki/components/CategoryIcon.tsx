'use client';

// 🚀 PERFORMANCE: Only import icons we actually use instead of entire library
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SecurityIcon from '@mui/icons-material/Security';
import ConstructionIcon from '@mui/icons-material/Construction';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import BarChartIcon from '@mui/icons-material/BarChart';
import HelpIcon from '@mui/icons-material/Help';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import { SxProps } from '@mui/material';

// Icon mapping - add new icons here as needed
const ICON_MAP: Record<string, React.ComponentType<{ sx?: SxProps }>> = {
  WavingHand: WavingHandIcon,
  Security: SecurityIcon,
  Construction: ConstructionIcon,
  People: PeopleIcon,
  Assignment: AssignmentIcon,
  HowToVote: HowToVoteIcon,
  BarChart: BarChartIcon,
  Help: HelpIcon,
  MenuBook: MenuBookIcon,
};

export function CategoryIcon({ iconName, sx }: { iconName: string | null; sx?: SxProps }) {
  const IconComponent = ICON_MAP[iconName || 'MenuBook'] || MenuBookIcon;
  return <IconComponent sx={sx} />;
}
