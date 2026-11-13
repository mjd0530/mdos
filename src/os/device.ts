import { useSyncExternalStore } from 'react';

/**
 * How MDOS adapts (D-024):
 * - phone: under 768px wide. A launcher: grid of icons, one full-screen window at a time.
 * - tablet: 768–1023px, or any touch-first screen. The desktop, with windows opening zoomed.
 * - desktop: everything else.
 */
export type DeviceMode = 'phone' | 'tablet' | 'desktop';

const PHONE = '(max-width: 767px)';
const TABLET = '(max-width: 1023px), (pointer: coarse)';

/** The mode right now, outside React (e.g. a one-off decision at start-up). */
export function currentMode(): DeviceMode {
  if (typeof window === 'undefined' || !window.matchMedia) return 'desktop';
  if (window.matchMedia(PHONE).matches) return 'phone';
  if (window.matchMedia(TABLET).matches) return 'tablet';
  return 'desktop';
}

function subscribe(onChange: () => void) {
  const queries = [PHONE, TABLET].map((q) => window.matchMedia(q));
  for (const q of queries) q.addEventListener('change', onChange);
  return () => {
    for (const q of queries) q.removeEventListener('change', onChange);
  };
}

export function useDeviceMode(): DeviceMode {
  return useSyncExternalStore(subscribe, currentMode, () => 'desktop');
}
