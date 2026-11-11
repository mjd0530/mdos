import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isPoint, sanitizeRecord, storage } from './persist';

export interface Point {
  x: number;
  y: number;
}

interface DesktopState {
  /** Icons the visitor has dragged; everything else uses the default arrangement. */
  positions: Record<string, Point>;
  selectedId: string | null;
  select: (id: string | null) => void;
  place: (id: string, point: Point) => void;
  /** Special → Clean Up Desktop: back to the default arrangement. */
  cleanUp: () => void;
}

export const useDesktop = create<DesktopState>()(
  persist(
    (set) => ({
      positions: {},
      selectedId: null,
      select: (selectedId) => set({ selectedId }),
      place: (id, point) =>
        set((state) => ({ positions: { ...state.positions, [id]: point } })),
      cleanUp: () => set({ positions: {} }),
    }),
    {
      name: 'mikeos:desktop',
      version: 1,
      storage,
      // Only where icons sit is remembered; selection starts fresh each visit.
      partialize: (state) => ({ positions: state.positions }),
      merge: (saved, current) => ({
        ...current,
        positions: sanitizeRecord(
          (saved as { positions?: unknown } | undefined)?.positions,
          isPoint,
        ),
      }),
    },
  ),
);

export const ICON_CELL = { w: 88, h: 72 };
const MARGIN = { top: 12, right: 12, bottom: 8 };

/** System 7 arrangement: a column down the right edge, wrapping to the left. */
export function defaultPosition(
  index: number,
  bounds: { w: number; h: number },
): Point {
  const perColumn = Math.max(
    1,
    Math.floor((bounds.h - MARGIN.top - MARGIN.bottom) / ICON_CELL.h),
  );
  const column = Math.floor(index / perColumn);
  const row = index % perColumn;
  return {
    x: Math.max(0, bounds.w - MARGIN.right - ICON_CELL.w * (column + 1)),
    y: MARGIN.top + row * ICON_CELL.h,
  };
}

/** Keep a saved icon position on screen if the window is now smaller. */
export function clampPosition(point: Point, bounds: { w: number; h: number }) {
  if (bounds.w <= 0 || bounds.h <= 0) return point;
  return {
    x: Math.min(Math.max(0, point.x), Math.max(0, bounds.w - ICON_CELL.w)),
    y: Math.min(Math.max(0, point.y), Math.max(0, bounds.h - ICON_CELL.h)),
  };
}
