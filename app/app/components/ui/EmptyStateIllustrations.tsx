'use client';

/**
 * Empty State Illustrations (2025 UX Standard)
 *
 * Beautiful SVG illustrations for empty states
 * Makes empty experiences delightful instead of frustrating
 */

import { colors } from '@/lib/design-system';

export function NoActivists() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Person with megaphone illustration */}
      <circle cx="100" cy="70" r="30" fill={colors.pastel.blueLight} />
      <circle cx="100" cy="70" r="20" fill={colors.pastel.blue} opacity="0.3" />
      {/* Head */}
      <circle cx="100" cy="65" r="15" fill={colors.primary.main} />
      {/* Body */}
      <rect x="90" y="80" width="20" height="35" rx="10" fill={colors.primary.light} />
      {/* Megaphone */}
      <path
        d="M120 70 L140 60 L145 70 L140 80 Z"
        fill={colors.pastel.orange}
        stroke={colors.pastel.orange}
        strokeWidth="2"
      />
      {/* Sound waves */}
      <path d="M150 60 Q160 65 150 70" stroke={colors.pastel.orange} strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M155 55 Q170 65 155 75" stroke={colors.pastel.orange} strokeWidth="2" fill="none" opacity="0.4" />
      {/* Ground */}
      <ellipse cx="100" cy="150" rx="80" ry="10" fill={colors.neutral[200]} opacity="0.5" />
    </svg>
  );
}

export function NoTasks() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Clipboard with checkmarks */}
      <rect x="60" y="40" width="80" height="110" rx="8" fill={colors.neutral[0]} stroke={colors.neutral[300]} strokeWidth="3" />
      {/* Clip */}
      <rect x="85" y="30" width="30" height="15" rx="7" fill={colors.primary.main} />
      {/* Empty checkboxes */}
      <rect x="75" y="60" width="20" height="20" rx="4" fill={colors.pastel.blueLight} stroke={colors.primary.light} strokeWidth="2" />
      <rect x="75" y="90" width="20" height="20" rx="4" fill={colors.pastel.blueLight} stroke={colors.primary.light} strokeWidth="2" />
      <rect x="75" y="120" width="20" height="20" rx="4" fill={colors.pastel.blueLight} stroke={colors.primary.light} strokeWidth="2" />
      {/* Lines (task text) */}
      <line x1="105" y1="70" x2="120" y2="70" stroke={colors.neutral[300]} strokeWidth="3" strokeLinecap="round" />
      <line x1="105" y1="100" x2="115" y2="100" stroke={colors.neutral[300]} strokeWidth="3" strokeLinecap="round" />
      <line x1="105" y1="130" x2="125" y2="130" stroke={colors.neutral[300]} strokeWidth="3" strokeLinecap="round" />
      {/* Floating plus icon */}
      <circle cx="140" cy="140" r="20" fill={colors.success} opacity="0.9" />
      <path d="M140 130 L140 150 M130 140 L150 140" stroke="white" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function NoNeighborhoods() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Map pin illustration */}
      <circle cx="100" cy="80" r="60" fill={colors.pastel.purpleLight} opacity="0.3" />
      <path
        d="M100 40 C85 40 73 52 73 67 C73 87 100 120 100 120 C100 120 127 87 127 67 C127 52 115 40 100 40 Z"
        fill={colors.pastel.purple}
      />
      <circle cx="100" cy="67" r="15" fill={colors.neutral[0]} />
      {/* Houses */}
      <path d="M50 140 L50 160 L65 160 L65 140 L57.5 130 Z" fill={colors.neutral[300]} />
      <path d="M135 140 L135 160 L150 160 L150 140 L142.5 130 Z" fill={colors.neutral[300]} />
      {/* Ground */}
      <ellipse cx="100" cy="170" rx="90" ry="8" fill={colors.neutral[200]} opacity="0.5" />
    </svg>
  );
}

