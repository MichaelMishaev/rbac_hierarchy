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
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'indigo';
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
      <Grid
        container
        spacing={3} // Optimal spacing for modern dashboard (24px gap)
        sx={{ mb: 3 }}
        data-testid="dashboard-kpi-cards"
      >
        {cards.map((card, index) => (
          <Grid
            item
            xs={12}      // Mobile: 1 card per row (full width) - Field activists
            sm={6}       // Tablet portrait: 2 cards per row - Campaign managers
            md={6}       // Tablet landscape: 2 cards per row - Better balance
            lg={4}       // Desktop: 3 cards per row - OPTIMAL (Monday.com pattern)
            xl={4}       // Large desktop: 3 cards per row - CONSISTENT (no shift)
            // Research: 3 cards = ~380px each (optimal width for Hebrew RTL + numbers)
            // 4+ cards = cramped, poor UX. 2 cards = wasted space on wide screens.
            key={index}
          >
            <KPICard
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              color={card.color}
              icon={card.icon}
              onClick={() => handleCardClick(card)}
              data-testid={`kpi-card-${index}`}
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
