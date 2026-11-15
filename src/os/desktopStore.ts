import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { desktop } from '../vfs';
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
  /** Desktop items in the Trash, oldest first (D-036). Nothing is ever deleted. */
  trashed: string[];
  trash: (id: string) => void;
  /** Take an item out of the Trash: back to its old spot, or to `at` if dropped there. */
  putAway: (id: string, at?: Point) => void;
  /** Reset Desktop: everything out of the Trash. */
  restoreAll: () => void;
}

/** The id of the Trash icon on the desktop (not a content node). */
export const TRASH_ID = 'trash';

/** Saved Trash contents: known desktop items only, each once. */
export function sanitizeTrashed(
  value: unknown,
  validIds: ReadonlySet<string>,
): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (id): id is string => typeof id === 'string' && validIds.has(id),
      ),
    ),
  ];
}

const DESKTOP_IDS = new Set(desktop.children.map((node) => node.id));

export const useDesktop = create<DesktopState>()(
  persist(
    (set) => ({
      positions: {},
      selectedId: null,
      select: (selectedId) => set({ selectedId }),
      place: (id, point) =>
        set((state) => ({ positions: { ...state.positions, [id]: point } })),
      cleanUp: () => set({ positions: {} }),
      trashed: [],
      trash: (id) =>
        set((state) =>
          id === TRASH_ID || state.trashed.includes(id)
            ? {}
            : {
                trashed: [...state.trashed, id],
                selectedId: state.selectedId === id ? null : state.selectedId,
              },
        ),
      putAway: (id, at) =>
        set((state) => ({
          trashed: state.trashed.filter((t) => t !== id),
          positions: at ? { ...state.positions, [id]: at } : state.positions,
        })),
      restoreAll: () => set({ trashed: [] }),
    }),
    {
      name: 'mikeos:desktop',
      version: 2,
      storage,
      // v1 had no Trash; merge below reads either shape.
      migrate: (saved) => saved,
      // Where icons sit and what's in the Trash are remembered; selection starts fresh.
      partialize: (state) => ({
        positions: state.positions,
        trashed: state.trashed,
      }),
      merge: (saved, current) => {
        const s = saved as
          { positions?: unknown; trashed?: unknown } | undefined;
        return {
          ...current,
          positions: sanitizeRecord(s?.positions, isPoint),
          trashed: sanitizeTrashed(s?.trashed, DESKTOP_IDS),
        };
      },
    },
  ),
);

export const ICON_CELL = { w: 88, h: 72 };
const MARGIN = { top: 12, right: 12, bottom: 8 };

const perColumn = (bounds: { w: number; h: number }) =>
  Math.max(
    1,
    Math.floor((bounds.h - MARGIN.top - MARGIN.bottom) / ICON_CELL.h),
  );

const slot = (
  column: number,
  row: number,
  bounds: { w: number; h: number },
) => ({
  x: Math.max(0, bounds.w - MARGIN.right - ICON_CELL.w * (column + 1)),
  y: MARGIN.top + row * ICON_CELL.h,
});

/**
 * System 7 arrangement: a column down the right edge, wrapping to the left. The bottom of
 * the first column is kept for the Trash.
 */
export function defaultPosition(
  index: number,
  bounds: { w: number; h: number },
): Point {
  const rows = perColumn(bounds);
  const n = index >= rows - 1 ? index + 1 : index;
  return slot(Math.floor(n / rows), n % rows, bounds);
}

/** System 7 kept the Trash in the bottom-right corner. */
export function trashPosition(bounds: { w: number; h: number }): Point {
  const rows = perColumn(bounds);
  return slot(0, rows - 1, bounds);
}

/** Keep a saved icon position on screen if the window is now smaller. */
export function clampPosition(point: Point, bounds: { w: number; h: number }) {
  if (bounds.w <= 0 || bounds.h <= 0) return point;
  return {
    x: Math.min(Math.max(0, point.x), Math.max(0, bounds.w - ICON_CELL.w)),
    y: Math.min(Math.max(0, point.y), Math.max(0, bounds.h - ICON_CELL.h)),
  };
}