export function NoCities() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* City buildings silhouette */}
      <rect x="50" y="80" width="30" height="80" rx="4" fill={colors.neutral[300]} opacity="0.6" />
      <rect x="85" y="60" width="30" height="100" rx="4" fill={colors.neutral[400]} opacity="0.7" />
      <rect x="120" y="90" width="30" height="70" rx="4" fill={colors.neutral[300]} opacity="0.6" />
      {/* Windows */}
      <rect x="58" y="90" width="6" height="8" rx="1" fill={colors.pastel.blueLight} />
      <rect x="66" y="90" width="6" height="8" rx="1" fill={colors.pastel.blueLight} />
      <rect x="93" y="70" width="6" height="8" rx="1" fill={colors.pastel.blueLight} />
      <rect x="101" y="70" width="6" height="8" rx="1" fill={colors.pastel.blueLight} />
      {/* Sun */}
      <circle cx="150" cy="50" r="15" fill={colors.pastel.orange} opacity="0.8" />
      {/* Ground */}
      <rect x="30" y="160" width="140" height="10" rx="2" fill={colors.neutral[200]} />
    </svg>
  );
}

export function NoSearch() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Magnifying glass */}
      <circle cx="85" cy="85" r="40" fill="none" stroke={colors.primary.main} strokeWidth="6" />
      <line x1="115" y1="115" x2="145" y2="145" stroke={colors.primary.main} strokeWidth="6" strokeLinecap="round" />
      {/* Question mark inside */}
      <text x="75" y="100" fontSize="40" fontWeight="bold" fill={colors.primary.light}>?</text>
      {/* Sparkles */}
      <circle cx="140" cy="60" r="3" fill={colors.pastel.orange} />
      <circle cx="50" cy="130" r="4" fill={colors.pastel.purple} />
      <circle cx="150" cy="100" r="3" fill={colors.pastel.green} />
    </svg>
  );
}

export function NoData() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Empty folder */}
      <path
        d="M50 70 L50 150 C50 155 55 160 60 160 L140 160 C145 160 150 155 150 150 L150 80 C150 75 145 70 140 70 L110 70 L100 60 L60 60 C55 60 50 65 50 70 Z"
        fill={colors.neutral[200]}
        stroke={colors.neutral[400]}
        strokeWidth="3"
      />
      {/* Lines inside folder */}
      <line x1="70" y1="95" x2="130" y2="95" stroke={colors.neutral[300]} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="70" y1="110" x2="120" y2="110" stroke={colors.neutral[300]} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="70" y1="125" x2="125" y2="125" stroke={colors.neutral[300]} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

export function NoNotifications() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bell */}
      <path
        d="M100 50 C90 50 82 58 82 68 L82 95 C82 100 78 105 73 108 L73 115 L127 115 L127 108 C122 105 118 100 118 95 L118 68 C118 58 110 50 100 50 Z"
        fill={colors.neutral[300]}
      />
      {/* Bell clapper */}
      <ellipse cx="100" cy="120" rx="8" ry="10" fill={colors.neutral[400]} />
      {/* Slash (no notifications) */}
      <line x1="60" y1="50" x2="140" y2="130" stroke={colors.error} strokeWidth="6" strokeLinecap="round" />
      {/* Zzz */}
      <text x="130" y="60" fontSize="20" fontWeight="bold" fill={colors.neutral[400]}>Z</text>
      <text x="140" y="50" fontSize="16" fontWeight="bold" fill={colors.neutral[400]} opacity="0.7">z</text>
      <text x="148" y="42" fontSize="12" fontWeight="bold" fill={colors.neutral[400]} opacity="0.5">z</text>
    </svg>
  );
}

export function NoConnection() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Broken wifi symbol */}
      <path d="M100 140 C105 140 110 135 110 130 C110 125 105 120 100 120 C95 120 90 125 90 130 C90 135 95 140 100 140 Z" fill={colors.error} />
      <path d="M80 110 Q100 90 120 110" stroke={colors.error} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.3" />
      <path d="M65 90 Q100 60 135 90" stroke={colors.error} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.2" />
      {/* X mark */}
      <line x1="85" y1="75" x2="115" y2="95" stroke={colors.error} strokeWidth="5" strokeLinecap="round" />
      <line x1="115" y1="75" x2="85" y2="95" stroke={colors.error} strokeWidth="5" strokeLinecap="round" />
      {/* Cloud */}
      <ellipse cx="100" cy="160" rx="50" ry="15" fill={colors.neutral[200]} opacity="0.5" />
    </svg>
  );
}
