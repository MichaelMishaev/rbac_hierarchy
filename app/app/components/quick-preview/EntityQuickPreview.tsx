'use client';

import CorporationQuickPreview from './CorporationQuickPreview';
import SiteQuickPreview from './SiteQuickPreview';
import WorkerQuickPreview from './WorkerQuickPreview';

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
      return <CorporationQuickPreview corporationId={id} open={open} onClose={onClose} />;
    case 'sites':
      return <SiteQuickPreview siteId={id} open={open} onClose={onClose} />;
    case 'workers':
      return <WorkerQuickPreview workerId={id} open={open} onClose={onClose} />;
    case 'managers':
      // TODO: Create ManagerQuickPreview component
      return <CorporationQuickPreview corporationId={id} open={open} onClose={onClose} />;
    case 'supervisors':
      // TODO: Create SupervisorQuickPreview component
      return <SiteQuickPreview siteId={id} open={open} onClose={onClose} />;
    default:
      return null;
  }
}
