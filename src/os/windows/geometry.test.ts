import { describe, expect, it } from 'vitest';
import {
  cascadeRect,
  clampRect,
  DEFAULT_MIN_SIZE,
  KEEP_VISIBLE,
  TITLE_BAR_HEIGHT,
  zoomedRect,
} from './geometry';

const desktop = { w: 1000, h: 600 };

describe('clampRect', () => {
  it('leaves a legal rect alone', () => {
    const rect = { x: 100, y: 50, w: 400, h: 300 };
    expect(clampRect(rect, desktop)).toEqual(rect);
  });

  it('enforces the minimum size', () => {
    const rect = clampRect({ x: 0, y: 0, w: 10, h: 10 }, desktop);
    expect(rect.w).toBe(DEFAULT_MIN_SIZE.w);
    expect(rect.h).toBe(DEFAULT_MIN_SIZE.h);
  });

  it('never lets a window grow past the desktop', () => {
    const rect = clampRect({ x: 0, y: 0, w: 5000, h: 5000 }, desktop);
    expect(rect.w).toBe(desktop.w);
    expect(rect.h).toBe(desktop.h);
  });

  it('keeps part of the title bar reachable on every side', () => {
    const size = { w: 400, h: 300 };
    expect(clampRect({ x: -9999, y: 0, ...size }, desktop).x).toBe(
      KEEP_VISIBLE - size.w,
    );
    expect(clampRect({ x: 9999, y: 0, ...size }, desktop).x).toBe(
      desktop.w - KEEP_VISIBLE,
    );
    expect(clampRect({ x: 0, y: -9999, ...size }, desktop).y).toBe(0);
    expect(clampRect({ x: 0, y: 9999, ...size }, desktop).y).toBe(
      desktop.h - TITLE_BAR_HEIGHT,
    );
  });

  it('only enforces the minimum size before the desktop is measured', () => {
    expect(
      clampRect({ x: -500, y: 900, w: 10, h: 400 }, { w: 0, h: 0 }),
    ).toEqual({ x: -500, y: 900, w: DEFAULT_MIN_SIZE.w, h: 400 });
  });
});

describe('cascadeRect', () => {
  const size = { w: 420, h: 300 };

  it('steps each new window down and right, then wraps', () => {
    const first = cascadeRect(0, size, desktop);
    const second = cascadeRect(1, size, desktop);
    expect(second.x - first.x).toBe(20);
    expect(second.y - first.y).toBe(20);
    expect(cascadeRect(8, size, desktop)).toEqual(first);
  });

  it('shrinks windows to fit a phone-sized desktop', () => {
    const phone = { w: 375, h: 500 };
    const rect = cascadeRect(3, size, phone);
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.w).toBeLessThanOrEqual(phone.w);
    expect(rect.y + rect.h).toBeLessThanOrEqual(phone.h);
  });
});

describe('zoomedRect', () => {
  it('fills the desktop', () => {
    expect(zoomedRect(desktop)).toEqual({ x: 2, y: 2, w: 995, h: 595 });
  });
});
