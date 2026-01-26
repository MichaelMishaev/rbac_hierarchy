'use client';

/**
 * Virtualized Table Component
 *
 * 🚀 PERFORMANCE: Uses TanStack Virtual to render only visible rows.
 * This reduces DOM nodes from 500+ to ~20, drastically improving:
 * - Initial render time
 * - Scroll performance
 * - Memory usage
 *
 * Usage:
 *   <VirtualizedTableBody
 *     rows={filteredData}
 *     estimateRowHeight={60}
 *     containerHeight={400}
 *     renderRow={(row, index, style) => (
 *       <TableRow style={style}>...</TableRow>
 *     )}
 *   />
 *
 * @module components/ui/VirtualizedTable
 */

import { useRef, useCallback, memo, CSSProperties } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TableBody, TableRow, Box } from '@mui/material';

// Type definitions
type VirtualizedTableBodyProps<T> = {
  /** Array of data rows to render */
  rows: T[];
  /** Estimated height of each row in pixels (for scroll calculations) */
  estimateRowHeight?: number;
  /** Maximum height of the scrollable container */
  containerHeight?: number;
  /** Custom overscan count (rows to render outside viewport) */
  overscan?: number;
  /** Render function for each row */
  renderRow: (
    row: T,
    index: number,
    virtualRow: { index: number; size: number; start: number }
  ) => React.ReactNode;
  /** Minimum rows before enabling virtualization (default: 50) */
  virtualizationThreshold?: number;
};

/**
 * Virtualized Table Body - Only renders visible rows
 *
 * For tables with fewer than `virtualizationThreshold` rows,
 * it falls back to standard rendering for simplicity.
 */
export function VirtualizedTableBody<T>({
  rows,
  estimateRowHeight = 60,
  containerHeight = 600,
  overscan = 5,
  renderRow,
  virtualizationThreshold = 50,
}: VirtualizedTableBodyProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
  });

  // For small datasets, use standard rendering
  if (rows.length < virtualizationThreshold) {
    return (
      <TableBody>
        {rows.map((row, index) =>
          renderRow(row, index, { index, size: estimateRowHeight, start: index * estimateRowHeight })
        )}
      </TableBody>
    );
  }

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <Box
      ref={parentRef}
      sx={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      {/* Spacer for total scroll height */}
      <Box
        sx={{
          height: totalSize,
          width: '100%',
          position: 'relative',
        }}
      >
        <TableBody
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${virtualRows[0]?.start ?? 0}px)`,
          }}
        >
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            if (!row) return null;
            return renderRow(row, virtualRow.index, virtualRow);
          })}
        </TableBody>
      </Box>
    </Box>
  );
}

// Memoized row wrapper for optimal performance
export const MemoizedTableRow = memo(
  function MemoizedTableRow({
    children,
    onClick,
    style,
    'data-testid': testId,
    hover = true,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    style?: CSSProperties;
    'data-testid'?: string;
    hover?: boolean;
  }) {
    return (
      <TableRow
        onClick={onClick}
        style={style}
        data-testid={testId}
        hover={hover}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        {children}
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for performance
    return (
      prevProps.children === nextProps.children &&
      prevProps.onClick === nextProps.onClick &&
      prevProps['data-testid'] === nextProps['data-testid']
    );
  }
);

// Hook for virtualized scrolling in custom implementations
export function useVirtualizedRows<T>(
  rows: T[],
  containerRef: React.RefObject<HTMLDivElement>,
  options?: {
    estimateRowHeight?: number;
    overscan?: number;
  }
) {
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => options?.estimateRowHeight ?? 60,
    overscan: options?.overscan ?? 5,
  });

  return {
    virtualizer,
    virtualRows: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
    scrollToIndex: virtualizer.scrollToIndex,
  };
}

export default VirtualizedTableBody;
