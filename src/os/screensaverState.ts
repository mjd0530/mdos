import { useEffect } from 'react';
import { create } from 'zustand';
import { useDeviceMode } from './device';
import { useSettings } from './settings';

export const ACTIVITY = [
  'pointerdown',
  'keydown',
  'wheel',
  'touchstart',
] as const;

interface ScreensaverState {
  active: boolean;
  start: () => void;
  stop: () => void;
}

/** Whether the screensaver is showing. Started by idleness or Special → Start Screensaver. */
export const useScreensaver = create<ScreensaverState>((set) => ({
  active: false,
  start: () => set({ active: true }),
  stop: () => set({ active: false }),
}));

export interface Sprite {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Advance a sprite by `dt` seconds, bouncing off the edges of a w×h area. */
export function step(
  sprite: Sprite,
  dt: number,
  size: number,
  w: number,
  h: number,
): Sprite {
  let { x, y, vx, vy } = sprite;
  x += vx * dt;
  y += vy * dt;
  if (x < 0) {
    x = -x;
    vx = Math.abs(vx);
  } else if (x > w - size) {
    x = Math.max(0, 2 * (w - size) - x);
    vx = -Math.abs(vx);
  }
  if (y < 0) {
    y = -y;
    vy = Math.abs(vy);
  } else if (y > h - size) {
    y = Math.max(0, 2 * (h - size) - y);
    vy = -Math.abs(vy);
  }
  return { x, y, vx, vy };
}

/** Starts the screensaver after the chosen idle time (not on phones or hidden tabs). */
export function useIdleScreensaver() {
  const enabled = useSettings((s) => s.screensaver);
  const minutes = useSettings((s) => s.screensaverMinutes);
  const phone = useDeviceMode() === 'phone';
  const active = useScreensaver((s) => s.active);

  useEffect(() => {
    if (!enabled || phone || active) return;
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (document.visibilityState === 'visible') {
          useScreensaver.getState().start();
        }
      }, minutes * 60_000);
    };
    const events = [...ACTIVITY, 'pointermove'] as const;
    for (const type of events) {
      window.addEventListener(type, arm, { passive: true, capture: true });
    }
    arm();
    return () => {
      window.clearTimeout(timer);
      for (const type of events) {
        window.removeEventListener(type, arm, { capture: true });
      }
    };
  }, [enabled, minutes, phone, active]);
}
