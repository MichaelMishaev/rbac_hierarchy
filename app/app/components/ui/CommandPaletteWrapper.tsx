'use client';

import dynamic from 'next/dynamic';

/**
 * Client-side wrapper for CommandPalette
 * Required because Server Components can't use `ssr: false` with dynamic()
 *
 * Note: Using .then(mod => mod.default) to ensure proper module resolution
 */
const CommandPalette = dynamic(
  () => import('@/app/components/ui/CommandPalette').then(mod => mod.default),
  { ssr: false }
);

export default function CommandPaletteWrapper() {
  return <CommandPalette />;
}
