'use client';

import { useRouter } from 'next/navigation';
import { Grid } from '@mui/material';
import KPICard from './KPICard';

type KPICardData = {
  title: string;
  value: number | string;
  subtitle?: string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red';
  icon: React.ReactNode;
  href?: string;
};

type DashboardClientProps = {
  cards: KPICardData[];
};

export default function DashboardClient({ cards }: DashboardClientProps) {
  const router = useRouter();

  const handleCardClick = (href?: string) => {
    if (href) {
      router.push(href);
    }
  };

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <KPICard
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            color={card.color}
            icon={card.icon}
            onClick={card.href ? () => handleCardClick(card.href) : undefined}
          />
        </Grid>
      ))}
    </Grid>
  );
}
