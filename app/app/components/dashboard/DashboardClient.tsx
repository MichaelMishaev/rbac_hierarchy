'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Grid } from '@mui/material';
import KPICard from './KPICard';
import EntityQuickPreview from '../quick-preview/EntityQuickPreview';

type KPICardData = {
  title: string;
  value: number | string;
  subtitle?: string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red';
  icon: React.ReactNode;
  href?: string;
  entityType?: 'corporations' | 'sites' | 'workers' | 'managers' | 'supervisors';
  entityId?: string;
};

type DashboardClientProps = {
  cards: KPICardData[];
};

type QuickPreviewState = {
  type: 'corporations' | 'sites' | 'workers' | 'managers' | 'supervisors' | null;
  id: string | null;
};

export default function DashboardClient({ cards }: DashboardClientProps) {
  const router = useRouter();
  const [quickPreview, setQuickPreview] = useState<QuickPreviewState>({
    type: null,
    id: null,
  });

  const handleCardClick = (card: KPICardData) => {
    // If entityType and entityId are provided, show quick preview
    if (card.entityType && card.entityId) {
      setQuickPreview({
        type: card.entityType,
        id: card.entityId,
      });
    }
    // Otherwise, navigate to the href
    else if (card.href) {
      router.push(card.href);
    }
  };

  const handleClosePreview = () => {
    setQuickPreview({ type: null, id: null });
  };

  return (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <KPICard
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              color={card.color}
              icon={card.icon}
              onClick={() => handleCardClick(card)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Quick Preview Drawer */}
      <EntityQuickPreview
        type={quickPreview.type}
        id={quickPreview.id}
        open={!!quickPreview.type && !!quickPreview.id}
        onClose={handleClosePreview}
      />
    </>
  );
}
