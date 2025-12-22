'use client';

import MenuBookIcon from '@mui/icons-material/MenuBook';
import * as Icons from '@mui/icons-material';

type CategoryIconProps = {
  iconName: string | null;
};

export function CategoryIcon({ iconName }: CategoryIconProps) {
  if (!iconName) return <MenuBookIcon />;

  const IconComponent = (Icons as any)[iconName];
  return IconComponent ? <IconComponent /> : <MenuBookIcon />;
}
