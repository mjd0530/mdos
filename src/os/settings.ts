import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PATTERNS, type PatternName } from '../assets/patterns';
import { storage } from './persist';

/** Visitor preferences, changed in Control Panel and remembered between visits (D-025). */
export interface SavedPlace {
  name: string;
  region?: string;
  latitude: number;
  longitude: number;
}

export type Display = 'color' | 'bw';

/** Light System 7-style highlight colours: black text on each passes 4.5:1 (tested). */
export const HIGHLIGHTS = {
  lavender: { name: 'Lavender', color: '#ccccff' },
  blue: { name: 'Blue', color: '#aad4ff' },
  gold: { name: 'Gold', color: '#ffdd77' },
  green: { name: 'Green', color: '#bbeeaa' },
  pink: { name: 'Pink', color: '#ffbbdd' },
  grey: { name: 'Grey', color: '#cccccc' },
} as const;
export type HighlightName = keyof typeof HIGHLIGHTS;

export interface Settings {
  /** Monitors: the colour System 7 look (default) or the original 1-bit look (D-031). */
  display: Display;
  highlight: HighlightName;
  pattern: PatternName;
  clock24h: boolean;
  weatherUnit: 'fahrenheit' | 'celsius';
  /** A city the visitor searched for. Never a "Use my location" position (D-026). */
  weatherPlace: SavedPlace | null;
  screensaver: boolean;
  /** Idle minutes before the screensaver starts. */
  screensaverMinutes: ScreensaverMinutes;
  cursorClock: boolean;
  sounds: boolean;
  /** 0–1. */
  volume: number;
}

export const SCREENSAVER_MINUTES = [1, 2, 5, 10, 30] as const;
export type ScreensaverMinutes = (typeof SCREENSAVER_MINUTES)[number];

export const DEFAULT_SETTINGS: Settings = {
  display: 'color',
  highlight: 'lavender',
  pattern: 'grey',
  clock24h: false,
  weatherUnit: 'fahrenheit',
  weatherPlace: null,
  screensaver: true,
  screensaverMinutes: 5,
  cursorClock: true,
  // On by default (Mike, D-029): short blips, only ever in response to a visitor's action.
  sounds: true,
  volume: 0.5,
};

function sanitizePlace(value: unknown): SavedPlace | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as Record<string, unknown>;
  const ok =
    typeof p.name === 'string' &&
    typeof p.latitude === 'number' &&
    Number.isFinite(p.latitude) &&
    Math.abs(p.latitude) <= 90 &&
    typeof p.longitude === 'number' &&
    Number.isFinite(p.longitude) &&
    Math.abs(p.longitude) <= 180;
  if (!ok) return null;
  return {
    name: p.name as string,
    region: typeof p.region === 'string' ? p.region : undefined,
    latitude: p.latitude as number,
    longitude: p.longitude as number,
  };
}

interface SettingsState extends Settings {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  restoreDefaults: () => void;
}

const bool = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback;

/** Keep only valid saved values; anything unknown falls back to the default. */
export function sanitizeSettings(saved: unknown): Settings {
  const value = (saved && typeof saved === 'object' ? saved : {}) as Record<
    string,
    unknown
  >;
  return {
    display:
      value.display === 'bw' || value.display === 'color'
        ? value.display
        : DEFAULT_SETTINGS.display,
    highlight:
      typeof value.highlight === 'string' && value.highlight in HIGHLIGHTS
        ? (value.highlight as HighlightName)
        : DEFAULT_SETTINGS.highlight,
    pattern:
      typeof value.pattern === 'string' && value.pattern in PATTERNS
        ? (value.pattern as PatternName)
        : DEFAULT_SETTINGS.pattern,
    clock24h:
      typeof value.clock24h === 'boolean'
        ? value.clock24h
        : DEFAULT_SETTINGS.clock24h,
    weatherUnit:
      value.weatherUnit === 'celsius' || value.weatherUnit === 'fahrenheit'
        ? value.weatherUnit
        : DEFAULT_SETTINGS.weatherUnit,
    weatherPlace: sanitizePlace(value.weatherPlace),
    screensaver: bool(value.screensaver, DEFAULT_SETTINGS.screensaver),
    screensaverMinutes: (SCREENSAVER_MINUTES as readonly unknown[]).includes(
      value.screensaverMinutes,
    )
      ? (value.screensaverMinutes as ScreensaverMinutes)
      : DEFAULT_SETTINGS.screensaverMinutes,
    cursorClock: bool(value.cursorClock, DEFAULT_SETTINGS.cursorClock),
    sounds: bool(value.sounds, DEFAULT_SETTINGS.sounds),
    volume:
      typeof value.volume === 'number' &&
      Number.isFinite(value.volume) &&
      value.volume >= 0 &&
      value.volume <= 1
        ? value.volume
        : DEFAULT_SETTINGS.volume,
  };
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (key, value) => set({ [key]: value } as Partial<Settings>),
      restoreDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'mikeos:settings',
      version: 1,
      storage,
      // Save every setting, none of the actions.
      partialize: (state) =>
        Object.fromEntries(
          Object.keys(DEFAULT_SETTINGS).map((key) => [
            key,
            state[key as keyof Settings],
          ]),
        ) as unknown as Settings,
      merge: (saved, current) => ({ ...current, ...sanitizeSettings(saved) }),
    },
  ),
);
