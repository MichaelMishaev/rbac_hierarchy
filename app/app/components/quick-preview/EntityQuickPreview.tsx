'use client';

import CityQuickPreview from './CityQuickPreview';
import NeighborhoodQuickPreview from './NeighborhoodQuickPreview';
import ActivistQuickPreview from './ActivistQuickPreview';

type EntityQuickPreviewProps = {
  type: 'corporations' | 'sites' | 'workers' | 'managers' | 'supervisors' | null;
  id: string | null;
  open: boolean;
  onClose: () => void;
};

export default function EntityQuickPreview({
  type,
  id,
  open,
  onClose,
}: EntityQuickPreviewProps) {
  if (!open || !type || !id) return null;

  switch (type) {
    case 'corporations':
      return <CityQuickPreview corporationId={id} open={open} onClose={onClose} />;
    case 'sites':
      return <NeighborhoodQuickPreview siteId={id} open={open} onClose={onClose} />;
    case 'workers':
      return <ActivistQuickPreview workerId={id} open={open} onClose={onClose} />;
    case 'managers':
      // TODO: Create ManagerQuickPreview component
      return <CityQuickPreview corporationId={id} open={open} onClose={onClose} />;
    case 'supervisors':
      // TODO: Create SupervisorQuickPreview component
      return <NeighborhoodQuickPreview siteId={id} open={open} onClose={onClose} />;
    default:
      return null;
  }
}
