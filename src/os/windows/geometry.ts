// Pure window geometry. Coordinates are relative to the desktop area (below the menu bar).

export interface Size {
  w: number;
  h: number;
}

export interface Rect extends Size {
  x: number;
  y: number;
}

/** Title bar height including borders: what stays visible of a collapsed window. */
export const TITLE_BAR_HEIGHT = 21;
/** How much of a title bar must stay on screen horizontally so it can be grabbed. */
export const KEEP_VISIBLE = 48;
export const DEFAULT_SIZE: Size = { w: 420, h: 300 };
export const DEFAULT_MIN_SIZE: Size = { w: 176, h: 112 };

const CASCADE_START = 12;
const CASCADE_STEP = 20;
const CASCADE_SLOTS = 8;
const EDGE = 4;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/** Keep a window at a legal size and its title bar reachable. Unmeasured bounds (0) only
 *  enforce the minimum size. */
export function clampRect(
  rect: Rect,
  bounds: Size,
  min: Size = DEFAULT_MIN_SIZE,
): Rect {
  const measured = bounds.w > 0 && bounds.h > 0;
  const w = Math.round(
    measured ? clamp(rect.w, min.w, bounds.w) : Math.max(rect.w, min.w),
  );
  const h = Math.round(
    measured ? clamp(rect.h, min.h, bounds.h) : Math.max(rect.h, min.h),
  );
  if (!measured) return { x: Math.round(rect.x), y: Math.round(rect.y), w, h };
  return {
    x: Math.round(clamp(rect.x, KEEP_VISIBLE - w, bounds.w - KEEP_VISIBLE)),
    y: Math.round(clamp(rect.y, 0, bounds.h - TITLE_BAR_HEIGHT)),
    w,
    h,
  };
}

/** Where the nth new window opens: a diagonal cascade that wraps, shrunk to fit small screens. */
export function cascadeRect(
  n: number,
  size: Size,
  bounds: Size,
  min: Size = DEFAULT_MIN_SIZE,
): Rect {
  const offset = CASCADE_START + (n % CASCADE_SLOTS) * CASCADE_STEP;
  if (bounds.w <= 0 || bounds.h <= 0) {
    return clampRect({ x: offset, y: offset, ...size }, bounds, min);
  }
  const w = Math.min(size.w, bounds.w - EDGE * 2);
  const h = Math.min(size.h, bounds.h - EDGE * 2);
  return clampRect(
    {
      x: Math.min(offset, Math.max(EDGE, bounds.w - w - EDGE)),
      y: Math.min(offset, Math.max(EDGE, bounds.h - h - EDGE)),
      w,
      h,
    },
    bounds,
    min,
  );
}

/** A zoomed window fills the desktop, leaving room for its 1px shadow. */
export function zoomedRect(bounds: Size): Rect {
  return {
    x: 2,
    y: 2,
    w: Math.max(0, bounds.w - 5),
    h: Math.max(0, bounds.h - 5),
  };
}
